import isEqual from "lodash/isEqual";
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

// The start times from the track's last save: line id → ms.
export function savedStartTimes(track: EditorTrack): Record<string, number> {
  return Object.fromEntries(
    (track.alignment?.segments ?? []).map((s) => [s.line_id, s.start_ms])
  );
}

// Whether a track's current stamps differ from its last save. A track that
// was never opened has no stamps of its own yet, so nothing is unsaved.
export function hasUnsavedChanges(
  track: EditorTrack,
  startTimesMs: Record<string, number> | undefined
): boolean {
  return (
    startTimesMs !== undefined && !isEqual(startTimesMs, savedStartTimes(track))
  );
}

export type ShiftLimits = { earliestMs: number; latestMs: number };

// How far the given lines can move together without any of them starting
// before 0 or at the end of the track (which would fail findTimingIssues).
// Untimed lines are ignored; null when none of the lines is timed.
export function shiftLimits(
  startTimesMs: Record<string, number>,
  lineIds: string[],
  durationMs: number
): ShiftLimits | null {
  const starts = lineIds
    .map((id) => startTimesMs[id])
    .filter((ms) => ms !== undefined);
  if (starts.length === 0) return null;

  return {
    earliestMs: -Math.min(...starts),
    latestMs: durationMs - 1 - Math.max(...starts),
  };
}

// Whether the given lines can move by `deltaMs` together: they must stay inside
// the track, and the move mustn't give any line a timing issue it doesn't have
// now. A line that's already broken can still be moved, so it can be fixed.
export function canShift(
  track: EditorTrack,
  startTimesMs: Record<string, number>,
  lineIds: string[],
  deltaMs: number
): boolean {
  const durationMs = Math.round((track.duration_seconds ?? 0) * 1000);
  const limits = shiftLimits(startTimesMs, lineIds, durationMs);
  if (!limits || deltaMs < limits.earliestMs || deltaMs > limits.latestMs) {
    return false;
  }

  const moved = { ...startTimesMs };
  for (const lineId of lineIds) {
    if (moved[lineId] !== undefined) moved[lineId] += deltaMs;
  }

  const brokenNow = new Set(
    findTimingIssues(buildSegments(track, startTimesMs)).map((i) => i.lineId)
  );
  return findTimingIssues(buildSegments(track, moved)).every((issue) =>
    brokenNow.has(issue.lineId)
  );
}

export type TimingIssue = { lineId: string; message: string };

// Every line must end after it starts. Because each line ends where the next
// timed line starts, this catches out-of-order stamps, two lines with the same
// time, and a start past the end of the track.
export function findTimingIssues(segments: Segment[]): TimingIssue[] {
  const issues: TimingIssue[] = [];

  segments.forEach((segment, i) => {
    if (segment.end_ms > segment.start_ms) return;

    const isLast = i === segments.length - 1;
    issues.push({
      lineId: segment.line_id,
      message: isLast
        ? "Starts after the end of the track"
        : "Starts at or after the next timed line",
    });
  });

  return issues;
}
