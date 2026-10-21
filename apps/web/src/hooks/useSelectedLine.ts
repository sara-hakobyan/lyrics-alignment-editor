import { useShallow } from "zustand/shallow";
import { getLines, useEditorStore } from "../data-alignment/store";

// The selected line of the open track and its index; undefined and -1 when none is selected.
export function useSelectedLine() {
  const { selectedLineId, lines } = useEditorStore(
    useShallow((s) => ({
      selectedLineId: s.selectedLineId,
      lines: s.track ? getLines(s, s.track) : undefined,
    }))
  );

  const index = lines?.findIndex((line) => line.id === selectedLineId) ?? -1;
  return { selectedLine: lines?.[index], index };
}
