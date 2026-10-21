import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { getLines, useEditorStore } from "../data-alignment/store";
import {
  buildSegments,
  canShift,
  findTimingIssues,
  getSavedStartTimes,
  getSavedTexts,
  isLineUnsaved,
} from "../data-alignment/timings";
import type { Line } from "../types";

// Same object every time, so the store selector doesn't see a "change" when a track has no stamps.
const NO_START_TIMES: Record<string, number> = {};
const NO_LINES: Line[] = [];

// The open track's lines, start times and everything worked out from them. Each
// component that calls this recomputes only when the track, its lines or its stamps change.
export function useTimingState() {
  const { track, lines, startTimesMs } = useEditorStore(
    useShallow((s) => ({
      track: s.track,
      // With text edits; `track.lines` is the last saved version.
      lines: s.track ? getLines(s, s.track) : NO_LINES,
      startTimesMs: s.track
        ? s.startTimesByTrack[s.track.id] ?? NO_START_TIMES
        : NO_START_TIMES,
    }))
  );

  const { segments, endMsByLineId, issueByLineId } = useMemo(() => {
    const segments = track ? buildSegments(track, startTimesMs) : [];
    return {
      segments,
      endMsByLineId: new Map(segments.map((s) => [s.line_id, s.end_ms])),
      issueByLineId: new Map(
        findTimingIssues(segments).map((issue) => [issue.lineId, issue.message])
      ),
    };
  }, [track, startTimesMs]);

  // The last saved start times and texts, for the unsaved dots and Undo.
  const { savedStartTimesMs, savedTextById } = useMemo(
    () => ({
      savedStartTimesMs: track ? getSavedStartTimes(track) : NO_START_TIMES,
      savedTextById: track ? getSavedTexts(track) : new Map<string, string>(),
    }),
    [track]
  );

  // Whether a line's start time or text differs from its last save.
  const isUnsaved = (line: Line) =>
    isLineUnsaved(line, startTimesMs, savedStartTimesMs, savedTextById);

  // False for a step that would leave the track or break a line's timing.
  const canNudge = (deltaMs: number, lineIds: string[]) =>
    !!track && canShift(track, startTimesMs, issueByLineId, lineIds, deltaMs);

  return {
    track,
    lines,
    startTimesMs,
    segments,
    endMsByLineId,
    issueByLineId,
    isUnsaved,
    canNudge,
  };
}
