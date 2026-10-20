import { Play, Undo2 } from "lucide-react";
import type { Line } from "../types";
import { formatMs } from "../utils";
import Button from "./common/Button";
import NudgeButtons from "./NudgeButtons";
import styles from "./LineDetailsPanel.module.css";

type LineDetailsPanelProps = {
  selectedLine: Line | undefined;
  lineNumber: number | undefined;
  startMs: number | undefined;
  endMs: number | undefined;
  // What's wrong with the selected line's timing, if anything.
  timingIssue: string | undefined;
  // Whether the start differs from the last save, so there's something to undo.
  isChanged: boolean;
  onPlayLine: (lineId: string) => void;
  onRevertLine: (lineId: string) => void;
  // False for a step that would leave the track or break a line's timing.
  canNudge: (deltaMs: number) => boolean;
  onNudge: (deltaMs: number) => void;
};

export default function LineDetailsPanel({
  selectedLine,
  lineNumber,
  startMs,
  endMs,
  timingIssue,
  isChanged,
  onPlayLine,
  onRevertLine,
  canNudge,
  onNudge,
}: LineDetailsPanelProps) {
  const isTimed = startMs !== undefined;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>
          Selected line
          {lineNumber !== undefined && (
            <span className={styles.number}> #{lineNumber}</span>
          )}
        </h3>

        <Button
          variant="outlined"
          size="small"
          icon={<Play />}
          aria-label="Play this line"
          title={isTimed ? "Play from this line's start" : "Stamp this line first"}
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
              canNudge={canNudge}
              onNudge={onNudge}
              subject="this line"
            />
          </div>
        </div>
      )}

      {selectedLine && isChanged && (
        <Button
          variant="outlined"
          color="neutral"
          prependIcon={<Undo2 />}
          title="Go back to the last saved time"
          onClick={() => onRevertLine(selectedLine.id)}
        >
          Undo
        </Button>
      )}
    </aside>
  );
}
