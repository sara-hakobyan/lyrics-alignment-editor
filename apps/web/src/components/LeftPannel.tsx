import { Play, Undo2 } from "lucide-react";
import type { Line } from "../types";
import { formatTime } from "../utils";
import Button from "./common/Button";
import styles from "./LeftPannel.module.css";

type LeftPannelProps = {
  lines: Line[];
  startTimesMs: Record<string, number>;
  selectedLineId: string | null;
  onSelectLine: (lineId: string) => void;
  onPlayLine: (lineId: string) => void;
  onClearLineTiming: (lineId: string) => void;
};

export default function LeftPannel({
  lines,
  startTimesMs,
  selectedLineId,
  onSelectLine,
  onPlayLine,
  onClearLineTiming,
}: LeftPannelProps) {
  const untimedCount = lines.filter(
    (line) => startTimesMs[line.id] === undefined
  ).length;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>Lyrics ({lines.length})</h3>
        {untimedCount > 0 && (
          <span className={styles.pill}>{untimedCount} untimed</span>
        )}
      </div>

      <ol className={styles.lines}>
        {lines.map((line, index) => {
          const startMs = startTimesMs[line.id];
          const isTimed = startMs !== undefined;
          const isSelected = line.id === selectedLineId;

          return (
            <li
              key={line.id}
              onClick={() => onSelectLine(line.id)}
              className={
                isSelected ? `${styles.line} ${styles.selectedLine}` : styles.line
              }
            >
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.text}>{line.text}</span>

              <div className={styles.meta}>
                <span className={isTimed ? styles.time : styles.untimed}>
                  {isTimed ? formatTime(startMs / 1000) : "Not timed"}
                </span>

                {isTimed && (
                  <>
                    <Button
                      variant="text"
                      size="small"
                      icon={<Play />}
                      aria-label={`Play ${line.text}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayLine(line.id);
                      }}
                    />
                    <Button
                      variant="text"
                      color="neutral"
                      size="small"
                      icon={<Undo2 />}
                      aria-label={`Undo ${line.text}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearLineTiming(line.id);
                      }}
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
