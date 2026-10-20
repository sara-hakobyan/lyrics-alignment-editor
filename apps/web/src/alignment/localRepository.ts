import type {
  EditorTrack,
  SaveAlignmentRequest,
  SaveAlignmentResponse,
} from "../types";

const storageKey = (trackId: string) => `alignment:${trackId}`;
const TRACKS_KEY = "local-tracks";

export async function getLocalTracks(): Promise<EditorTrack[]> {
  try {
    const raw = localStorage.getItem(TRACKS_KEY);
    return raw ? (JSON.parse(raw) as EditorTrack[]) : [];
  } catch {
    return [];
  }
}

export async function addLocalTrack(track: EditorTrack): Promise<void> {
  const tracks = await getLocalTracks();
  localStorage.setItem(TRACKS_KEY, JSON.stringify([...tracks, track]));
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
  localStorage.setItem(storageKey(trackId), JSON.stringify(saved));
  return saved;
}

export async function loadAlignment(
  trackId: string
): Promise<SaveAlignmentResponse | null> {
  try {
    const raw = localStorage.getItem(storageKey(trackId));
    return raw ? (JSON.parse(raw) as SaveAlignmentResponse) : null;
  } catch {
    return null;
  }
}
