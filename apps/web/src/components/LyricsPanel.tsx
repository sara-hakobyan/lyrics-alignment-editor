import { useRef, useState } from "react";
import { CheckIcon, Eraser, Pencil, Play, Undo2, X } from "lucide-react";
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
    editLine,
    clearLinesTiming,
    resetLines,
    savedLines,
  } = useEditorStore(
    useShallow((s) => ({
      selectedLineId: s.selectedLineId,
      checkedLineIds: s.checkedLineIds,
      selectLine: s.selectLine,
      clearLineTiming: s.clearLineTiming,
      setCheckedLineIds: s.setCheckedLineIds,
      nudgeLines: s.nudgeLines,
      editLine: s.editLine,
      clearLinesTiming: s.clearLinesTiming,
      resetLines: s.resetLines,
      // Only set while the open track has text edits that aren't saved.
      savedLines: s.track ? s.savedLinesByTrack[s.track.id] : undefined,
    }))
  );
  const { track, startTimesMs, savedStartTimesMs, issueByLineId, canNudge } =
    useTimingState();
  const lines = track?.lines ?? [];
  // Line id → its text as last saved, to mark lines whose text was edited.
  const savedTextById = new Map(
    savedLines?.map((line) => [line.id, line.text]) ?? []
  );

  // The last checkbox clicked, where a shift-click range starts.
  const anchorLineIdRef = useRef<string | null>(null);
  // The line whose text is shown in an input for editing.
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const untimedCount = lines.filter(
    (line) => startTimesMs[line.id] === undefined
  ).length;

  // Unsaved timing or an unsaved text edit.
  const isUnsaved = (lineId: string, text: string) =>
    isLineUnsaved(startTimesMs, savedStartTimesMs, lineId) ||
    (savedLines !== undefined && savedTextById.get(lineId) !== text);

  const isAllChecked =
    lines.length > 0 && checkedLineIds.length === lines.length;
  const hasCheckedTimed = checkedLineIds.some(
    (id) => startTimesMs[id] !== undefined
  );
  const hasCheckedUnsaved = lines.some(
    (line) => checkedLineIds.includes(line.id) && isUnsaved(line.id, line.text)
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
        checkedLineIds.includes(lineId)
          ? checkedLineIds.filter((id) => id !== lineId)
          : [...checkedLineIds, lineId]
      );
    }
    anchorLineIdRef.current = lineId;
  };

  const handleEdit = (lineId: string) => {
    setEditingLineId(lineId);
  };
  // Puts the typed text in the line; "Save changes" stores it. Empty text is ignored.
  const handleSave = (lineId: string) => {
    editLine(lineId, editInputRef.current?.value ?? "");
    setEditingLineId(null);
  };
  const handleCancel = () => {
    setEditingLineId(null);
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
              color="neutral"
              size="small"
              icon={<Eraser />}
              aria-label="Clear timing of the selected lines"
              title="Clear timing"
              disabled={!hasCheckedTimed}
              onClick={() => clearLinesTiming(checkedLineIds)}
            />
            <Button
              variant="text"
              color="neutral"
              size="small"
              icon={<Undo2 />}
              aria-label="Reset the selected lines to the last save"
              title="Reset changes"
              disabled={!hasCheckedUnsaved}
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
              {line.id === editingLineId ? (
                <input
                  ref={editInputRef}
                  className={styles.textInput}
                  defaultValue={line.text}
                  autoFocus
                  aria-label={`Edit line ${index + 1}`}
                  // Clicking into the input shouldn't select the line.
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={styles.text}>{line.text}</span>
              )}

              <div className={styles.meta}>
                {isUnsaved(line.id, line.text) && <UnsavedDot />}
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
                <Button
                  variant="text"
                  color="neutral"
                  size="small"
                  icon={line.id === editingLineId ? <CheckIcon /> : <Pencil />}
                  aria-label={`Edit ${line.text}`}
                  title="Edit text"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (line.id === editingLineId) handleSave(line.id);
                    else handleEdit(line.id);
                  }}
                />
                {line.id === editingLineId && (
                  <Button
                    variant="text"
                    color="neutral"
                    size="small"
                    icon={<X />}
                    aria-label={`Cancel editing of ${line.text}`}
                    title="Cancel editing"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                  />
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
