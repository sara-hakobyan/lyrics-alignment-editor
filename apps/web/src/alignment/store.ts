import { create } from "zustand";
import type { EditorTrack, NewTrackInput } from "../types";
import { wait } from "../utils";
import { buildSegments } from "./segments";
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
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  loadTracks: () => Promise<void>;
  addTrack: (input: NewTrackInput) => Promise<void>;
  selectTrack: (trackId: string) => void;
  setDuration: (seconds: number) => void;
  selectLine: (lineId: string | null) => void;
  stampLine: (seconds: number) => void;
  clearLineTiming: (lineId: string) => void;
  saveAlignment: () => Promise<void>;
};

const replaceTrack = (tracks: EditorTrack[], updated: EditorTrack) =>
  tracks.map((t) => (t.id === updated.id ? updated : t));

const savedStartTimes = (track: EditorTrack): StartTimes =>
  Object.fromEntries(
    (track.alignment?.segments ?? []).map((s) => [s.line_id, s.start_ms])
  );

const withStartTimes = (
  state: EditorState,
  trackId: string,
  startTimes: StartTimes
) => ({ ...state.startTimesByTrack, [trackId]: startTimes });

// Makes `track` the current one. Its saved timings are only used the first
// time it's opened; after that its own stamps are kept.
const openTrack = (state: EditorState, track: EditorTrack) => ({
  track,
  selectedLineId: track.lines[0]?.id ?? null,
  startTimesByTrack: withStartTimes(
    state,
    track.id,
    state.startTimesByTrack[track.id] ?? savedStartTimes(track)
  ),
});

export const useEditorStore = create<EditorState>((set, get) => ({
  track: null,
  tracks: [],
  startTimesByTrack: {},
  selectedLineId: null,
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
        error: null,
        isLoading: false,
      }));
    }
    // Local tracks still show if the backend is down.
    else {
      const firstLocal = localTracks[0];
      set((state) => ({
        ...(firstLocal ? openTrack(state, firstLocal) : { track: null }),
        tracks: localTracks,
        error: result.error,
        isLoading: false,
      }));
    }
  },

  addTrack: async (input) => {
    const result = await service.createLocalTrack(input);
    if (result.success && result.data) {
      const track = result.data;
      set((state) => ({ tracks: [...state.tracks, track], error: null }));
    } else {
      set({ error: result.error });
    }
  },

  saveAlignment: async () => {
    const { track, startTimesByTrack } = get();
    if (!track) return;

    set({ isSaving: true });
    const segments = buildSegments(track, startTimesByTrack[track.id] ?? {});
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
      startTimesByTrack: withStartTimes(state, track.id, {
        ...state.startTimesByTrack[track.id],
        [selectedLineId]: Math.round(seconds * 1000),
      }),
      selectedLineId: track.lines[index + 1]?.id ?? null,
    }));
  },

  clearLineTiming: (lineId) => {
    const track = get().track;
    if (!track) return;

    set((state) => {
      const updated = { ...state.startTimesByTrack[track.id] };
      delete updated[lineId];
      return {
        startTimesByTrack: withStartTimes(state, track.id, updated),
        selectedLineId: lineId,
      };
    });
  },
}));
