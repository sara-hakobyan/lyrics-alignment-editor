import { useRef } from "react";
import { Eraser, Play, X } from "lucide-react";
import type { Line } from "../types";
import { cx, formatMs } from "../utils";
import Button from "./common/Button";
import UnsavedDot from "./common/UnsavedDot";
import NudgeButtons from "./NudgeButtons";
import styles from "./LyricsPanel.module.css";

type LyricsPanelProps = {
  lines: Line[];
  startTimesMs: Record<string, number>;
  // The last saved start times; a line that differs gets an unsaved dot.
  savedStartTimesMs: Record<string, number>;
  selectedLineId: string | null;
  onSelectLine: (lineId: string) => void;
  onPlayLine: (lineId: string) => void;
  onClearLineTiming: (lineId: string) => void;
  // Line id → what's wrong with its timing.
  timingIssues: Map<string, string>;
  checkedLineIds: string[];
  onCheckedLinesChange: (lineIds: string[]) => void;
  // False for a step that would leave the track or break a line's timing.
  canNudge: (deltaMs: number) => boolean;
  onNudge: (deltaMs: number) => void;
};

export default function LyricsPanel({
  lines,
  startTimesMs,
  savedStartTimesMs,
  selectedLineId,
  onSelectLine,
  onPlayLine,
  onClearLineTiming,
  timingIssues,
  checkedLineIds,
  onCheckedLinesChange,
  canNudge,
  onNudge,
}: LyricsPanelProps) {
  // The last checkbox clicked, where a shift-click range starts.
  const anchorLineIdRef = useRef<string | null>(null);

  const untimedCount = lines.filter(
    (line) => startTimesMs[line.id] === undefined
  ).length;

  const toggleChecked = (lineId: string, extendRange: boolean) => {
    const anchorIndex = lines.findIndex(
      (line) => line.id === anchorLineIdRef.current
    );

    if (extendRange && anchorIndex !== -1) {
      const index = lines.findIndex((line) => line.id === lineId);
      const [from, to] =
        index < anchorIndex ? [index, anchorIndex] : [anchorIndex, index];
      const range = lines.slice(from, to + 1).map((line) => line.id);
      onCheckedLinesChange([...new Set([...checkedLineIds, ...range])]);
    } else {
      onCheckedLinesChange(
        checkedLineIds.includes(lineId)
          ? checkedLineIds.filter((id) => id !== lineId)
          : [...checkedLineIds, lineId]
      );
    }
    anchorLineIdRef.current = lineId;
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>Lyrics ({lines.length})</h3>
        {untimedCount > 0 && (
          <span className={styles.pill}>{untimedCount} untimed</span>
        )}
      </div>

      {checkedLineIds.length > 0 && (
        <>
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>
              {checkedLineIds.length} selected
            </span>
            <NudgeButtons
              canNudge={canNudge}
              onNudge={onNudge}
              subject="the selected lines"
            />
            <Button
              variant="text"
              size="small"
              icon={<X />}
              aria-label="Clear selection"
              onClick={() => onCheckedLinesChange([])}
            />
          </div>
          <p className={styles.bulkHint}>
            Shift-click a checkbox to select a range. Untimed lines are skipped.
          </p>
        </>
      )}

      <ol className={styles.lines}>
        {lines.map((line, index) => {
          const startMs = startTimesMs[line.id];
          const isTimed = startMs !== undefined;
          const isSelected = line.id === selectedLineId;
          const isChecked = checkedLineIds.includes(line.id);

          return (
            <li
              key={line.id}
              onClick={() => onSelectLine(line.id)}
              className={cx(
                styles.line,
                isChecked && styles.checkedLine,
                isSelected && styles.selectedLine
              )}
            >
              {/* Only for bulk actions, so it doesn't select the line for stamping. */}
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={isChecked}
                readOnly
                aria-label={`Select line ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChecked(line.id, e.shiftKey);
                }}
              />
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.text}>{line.text}</span>

              <div className={styles.meta}>
                {startMs !== savedStartTimesMs[line.id] && <UnsavedDot />}
                <span className={isTimed ? styles.time : styles.untimed}>
                  {formatMs(startMs)}
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
                      icon={<Eraser />}
                      aria-label={`Clear timing of ${line.text}`}
                      title="Clear timing"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearLineTiming(line.id);
                      }}
                    />
                  </>
                )}
              </div>

              {timingIssues.has(line.id) && (
                <span className={styles.issue}>{timingIssues.get(line.id)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
