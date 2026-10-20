import type {
  EditorTrack,
  SaveAlignmentRequest,
  SaveAlignmentResponse,
} from "../types";
import { db } from "./db";

export async function getLocalTracks(): Promise<EditorTrack[]> {
  const tracks = await db.tracks.toArray();
  // blob: URLs die on reload, so each load makes new ones from the stored files.
  return Promise.all(
    tracks.map(async (track) => {
      const audio = await db.audio.get(track.id);
      return { ...track, audio_url: audio ? URL.createObjectURL(audio) : "" };
    })
  );
}

export async function addLocalTrack(
  track: EditorTrack,
  audio: File
): Promise<void> {
  // Saved together, so there's never a track without its audio.
  await db.transaction("rw", db.tracks, db.audio, async () => {
    await db.tracks.add({ ...track, audio_url: "" });
    await db.audio.put(audio, track.id);
  });
}

export async function deleteLocalTrack(trackId: string): Promise<void> {
  await db.transaction("rw", db.tracks, db.alignments, db.audio, async () => {
    // `tracks` is keyed by auto-increment, so the track is found through its `id` index.
    await db.tracks.where("id").equals(trackId).delete();
    await db.alignments.delete(trackId);
    await db.audio.delete(trackId);
  });
}

export async function updateLocalTrack(track: EditorTrack): Promise<void> {
  await db.transaction("rw", db.tracks, db.alignments, async () => {
    await db.tracks
      .where("id")
      .equals(track.id)
      .modify({ ...track, audio_url: "" });

    // A saved alignment's lines replace the track's lines on load, so they're updated too.
    const saved = await db.alignments.get(track.id);
    if (saved)
      await db.alignments.put({ ...saved, lines: track.lines }, track.id);
  });
}

export async function getLocalAudio(
  trackId: string
): Promise<File | undefined> {
  return db.audio.get(trackId);
}

// Same input and output as PUT /api/v1/track/alignment.
export async function saveAlignment(
  trackId: string,
  body: SaveAlignmentRequest
): Promise<SaveAlignmentResponse> {
  const saved: SaveAlignmentResponse = {
    version: body.version + 1,
    lines: body.lines,
    alignment: { segments: body.segments },
  };
  await db.alignments.put(saved, trackId);
  return saved;
}

export async function loadAlignment(
  trackId: string
): Promise<SaveAlignmentResponse | null> {
  return (await db.alignments.get(trackId)) ?? null;
}
