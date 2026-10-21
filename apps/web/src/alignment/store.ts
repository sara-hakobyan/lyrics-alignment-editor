import { create } from "zustand";
import type { EditorTrack, NewTrackInput } from "../types";
import { wait } from "../utils";
import {
  buildSegments,
  canShift,
  findTimingIssues,
  getSavedStartTimes,
  shiftStartTimes,
} from "./timings";
import * as service from "./service";

// Loaders stay up at least this long, so a fast response doesn't just flash them.
const MIN_LOADING_MS = 1000;

// Line id → start time in ms.
type StartTimes = Record<string, number>;

type EditorState = {
  track: EditorTrack | null;
  tracks: EditorTrack[];
  // Stamps per track id, saved or not, so switching tracks keeps them.
  startTimesByTrack: Record<string, StartTimes>;
  selectedLineId: string | null;
  // Lines ticked for bulk actions; separate from the line selected for stamping.
  checkedLineIds: string[];
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  loadTracks: () => Promise<void>;
  // Both resolve to whether it worked, so the form knows whether to close.
  addTrack: (input: NewTrackInput) => Promise<boolean>;
  deleteTrack: (trackId: string) => Promise<void>;
  updateTrack: (track: EditorTrack, input: NewTrackInput) => Promise<boolean>;
  loadAudioFile: (trackId: string) => Promise<File | null>;
  selectTrack: (trackId: string) => void;
  setDuration: (seconds: number) => void;
  selectLine: (lineId: string | null) => void;
  stampLine: (seconds: number) => void;
  clearLineTiming: (lineId: string) => void;
  revertLine: (lineId: string) => void;
  setCheckedLineIds: (lineIds: string[]) => void;
  nudgeLines: (deltaMs: number, lineIds: string[]) => void;
  resetTimings: () => Promise<void>;
  saveAlignment: () => Promise<void>;
};

const replaceTrack = (tracks: EditorTrack[], updated: EditorTrack) =>
  tracks.map((t) => (t.id === updated.id ? updated : t));

const withStartTimes = (
  state: EditorState,
  trackId: string,
  startTimes: StartTimes
) => ({ ...state.startTimesByTrack, [trackId]: startTimes });

// Changes a copy of one track's start times, for `startTimesByTrack`.
const updateStartTimes = (
  state: EditorState,
  trackId: string,
  change: (startTimes: StartTimes) => void
) => {
  const updated = { ...state.startTimesByTrack[trackId] };
  change(updated);
  return withStartTimes(state, trackId, updated);
};

// Makes `track` the current one. Its saved timings are only used the first
// time it's opened; after that its own stamps are kept.
const openTrack = (state: EditorState, track: EditorTrack) => ({
  track,
  selectedLineId: track.lines[0]?.id ?? null,
  checkedLineIds: [],
  startTimesByTrack: withStartTimes(
    state,
    track.id,
    state.startTimesByTrack[track.id] ?? getSavedStartTimes(track)
  ),
});

export const useEditorStore = create<EditorState>((set, get) => ({
  track: null,
  tracks: [],
  startTimesByTrack: {},
  selectedLineId: null,
  checkedLineIds: [],
  error: null,
  isLoading: false,
  isSaving: false,

  loadTracks: async () => {
    set({ isLoading: true });
    const [result, localResult] = await Promise.all([
      service.loadTrack(),
      service.loadLocalTracks(),
      wait(MIN_LOADING_MS),
    ]);
    const localTracks = localResult.data ?? [];

    if (result.success && result.data) {
      const backendTrack: EditorTrack = { ...result.data, isLocal: false };
      set((state) => ({
        ...openTrack(state, backendTrack),
        tracks: [backendTrack, ...localTracks],
        // The backend track still shows if the local tracks fail to load.
        error: localResult.error,
        isLoading: false,
      }));
    }
    // Local tracks still show if the backend is down.
    else {
      const firstLocal = localTracks[0];
      set((state) => ({
        ...(firstLocal ? openTrack(state, firstLocal) : { track: null }),
        tracks: localTracks,
        error: result.error ?? localResult.error,
        isLoading: false,
      }));
    }
  },

  addTrack: async (input) => {
    const result = await service.createLocalTrack(input);
    if (result.success && result.data) {
      const track = result.data;
      set((state) => ({ tracks: [...state.tracks, track], error: null }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  deleteTrack: async (trackId) => {
    const result = await service.deleteLocalTrack(trackId);
    if (!result.success) {
      set({ error: result.error });
      return;
    }

    const wasOpen = get().track?.id === trackId;
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      error: null,
    }));

    // The open track is gone, so the first one left is opened.
    if (wasOpen) {
      const next = get().tracks[0];
      if (next) get().selectTrack(next.id);
      else set({ track: null, selectedLineId: null, checkedLineIds: [] });
    }
  },

  updateTrack: async (track, input) => {
    const result = await service.updateLocalTrack(track, input);
    if (result.success && result.data) {
      const updated = result.data;
      set((state) => ({
        track: state.track?.id === updated.id ? updated : state.track,
        tracks: replaceTrack(state.tracks, updated),
        error: null,
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  // Returns the track's stored audio so the edit form can be filled with it.
  loadAudioFile: async (trackId) => {
    const result = await service.loadLocalAudio(trackId);
    if (!result.success) set({ error: result.error });
    return result.data;
  },

  // Clears every timing of the open track and saves the empty alignment straight away.
  resetTimings: async () => {
    const track = get().track;
    if (!track) return;

    set((state) => ({
      startTimesByTrack: withStartTimes(state, track.id, {}),
      selectedLineId: track.lines[0]?.id ?? null,
    }));
    await get().saveAlignment();
  },

  saveAlignment: async () => {
    const { track, startTimesByTrack } = get();
    if (!track) return;

    const segments = buildSegments(track, startTimesByTrack[track.id] ?? {});
    // Invalid timings are never sent: the API would reject them, and local saves wouldn't.
    const issues = findTimingIssues(segments);
    if (issues.length > 0) {
      const count =
        issues.length === 1 ? "1 line has" : `${issues.length} lines have`;
      set({
        error: `${count} invalid timing. Fix the lines marked in red, then save.`,
      });
      return;
    }

    set({ isSaving: true });
    const [result] = await Promise.all([
      service.saveAlignment(track, segments),
      wait(MIN_LOADING_MS),
    ]);
    if (result.success && result.data) {
      const saved = result.data;
      // keep title/audio, take the new version, lines and alignment
      const updated = { ...track, ...saved };
      set((state) => ({
        // The user may have switched tracks while the save was running.
        track: state.track?.id === updated.id ? updated : state.track,
        checkedLineIds:
          state.track?.id === updated.id ? [] : state.checkedLineIds,
        tracks: replaceTrack(state.tracks, updated),
        error: null,
        isSaving: false,
      }));
    } else {
      set({ error: result.error, isSaving: false });
    }
  },

  selectTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    // Re-selecting the current track keeps the selected line.
    if (!track || track.id === get().track?.id) return;
    set((state) => openTrack(state, track));
  },

  setDuration: (seconds) => {
    const track = get().track;
    if (!track || !Number.isFinite(seconds)) return;

    const updated = { ...track, duration_seconds: seconds };
    set((state) => ({
      track: updated,
      tracks: replaceTrack(state.tracks, updated),
    }));
  },

  selectLine: (lineId) => set({ selectedLineId: lineId }),

  // Stamps the selected line with the playback time, then moves the
  // selection to the next line so the user can keep tapping.
  stampLine: (seconds) => {
    const { track, selectedLineId } = get();
    if (!track || !selectedLineId) return;

    const index = track.lines.findIndex((line) => line.id === selectedLineId);
    if (index === -1) return;

    set((state) => ({
      startTimesByTrack: updateStartTimes(state, track.id, (startTimes) => {
        startTimes[selectedLineId] = Math.round(seconds * 1000);
      }),
      selectedLineId: track.lines[index + 1]?.id ?? null,
    }));
  },

  clearLineTiming: (lineId) => {
    const track = get().track;
    if (!track) return;

    set((state) => ({
      startTimesByTrack: updateStartTimes(state, track.id, (startTimes) => {
        delete startTimes[lineId];
      }),
      selectedLineId: lineId,
    }));
  },

  // Puts a line back to its last saved start time, or untimed if it was never saved.
  revertLine: (lineId) => {
    const track = get().track;
    if (!track) return;

    const savedMs = getSavedStartTimes(track)[lineId];
    set((state) => ({
      startTimesByTrack: updateStartTimes(state, track.id, (startTimes) => {
        if (savedMs === undefined) delete startTimes[lineId];
        else startTimes[lineId] = savedMs;
      }),
      selectedLineId: lineId,
    }));
  },

  setCheckedLineIds: (lineIds) => set({ checkedLineIds: lineIds }),

  // Moves every given, timed line by `deltaMs`, keeping their spacing.
  // A step that would leave the track or break a line's timing does nothing.
  nudgeLines: (deltaMs, lineIds) => {
    const { track, startTimesByTrack } = get();
    if (!track) return;

    const startTimes = startTimesByTrack[track.id] ?? {};
    const brokenLineIds = new Set(
      findTimingIssues(buildSegments(track, startTimes)).map((i) => i.lineId)
    );
    if (!canShift(track, startTimes, brokenLineIds, lineIds, deltaMs)) return;

    set((state) => ({
      startTimesByTrack: withStartTimes(
        state,
        track.id,
        shiftStartTimes(startTimes, lineIds, deltaMs)
      ),
    }));
  },
}));
