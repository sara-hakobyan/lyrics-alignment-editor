import type { EditorTrack, Segment } from "../types";

// One pass from the last line up: each timed line ends where the next timed
// line starts, and the last one ends with the track.
export function buildSegments(
  track: EditorTrack,
  startTimesMs: Record<string, number>
): Segment[] {
  const segments: Segment[] = [];

  let nextStartMs = Math.round((track.duration_seconds ?? 0) * 1000);
  for (let i = track.lines.length - 1; i >= 0; i--) {
    const lineId = track.lines[i].id;
    const startMs = startTimesMs[lineId];
    if (startMs === undefined) continue;

    segments.push({ line_id: lineId, start_ms: startMs, end_ms: nextStartMs });
    nextStartMs = startMs;
  }

  return segments.reverse();
}
