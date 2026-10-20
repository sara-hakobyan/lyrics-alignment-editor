import { Undo2 } from "lucide-react";
import type { Line } from "../types";
import { formatMs } from "../utils";
import Button from "./common/Button";
import styles from "./LineDetailsPanel.module.css";

type LineDetailsPanelProps = {
  selectedLine: Line | undefined;
  lineNumber: number | undefined;
  startMs: number | undefined;
  endMs: number | undefined;
  onClearLineTiming: (lineId: string) => void;
};

export default function LineDetailsPanel({
  selectedLine,
  lineNumber,
  startMs,
  endMs,
  onClearLineTiming,
}: LineDetailsPanelProps) {
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
          {formatMs(startMs)}
        </dd>

        <dt>End</dt>
        <dd className={endMs !== undefined ? undefined : styles.muted}>
          {formatMs(endMs)}
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
