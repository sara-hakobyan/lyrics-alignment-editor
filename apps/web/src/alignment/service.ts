import { ApiError } from "../api";
import type {
  EditorTrack,
  Response,
  SaveAlignmentResponse,
  Segment,
  Track,
} from "../types";

import * as repository from "./repository";
import * as storage from "../storage/storage";

// Uses the server's `hint` when there is one, because it says what to fix.
function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 409) {
      return "Someone saved a newer version. Reload to get the latest.";
    }
    const body = e.body as { hint?: string } | undefined;
    return body?.hint ?? e.message;
  }
  return String(e);
}

export async function loadTrack(): Promise<Response<Track>> {
  try {
    const data = await repository.getTrack();
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: errorMessage(e) };
  }
}

export async function loadLocalTracks(): Promise<Response<EditorTrack[]>> {
  try {
    const tracks = await storage.getLocalTracks();
    // Each local track's latest saved version, lines and timings live under their own key.
    const data = await Promise.all(
      tracks.map(async (track) => {
        const saved = await storage.loadAlignment(track.id);
        return saved ? { ...track, ...saved } : track;
      })
    );
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: errorMessage(e) };
  }
}

export async function addLocalTrack(
  track: EditorTrack
): Promise<Response<EditorTrack>> {
  try {
    await storage.addLocalTrack(track);
    return { success: true, data: track, error: null };
  } catch (e) {
    return { success: false, data: null, error: errorMessage(e) };
  }
}

export async function saveAlignment(
  track: EditorTrack,
  segments: Segment[]
): Promise<Response<SaveAlignmentResponse>> {
  try {
    const data = track.isLocal
      ? await storage.saveAlignment(track.id, {
          version: track.version,
          lines: track.lines,
          segments,
        })
      : await repository.saveAlignment({
          version: track.version,
          lines: track.lines,
          segments,
        });

    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: errorMessage(e) };
  }
}
