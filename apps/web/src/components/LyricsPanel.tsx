import { useRef } from "react";
import { Eraser, Play, X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../alignment/store";
import { isLineUnsaved } from "../alignment/timings";
import { useTimingState } from "../hooks/useTimingState";
import { cx, formatMs } from "../utils";
import Button from "./common/Button";
import UnsavedDot from "./common/UnsavedDot";
import NudgeButtons from "./NudgeButtons";
import styles from "./LyricsPanel.module.css";

type LyricsPanelProps = {
  onPlayLine: (lineId: string) => void;
};

export default function LyricsPanel({ onPlayLine }: LyricsPanelProps) {
  const {
    selectedLineId,
    checkedLineIds,
    selectLine,
    clearLineTiming,
    setCheckedLineIds,
    nudgeLines,
  } = useEditorStore(
    useShallow((s) => ({
      selectedLineId: s.selectedLineId,
      checkedLineIds: s.checkedLineIds,
      selectLine: s.selectLine,
      clearLineTiming: s.clearLineTiming,
      setCheckedLineIds: s.setCheckedLineIds,
      nudgeLines: s.nudgeLines,
    }))
  );
  const { track, startTimesMs, savedStartTimesMs, issueByLineId, canNudge } =
    useTimingState();
  const lines = track?.lines ?? [];

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
      setCheckedLineIds([...new Set([...checkedLineIds, ...range])]);
    } else {
      setCheckedLineIds(
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
              canNudge={(ms) => canNudge(ms, checkedLineIds)}
              onNudge={(ms) => nudgeLines(ms, checkedLineIds)}
              subject="the selected lines"
            />
            <Button
              variant="text"
              size="small"
              icon={<X />}
              aria-label="Clear selection"
              onClick={() => setCheckedLineIds([])}
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
              onClick={() => selectLine(line.id)}
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
                {isLineUnsaved(startTimesMs, savedStartTimesMs, line.id) && (
                  <UnsavedDot />
                )}
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
                        clearLineTiming(line.id);
                      }}
                    />
                  </>
                )}
              </div>

              {issueByLineId.has(line.id) && (
                <span className={styles.issue}>
                  {issueByLineId.get(line.id)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
