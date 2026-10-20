import { ApiError } from "../api";
import type {
  EditorTrack,
  NewTrackInput,
  Result,
  SaveAlignmentRequest,
  SaveAlignmentResponse,
  Segment,
  Track,
} from "../types";
import { parseLyrics, reuseLineIds } from "../utils";

import * as remoteRepository from "./remoteRepository";
import * as localRepository from "./localRepository";

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

// Runs the call and turns its result or thrown error into a Result.
async function toResult<T>(call: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await call();
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: errorMessage(e) };
  }
}

export function loadTrack(): Promise<Result<Track>> {
  return toResult(() => remoteRepository.getTrack());
}

export function loadLocalTracks(): Promise<Result<EditorTrack[]>> {
  return toResult(async () => {
    const tracks = await localRepository.getLocalTracks();
    // Each local track's latest saved version, lines and timings live under their own key.
    return Promise.all(
      tracks.map(async (track) => {
        const saved = await localRepository.loadAlignment(track.id);
        return saved ? { ...track, ...saved } : track;
      })
    );
  });
}

export function createLocalTrack(
  input: NewTrackInput
): Promise<Result<EditorTrack>> {
  return toResult(async () => {
    const track: EditorTrack = {
      id: crypto.randomUUID(),
      title: input.title.trim() || "Untitled track",
      artist: input.artist.trim() || "Unknown artist",
      duration_seconds: 0, // unknown until the audio loads
      audio_url: URL.createObjectURL(input.audioFile),
      lines: parseLyrics(input.lyrics),
      version: 0,
      alignment: null, // nothing timed yet
      isLocal: true,
    };
    await localRepository.addLocalTrack(track, input.audioFile);
    return track;
  });
}

export function deleteLocalTrack(trackId: string): Promise<Result<void>> {
  return toResult(() => localRepository.deleteLocalTrack(trackId));
}

export function loadLocalAudio(trackId: string): Promise<Result<File>> {
  return toResult(async () => {
    const file = await localRepository.getLocalAudio(trackId);
    if (!file) throw new Error("This track's audio file is missing.");
    return file;
  });
}

export function updateLocalTrack(
  track: EditorTrack,
  input: NewTrackInput
): Promise<Result<EditorTrack>> {
  return toResult(async () => {
    const updated: EditorTrack = {
      ...track,
      title: input.title.trim() || "Untitled track",
      artist: input.artist.trim() || "Unknown artist",
      lines: reuseLineIds(track.lines, parseLyrics(input.lyrics)),
    };
    await localRepository.updateLocalTrack(updated);
    return updated;
  });
}

export function saveAlignment(
  track: EditorTrack,
  segments: Segment[]
): Promise<Result<SaveAlignmentResponse>> {
  const body: SaveAlignmentRequest = {
    version: track.version,
    lines: track.lines,
    segments,
  };

  return toResult(() =>
    track.isLocal
      ? localRepository.saveAlignment(track.id, body)
      : remoteRepository.saveAlignment(body)
  );
}
