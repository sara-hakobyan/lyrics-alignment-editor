import { Play, Undo2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import { useSelectedLine } from "../hooks/useSelectedLine";
import { useTimingState } from "../hooks/useTimingState";
import { formatMs } from "../utils";
import Button from "./common/Button";
import Tooltip from "./common/Tooltip";
import NudgeButtons from "./NudgeButtons";
import styles from "./LineDetailsPanel.module.css";

type LineDetailsPanelProps = {
  onPlayLine: (lineId: string) => void;
};

export default function LineDetailsPanel({
  onPlayLine,
}: LineDetailsPanelProps) {
  const { resetLines, nudgeLines } = useEditorStore(
    useShallow((s) => ({
      resetLines: s.resetLines,
      nudgeLines: s.nudgeLines,
    }))
  );
  const { startTimesMs, endMsByLineId, issueByLineId, isUnsaved, canNudge } =
    useTimingState();
  const { selectedLine, index: lineIndex } = useSelectedLine();

  const startMs = selectedLine ? startTimesMs[selectedLine.id] : undefined;
  const endMs = selectedLine ? endMsByLineId.get(selectedLine.id) : undefined;
  const timingIssue = selectedLine
    ? issueByLineId.get(selectedLine.id)
    : undefined;
  // Whether the start or text differs from the last save, so there's something to undo.
  const hasChanges = !!selectedLine && isUnsaved(selectedLine);
  const isTimed = startMs !== undefined;

  return (
    <aside className={styles.panel} aria-label="Line details">
      <div className={styles.panelTitle}>
        <h2>Fine-tune</h2>
        <span>LINE DETAILS</span>
      </div>
      <h3>
        Selected line
        {selectedLine && (
          <span className={styles.number}>#{lineIndex + 1}</span>
        )}
      </h3>

      <p className={styles.text}>{selectedLine?.text ?? "No line selected"}</p>
      {!isTimed && (
        <p className={styles.help}>
          {selectedLine
            ? "Stamp this line during playback to set its start time."
            : "Choose a lyric from the sheet to inspect its timing."}
        </p>
      )}

      {/* Start and end as two tiles side by side. */}
      <dl className={styles.times}>
        <div className={styles.time}>
          <dt>Start</dt>
          <dd className={isTimed ? undefined : styles.muted}>
            {formatMs(startMs)}
          </dd>
        </div>
        <div className={styles.time}>
          <dt>End</dt>
          <dd className={endMs !== undefined ? undefined : styles.muted}>
            {formatMs(endMs)}
          </dd>
        </div>
      </dl>
      {isTimed && (
        <p className={styles.help}>
          The end follows the next timed line, or the end of the track.
        </p>
      )}

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

      <div className={styles.actions}>
        <Tooltip content={"Play from this line's start"}>
          <Button
            variant="outlined"
            className={styles.action}
            prependIcon={<Play />}
            disabled={!selectedLine || !isTimed}
            onClick={() => selectedLine && onPlayLine(selectedLine.id)}
          >
            Play this line
          </Button>
        </Tooltip>

        {selectedLine && hasChanges && (
          <Button
            variant="outlined"
            color="neutral"
            className={styles.action}
            prependIcon={<Undo2 />}
            title="Go back to the last saved time and text"
            onClick={() => resetLines([selectedLine.id])}
          >
            Undo changes
          </Button>
        )}
      </div>
    </aside>
  );
}
