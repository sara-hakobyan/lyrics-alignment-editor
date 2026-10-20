import { Undo2 } from "lucide-react";
import type { Line } from "../types";
import { formatTime } from "../utils";
import Button from "./common/Button";
import styles from "./RightPannel.module.css";

type RightPannelProps = {
  selectedLine: Line | undefined;
  lineNumber: number | undefined;
  startMs: number | undefined;
  endMs: number | undefined;
  onClearLineTiming: (lineId: string) => void;
};

export default function RightPannel({
  selectedLine,
  lineNumber,
  startMs,
  endMs,
  onClearLineTiming,
}: RightPannelProps) {
  const isTimed = startMs !== undefined;

  return (
    <aside className={styles.panel}>
      <h3>
        Selected line
        {lineNumber !== undefined && (
          <span className={styles.number}> #{lineNumber}</span>
        )}
      </h3>

      <p className={styles.text}>{selectedLine?.text ?? "No line selected"}</p>

      <dl className={styles.times}>
        <dt>Start</dt>
        <dd className={isTimed ? undefined : styles.muted}>
          {isTimed ? formatTime(startMs / 1000) : "Not timed"}
        </dd>

        <dt>End</dt>
        <dd className={endMs !== undefined ? undefined : styles.muted}>
          {endMs !== undefined ? formatTime(endMs / 1000) : "Not timed"}
        </dd>
      </dl>

      {selectedLine && isTimed && (
        <Button
          variant="outlined"
          color="neutral"
          prependIcon={<Undo2 />}
          onClick={() => onClearLineTiming(selectedLine.id)}
        >
          Undo
        </Button>
      )}
    </aside>
  );
}
