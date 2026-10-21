import { useState } from "react";
import { Eraser, Pencil, Play, Undo2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../../data-alignment/store";
import type { Line } from "../../types";
import { cx, formatMs } from "../../utils";
import ActionMenu, { type Action } from "../common/ActionMenu";
import Button from "../common/Button";
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

  const actions: Action[] = [
    {
      label: "Edit text",
      icon: <Pencil />,
      onClick: () => setIsEditing(true),
    },
    ...(isTimed
      ? [
          {
            label: "Clear timing",
            icon: <Eraser />,
            // Selected, so the next Space press stamps it again.
            onClick: () => {
              clearTimings([line.id]);
              selectLine(line.id);
            },
          },
        ]
      : []),
    ...(isUnsaved
      ? [
          {
            label: "Undo changes",
            icon: <Undo2 />,
            onClick: () => resetLines([line.id]),
          },
        ]
      : []),
  ];

  return (
    <li
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
        <span className={styles.text}>{line.text}</span>
      )}

      <div className={styles.meta}>
        {isUnsaved && <UnsavedDot />}
        <span className={isTimed ? styles.time : styles.untimed}>
          {formatMs(startMs)}
        </span>

        {isTimed && (
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
        )}
        {!isEditing && (
          <ActionMenu actions={actions} label={`Actions for line ${number}`} />
        )}
      </div>

      {issue && <span className={styles.issue}>{issue}</span>}
    </li>
  );
}
