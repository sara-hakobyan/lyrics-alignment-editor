import { Play, Undo2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../alignment/store";
import { isLineUnsaved } from "../alignment/timings";
import { useTimingState } from "../hooks/useTimingState";
import { formatMs } from "../utils";
import Button from "./common/Button";
import NudgeButtons from "./NudgeButtons";
import styles from "./LineDetailsPanel.module.css";

type LineDetailsPanelProps = {
  onPlayLine: (lineId: string) => void;
};

export default function LineDetailsPanel({
  onPlayLine,
}: LineDetailsPanelProps) {
  const { selectedLineId, revertLine, nudgeLines } = useEditorStore(
    useShallow((s) => ({
      selectedLineId: s.selectedLineId,
      revertLine: s.revertLine,
      nudgeLines: s.nudgeLines,
    }))
  );
  const {
    track,
    startTimesMs,
    savedStartTimesMs,
    endMsByLineId,
    issueByLineId,
    canNudge,
  } = useTimingState();

  const lineIndex =
    track?.lines.findIndex((line) => line.id === selectedLineId) ?? -1;
  const selectedLine = track?.lines[lineIndex];
  const startMs = selectedLine ? startTimesMs[selectedLine.id] : undefined;
  const endMs = selectedLine ? endMsByLineId.get(selectedLine.id) : undefined;
  const timingIssue = selectedLine
    ? issueByLineId.get(selectedLine.id)
    : undefined;
  // Whether the start differs from the last save, so there's something to undo.
  const isUnsaved =
    !!selectedLine &&
    isLineUnsaved(startTimesMs, savedStartTimesMs, selectedLine.id);
  const isTimed = startMs !== undefined;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>
          Selected line
          {selectedLine && (
            <span className={styles.number}> #{lineIndex + 1}</span>
          )}
        </h3>

        <Button
          variant="outlined"
          size="small"
          icon={<Play />}
          aria-label="Play this line"
          title={
            isTimed ? "Play from this line's start" : "Stamp this line first"
          }
          disabled={!selectedLine || !isTimed}
          onClick={() => selectedLine && onPlayLine(selectedLine.id)}
        />
      </div>

      <p className={styles.text}>{selectedLine?.text ?? "No line selected"}</p>

      <dl className={styles.times}>
        <dt>Start</dt>
        <dd className={isTimed ? undefined : styles.muted}>
          {formatMs(startMs)}
        </dd>

        <dt>End</dt>
        <dd className={endMs !== undefined ? undefined : styles.muted}>
          {formatMs(endMs)}
        </dd>
      </dl>

      {timingIssue && <p className={styles.issue}>{timingIssue}</p>}

      {selectedLine && isTimed && (
        <div className={styles.adjust}>
          <span className={styles.adjustLabel}>Adjust start (seconds)</span>
          <div className={styles.nudges}>
            <NudgeButtons
              canNudge={(ms) => canNudge(ms, [selectedLine.id])}
              onNudge={(ms) => nudgeLines(ms, [selectedLine.id])}
              subject="this line"
            />
          </div>
        </div>
      )}

      {selectedLine && isUnsaved && (
        <Button
          variant="outlined"
          color="neutral"
          prependIcon={<Undo2 />}
          title="Go back to the last saved time"
          onClick={() => revertLine(selectedLine.id)}
        >
          Undo
        </Button>
      )}
    </aside>
  );
}
