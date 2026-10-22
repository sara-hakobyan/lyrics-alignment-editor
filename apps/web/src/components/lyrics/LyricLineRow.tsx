import { useState } from "react";
import { Eraser, Pencil, Play, RotateCcw } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../../data-alignment/store";
import type { Line } from "../../types";
import { cx, formatMs } from "../../utils";
import Button from "../common/Button";
import Tooltip from "../common/Tooltip";
import UnsavedDot from "../common/UnsavedDot";
import LineTextInput from "./LineTextInput";
import styles from "./LyricLineRow.module.css";

type LyricLineRowProps = {
  line: Line;
  // 1-based, as shown in the row.
  number: number;
  startMs: number | undefined;
  issue: string | undefined;
  isSelected: boolean;
  isChecked: boolean;
  isUnsaved: boolean;
  onToggleChecked: (extendRange: boolean) => void;
  onPlay: () => void;
};

export default function LyricLineRow({
  line,
  number,
  startMs,
  issue,
  isSelected,
  isChecked,
  isUnsaved,
  onToggleChecked,
  onPlay,
}: LyricLineRowProps) {
  const { selectLine, clearTimings, resetLines } = useEditorStore(
    useShallow((s) => ({
      selectLine: s.selectLine,
      clearTimings: s.clearTimings,
      resetLines: s.resetLines,
    }))
  );
  // Each row keeps its own, so typed text isn't lost when another row is edited.
  const [isEditing, setIsEditing] = useState(false);
  const isTimed = startMs !== undefined;

  return (
    <li
      data-selected={isSelected}
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
        aria-label={`Select line ${number}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleChecked(e.shiftKey);
        }}
      />
      <span className={styles.number}>{number}</span>
      {isEditing ? (
        <LineTextInput
          line={line}
          number={number}
          onDone={() => setIsEditing(false)}
        />
      ) : (
        <button
          type="button"
          className={styles.text}
          aria-label={`Select lyric ${number}: ${line.text}`}
          aria-pressed={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            selectLine(line.id);
            if (e.detail > 0) e.currentTarget.blur();
          }}
        >
          {line.text}
        </button>
      )}

      <div className={styles.meta}>
        {isUnsaved && <UnsavedDot />}
        <span className={isTimed ? styles.time : styles.untimed}>
          {formatMs(startMs)}
        </span>

        {isTimed && (
          <Tooltip content="Play from this line's start">
            <Button
              variant="text"
              size="small"
              icon={<Play />}
              aria-label={`Play ${line.text}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            />
          </Tooltip>
        )}
        {isTimed && (
          <Tooltip content="Clear timing">
            <Button
              variant="text"
              color="neutral"
              size="small"
              icon={<Eraser />}
              aria-label={`Clear timing of line ${number}`}
              onClick={(e) => {
                e.stopPropagation();
                clearTimings([line.id]);
                // Selected, so the next Space press stamps it again.
                selectLine(line.id);
              }}
            />
          </Tooltip>
        )}
        {isUnsaved && (
          <Tooltip content="Restore last save">
            <Button
              variant="text"
              color="neutral"
              size="small"
              icon={<RotateCcw />}
              aria-label={`Restore line ${number} to the last save`}
              onClick={(e) => {
                e.stopPropagation();
                resetLines([line.id]);
              }}
            />
          </Tooltip>
        )}
        {/* While editing, the input's own ✓ and ✕ take its place. */}
        {!isEditing && (
          <Tooltip content="Edit text">
            <Button
              variant="text"
              color="neutral"
              size="small"
              icon={<Pencil />}
              aria-label={`Edit text of line ${number}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            />
          </Tooltip>
        )}
      </div>

      {issue && <span className={styles.issue}>{issue}</span>}
    </li>
  );
}
