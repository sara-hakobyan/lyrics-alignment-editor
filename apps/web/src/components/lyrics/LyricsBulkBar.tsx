import { Eraser, Undo2, X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../../data-alignment/store";
import Button from "../common/Button";
import NudgeButtons from "../NudgeButtons";
import styles from "./LyricsBulkBar.module.css";

type LyricsBulkBarProps = {
  checkedLineIds: string[];
  canNudge: (deltaMs: number) => boolean;
  // Whether any checked line is timed, so there's a timing to clear.
  canClear: boolean;
  // Whether any checked line differs from its last save.
  canReset: boolean;
};

// Actions for the checked lines, shown while at least one is checked.
export default function LyricsBulkBar({
  checkedLineIds,
  canNudge,
  canClear,
  canReset,
}: LyricsBulkBarProps) {
  const { setCheckedLineIds, nudgeLines, clearTimings, resetLines } =
    useEditorStore(
      useShallow((s) => ({
        setCheckedLineIds: s.setCheckedLineIds,
        nudgeLines: s.nudgeLines,
        clearTimings: s.clearTimings,
        resetLines: s.resetLines,
      }))
    );

  return (
    <>
      <div className={styles.bulkBar}>
        <span className={styles.bulkCount}>
          {checkedLineIds.length} selected
        </span>
        <NudgeButtons
          canNudge={canNudge}
          onNudge={(ms) => nudgeLines(ms, checkedLineIds)}
          subject="the selected lines"
        />
        <Button
          variant="text"
          color="neutral"
          size="small"
          icon={<Eraser />}
          aria-label="Clear timing of the selected lines"
          title="Clear timing"
          disabled={!canClear}
          onClick={() => clearTimings(checkedLineIds)}
        />
        <Button
          variant="text"
          color="neutral"
          size="small"
          icon={<Undo2 />}
          aria-label="Reset the selected lines to the last save"
          title="Reset changes"
          disabled={!canReset}
          onClick={() => resetLines(checkedLineIds)}
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
  );
}
