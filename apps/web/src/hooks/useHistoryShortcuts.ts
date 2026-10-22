import { useEffect } from "react";
import { useEditorStore } from "../data-alignment/store";

export function useHistoryShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey
      )
        return;
      if (!event.ctrlKey && !event.metaKey) return;
      // Text fields retain their native typing history. Dialogs own their keys.
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest("input, textarea, select, dialog") ||
          event.target.isContentEditable)
      )
        return;

      const key = event.key.toLowerCase();
      const undo = key === "z" && !event.shiftKey;
      const redo =
        (key === "z" && event.shiftKey) ||
        (key === "y" && event.ctrlKey && !event.metaKey && !event.shiftKey);
      if (!undo && !redo) return;

      event.preventDefault();
      const state = useEditorStore.getState();
      if (undo) state.undo();
      else state.redo();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
