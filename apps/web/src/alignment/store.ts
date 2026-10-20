import { create } from "zustand";
import type { EditorTrack, Segment } from "../types";
import { wait } from "../utils";
import * as service from "./service";

// Loaders stay up at least this long, so a fast response doesn't just flash them.
const MIN_LOADING_MS = 1000;

type AlignmentState = {
  track: EditorTrack | null;
  tracks: EditorTrack[];
  error: string | null;
  isLoading: boolean;
  loadTrack: () => Promise<void>;
  addTrack: (track: EditorTrack) => Promise<void>;
  selectTrack: (trackId: string) => void;
  setDuration: (seconds: number) => void;
  saveAlignment: (segments: Segment[]) => Promise<void>;
};

export const useAlignmentStore = create<AlignmentState>((set, get) => ({
  track: null,
  tracks: [],
  error: null,
  isLoading: false,

  loadTrack: async () => {
    set({ isLoading: true });
    const [result, localResult] = await Promise.all([
      service.loadTrack(),
      service.loadLocalTracks(),
      wait(MIN_LOADING_MS),
    ]);
    const localTracks = localResult.data ?? [];

    if (result.success && result.data) {
      const backendTrack: EditorTrack = { ...result.data, isLocal: false };
      set({
        track: backendTrack,
        tracks: [backendTrack, ...localTracks],
        error: null,
        isLoading: false,
      });
    }
    // Local tracks still show if the backend is down.
    else {
      set({
        track: localTracks[0] ?? null,
        tracks: localTracks,
        error: result.error,
        isLoading: false,
      });
    }
  },

  addTrack: async (track) => {
    const result = await service.addLocalTrack(track);
    if (result.success) {
      set((state) => ({ tracks: [...state.tracks, track], error: null }));
    } else {
      set({ error: result.error });
    }
  },

  saveAlignment: async (segments) => {
    const track = get().track;
    if (!track) return;

    set({ isLoading: true });
    const [result] = await Promise.all([
      service.saveAlignment(track, segments),
      wait(MIN_LOADING_MS),
    ]);
    if (result.success && result.data) {
      const saved = result.data;
      // keep title/audio, take the new version, lines and alignment
      const updated = { ...track, ...saved };
      set((state) => ({
        track: updated,
        tracks: state.tracks.map((t) => (t.id === updated.id ? updated : t)),
        error: null,
        isLoading: false,
      }));
    } else {
      set({ error: result.error, isLoading: false });
    }
  },

  selectTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    if (track) set({ track });
  },

  setDuration: (seconds) => {
    const track = get().track;
    if (!track || !Number.isFinite(seconds)) return;

    const updated = { ...track, duration_seconds: seconds };
    set((state) => ({
      track: updated,
      tracks: state.tracks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  },
}));
