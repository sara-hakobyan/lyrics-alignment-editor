import { create, type StoreApi } from "zustand";
import type {
  EditorTrack,
  Line,
  NewTrackInput,
  SavedAlignmentState,
} from "../types";
import { wait } from "../utils";
import {
  buildSegments,
  canShift,
  findTimingIssues,
  getSavedStartTimes,
  getSavedTexts,
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
  // Lines per track id, text edits included, like startTimesByTrack.
  // `track.lines` stays the last saved version.
  linesByTrack: Record<string, Line[]>;
  selectedLineId: string | null;
  // Lines ticked for bulk actions; separate from the line selected for stamping.
  checkedLineIds: string[];
  // Loading and track errors (add, edit, delete, audio). Save errors are per track.
  error: string | null;
  // Per track id, so a save that fails after a track switch stays with its track.
  saveErrorsByTrack: Record<string, string>;
  // The server's latest saved state from a 409, per track id.
  conflictsByTrack: Record<string, SavedAlignmentState>;
  // The dialog is always about the open track.
  isConflictDialogOpen: boolean;
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
  editLine: (lineId: string, text: string) => void;
  clearTimings: (lineIds: string[]) => void;
  resetLines: (lineIds: string[]) => void;
  setCheckedLineIds: (lineIds: string[]) => void;
  nudgeLines: (deltaMs: number, lineIds: string[]) => void;
  resetTimings: () => Promise<void>;
  saveAlignment: () => Promise<void>;
  reviewSaveConflict: () => void;
  dismissSaveConflict: () => void;
  useLatestSavedVersion: (trackId: string) => void;
  replaceWithMyVersion: (trackId: string) => Promise<void>;
};

const replaceTrack = (tracks: EditorTrack[], updated: EditorTrack) =>
  tracks.map((t) => (t.id === updated.id ? updated : t));

// The track's lines with text edits, or its saved lines before it's opened.
export const getLines = (state: EditorState, track: EditorTrack) =>
  state.linesByTrack[track.id] ?? track.lines;

// A copy of the record without the given key.
const without = <T>(record: Record<string, T>, key: string) => {
  const copy = { ...record };
  delete copy[key];
  return copy;
};

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

// Makes `track` the current one. Its saved timings and lines are only used the
// first time it's opened; after that its own stamps and text edits are kept.
const openTrack = (state: EditorState, track: EditorTrack) => ({
  track,
  selectedLineId: track.lines[0]?.id ?? null,
  checkedLineIds: [],
  startTimesByTrack: withStartTimes(
    state,
    track.id,
    state.startTimesByTrack[track.id] ?? getSavedStartTimes(track)
  ),
  linesByTrack: { ...state.linesByTrack, [track.id]: getLines(state, track) },
});

// Both ordinary saves and explicit replacements use the same validation and
// completion path. The snapshot being saved never replaces a newer live draft.
async function persistAlignment(
  set: StoreApi<EditorState>["setState"],
  get: StoreApi<EditorState>["getState"],
  trackId: string,
  expectedVersion?: number
) {
  const state = get();
  const savedTrack = state.tracks.find((track) => track.id === trackId);
  if (!savedTrack || state.isSaving) return;
  const track = {
    ...savedTrack,
    version: expectedVersion ?? savedTrack.version,
    lines: getLines(state, savedTrack),
  };
  const segments = buildSegments(track, state.startTimesByTrack[trackId] ?? {});
  const issues = findTimingIssues(segments);
  if (issues.length > 0) {
    const count =
      issues.length === 1 ? "1 line has" : `${issues.length} lines have`;
    set((s) => ({
      saveErrorsByTrack: {
        ...s.saveErrorsByTrack,
        [trackId]: `${count} invalid timing. Fix the lines marked in red, then save.`,
      },
    }));
    return;
  }

  set((s) => ({
    isSaving: true,
    saveErrorsByTrack: without(s.saveErrorsByTrack, trackId),
  }));
  const [result] = await Promise.all([
    service.saveAlignment(track, segments),
    wait(MIN_LOADING_MS),
  ]);
  set((s) => {
    const current = s.tracks.find((item) => item.id === trackId);
    if (!current) return { isSaving: false };
    if (result.success && result.data) {
      const updated = { ...current, ...result.data };
      return {
        track: s.track?.id === trackId ? updated : s.track,
        tracks: replaceTrack(s.tracks, updated),
        conflictsByTrack: without(s.conflictsByTrack, trackId),
        saveErrorsByTrack: without(s.saveErrorsByTrack, trackId),
        isConflictDialogOpen:
          s.track?.id === trackId ? false : s.isConflictDialogOpen,
        isSaving: false,
      };
    }
    if (result.conflict) {
      return {
        conflictsByTrack: { ...s.conflictsByTrack, [trackId]: result.conflict },
        // A delayed response belongs to the original track, even after a switch.
        isConflictDialogOpen: s.track?.id === trackId || s.isConflictDialogOpen,
        isSaving: false,
      };
    }
    return {
      saveErrorsByTrack: {
        ...s.saveErrorsByTrack,
        [trackId]: result.error ?? "Couldn't save. Please try again.",
      },
      isSaving: false,
    };
  });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  track: null,
  tracks: [],
  startTimesByTrack: {},
  linesByTrack: {},
  selectedLineId: null,
  checkedLineIds: [],
  error: null,
  saveErrorsByTrack: {},
  conflictsByTrack: {},
  isConflictDialogOpen: false,
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
      startTimesByTrack: without(state.startTimesByTrack, trackId),
      linesByTrack: without(state.linesByTrack, trackId),
      saveErrorsByTrack: without(state.saveErrorsByTrack, trackId),
      conflictsByTrack: without(state.conflictsByTrack, trackId),
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
        // The form stores the lines, edited text included, so none is unsaved now.
        linesByTrack: { ...state.linesByTrack, [updated.id]: updated.lines },
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
    if (!track || get().isSaving) return;

    set((state) => ({
      startTimesByTrack: withStartTimes(state, track.id, {}),
      selectedLineId: track.lines[0]?.id ?? null,
    }));
    await get().saveAlignment();
  },

  saveAlignment: async () => {
    const { track, isSaving, conflictsByTrack } = get();
    if (!track || isSaving) return;
    if (conflictsByTrack[track.id]) {
      set({ isConflictDialogOpen: true });
      return;
    }
    await persistAlignment(set, get, track.id);
  },

  reviewSaveConflict: () => {
    const { track, conflictsByTrack } = get();
    if (track && conflictsByTrack[track.id])
      set({ isConflictDialogOpen: true });
  },

  dismissSaveConflict: () => {
    if (!get().isSaving) set({ isConflictDialogOpen: false });
  },

  useLatestSavedVersion: (trackId) => {
    const state = get();
    const conflict = state.conflictsByTrack[trackId];
    const track = state.tracks.find((item) => item.id === trackId);
    if (!conflict || !track || state.isSaving) return;
    const updated = { ...track, ...conflict };
    const isOpen = state.track?.id === trackId;
    const selectionExists = updated.lines.some(
      (line) => line.id === state.selectedLineId
    );
    set({
      track: isOpen ? updated : state.track,
      tracks: replaceTrack(state.tracks, updated),
      linesByTrack: { ...state.linesByTrack, [trackId]: updated.lines },
      startTimesByTrack: withStartTimes(
        state,
        trackId,
        getSavedStartTimes(updated)
      ),
      selectedLineId:
        isOpen && !selectionExists
          ? updated.lines[0]?.id ?? null
          : state.selectedLineId,
      checkedLineIds: isOpen ? [] : state.checkedLineIds,
      conflictsByTrack: without(state.conflictsByTrack, trackId),
      saveErrorsByTrack: without(state.saveErrorsByTrack, trackId),
      isConflictDialogOpen: isOpen ? false : state.isConflictDialogOpen,
    });
  },

  replaceWithMyVersion: async (trackId) => {
    const conflict = get().conflictsByTrack[trackId];
    if (conflict) {
      await persistAlignment(set, get, trackId, conflict.version);
    }
  },

  selectTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    // Re-selecting the current track keeps the selected line.
    if (!track || track.id === get().track?.id) return;
    set((state) => ({
      ...openTrack(state, track),
      isConflictDialogOpen: false,
    }));
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

  // Replaces one line's text in the open track's draft. Nothing is stored here;
  // the new lines go out with "Save changes". The line keeps its id, so its timing stays.
  editLine: (lineId, text) => {
    const track = get().track;
    const newText = text.trim();
    if (!track || newText === "") return;

    set((state) => ({
      linesByTrack: {
        ...state.linesByTrack,
        [track.id]: getLines(state, track).map((line) =>
          line.id === lineId ? { ...line, text: newText } : line
        ),
      },
    }));
  },

  // Removes the timing of every given line.
  clearTimings: (lineIds) => {
    const track = get().track;
    if (!track) return;

    set((state) => ({
      startTimesByTrack: updateStartTimes(state, track.id, (startTimes) => {
        for (const lineId of lineIds) delete startTimes[lineId];
      }),
    }));
  },

  // Puts the given lines back to their last save: start time (or untimed) and text.
  resetLines: (lineIds) => {
    const track = get().track;
    if (!track) return;

    const savedStartTimes = getSavedStartTimes(track);
    const savedTextById = getSavedTexts(track);
    const ids = new Set(lineIds);

    set((state) => ({
      linesByTrack: {
        ...state.linesByTrack,
        [track.id]: getLines(state, track).map((line) =>
          ids.has(line.id)
            ? { ...line, text: savedTextById.get(line.id) ?? line.text }
            : line
        ),
      },
      startTimesByTrack: updateStartTimes(state, track.id, (startTimes) => {
        for (const lineId of lineIds) {
          const savedMs = savedStartTimes[lineId];
          if (savedMs === undefined) delete startTimes[lineId];
          else startTimes[lineId] = savedMs;
        }
      }),
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
