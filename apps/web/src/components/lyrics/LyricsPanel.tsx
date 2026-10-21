import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../../data-alignment/store";
import { useTimingState } from "../../hooks/useTimingState";
import LyricLineRow from "./LyricLineRow";
import LyricsBulkBar from "./LyricsBulkBar";
import styles from "./LyricsPanel.module.css";

type LyricsPanelProps = {
  onPlayLine: (lineId: string) => void;
};

export default function LyricsPanel({ onPlayLine }: LyricsPanelProps) {
  const { selectedLineId, checkedLineIds, setCheckedLineIds } = useEditorStore(
    useShallow((s) => ({
      selectedLineId: s.selectedLineId,
      checkedLineIds: s.checkedLineIds,
      setCheckedLineIds: s.setCheckedLineIds,
    }))
  );
  const { lines, startTimesMs, issueByLineId, isUnsaved, canNudge } =
    useTimingState();
  // Built once per render, so each row's lookup doesn't scan the whole list.
  const checkedIds = new Set(checkedLineIds);

  // The last checkbox clicked, where a shift-click range starts.
  const anchorLineIdRef = useRef<string | null>(null);

  const untimedCount = lines.filter(
    (line) => startTimesMs[line.id] === undefined
  ).length;

  const isAllChecked =
    lines.length > 0 && checkedLineIds.length === lines.length;
  const hasCheckedTimed = checkedLineIds.some(
    (id) => startTimesMs[id] !== undefined
  );
  const hasCheckedUnsaved = lines.some(
    (line) => checkedIds.has(line.id) && isUnsaved(line)
  );

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
        checkedIds.has(lineId)
          ? checkedLineIds.filter((id) => id !== lineId)
          : [...checkedLineIds, lineId]
      );
    }
    anchorLineIdRef.current = lineId;
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <input
          type="checkbox"
          className={styles.selectAll}
          checked={isAllChecked}
          // Half-checked when only some lines are checked.
          ref={(el) => {
            if (el) {
              el.indeterminate = checkedLineIds.length > 0 && !isAllChecked;
            }
          }}
          aria-label="Select all lines"
          title={isAllChecked ? "Deselect all" : "Select all"}
          onChange={() =>
            setCheckedLineIds(isAllChecked ? [] : lines.map((line) => line.id))
          }
        />
        <h3>Lyrics ({lines.length})</h3>
        {untimedCount > 0 && (
          <span className={styles.pill}>{untimedCount} untimed</span>
        )}
      </div>

      {checkedLineIds.length > 0 && (
        <LyricsBulkBar
          checkedLineIds={checkedLineIds}
          canNudge={(ms) => canNudge(ms, checkedLineIds)}
          canClear={hasCheckedTimed}
          canReset={hasCheckedUnsaved}
        />
      )}

      <ol className={styles.lines}>
        {lines.map((line, index) => (
          <LyricLineRow
            key={line.id}
            line={line}
            number={index + 1}
            startMs={startTimesMs[line.id]}
            issue={issueByLineId.get(line.id)}
            isSelected={line.id === selectedLineId}
            isChecked={checkedIds.has(line.id)}
            isUnsaved={isUnsaved(line)}
            onToggleChecked={(extendRange) =>
              toggleChecked(line.id, extendRange)
            }
            onPlay={() => onPlayLine(line.id)}
          />
        ))}
      </ol>
    </aside>
  );
}
