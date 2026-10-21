import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../alignment/store";
import {
  buildSegments,
  canShift,
  findTimingIssues,
  getSavedStartTimes,
} from "../alignment/timings";

// Same object every time, so the store selector doesn't see a "change" when a track has no stamps.
const NO_START_TIMES: Record<string, number> = {};

// The open track's start times and everything worked out from them. Each
// component that calls this recomputes only when the track or its stamps change.
export function useTimingState() {
  const { track, startTimesMs } = useEditorStore(
    useShallow((s) => ({
      track: s.track,
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

  // The last saved start times, for the unsaved dots and Undo.
  const savedStartTimesMs = useMemo(
    () => (track ? getSavedStartTimes(track) : NO_START_TIMES),
    [track]
  );

  // False for a step that would leave the track or break a line's timing.
  const canNudge = (deltaMs: number, lineIds: string[]) =>
    !!track && canShift(track, startTimesMs, issueByLineId, lineIds, deltaMs);

  return {
    track,
    startTimesMs,
    savedStartTimesMs,
    segments,
    endMsByLineId,
    issueByLineId,
    canNudge,
  };
}
