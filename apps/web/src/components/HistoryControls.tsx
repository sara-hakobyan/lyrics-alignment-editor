import { Redo2, Undo2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import Button from "./common/Button";
import Tooltip from "./common/Tooltip";
import styles from "./HistoryControls.module.css";

export default function HistoryControls() {
  const { undoLabel, redoLabel, undo, redo } = useEditorStore(
    useShallow((state) => ({
      undoLabel: state.track
        ? state.historyByTrack[state.track.id]?.undoLabel
        : null,
      redoLabel: state.track
        ? state.historyByTrack[state.track.id]?.redoLabel
        : null,
      undo: state.undo,
      redo: state.redo,
    }))
  );

  return (
    <div className={styles.controls} role="group" aria-label="Edit history">
      <Tooltip
        content={`${
          undoLabel ? `Undo: ${undoLabel}` : "Nothing to undo"
        } (Ctrl/⌘ Z)`}
      >
        <Button
          variant="text"
          color="neutral"
          icon={<Undo2 />}
          aria-label="Undo"
          aria-keyshortcuts="Control+Z Meta+Z"
          disabled={!undoLabel}
          onClick={undo}
        />
      </Tooltip>
      <Tooltip
        content={`${
          redoLabel ? `Redo: ${redoLabel}` : "Nothing to redo"
        } (Ctrl/⌘ Shift Z)`}
      >
        <Button
          variant="text"
          color="neutral"
          icon={<Redo2 />}
          aria-label="Redo"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          disabled={!redoLabel}
          onClick={redo}
        />
      </Tooltip>
    </div>
  );
}
