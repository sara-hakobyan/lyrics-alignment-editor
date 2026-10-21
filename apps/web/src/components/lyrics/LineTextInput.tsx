import { useRef } from "react";
import { Check, X } from "lucide-react";
import { useEditorStore } from "../../data-alignment/store";
import type { Line } from "../../types";
import Button from "../common/Button";
import Tooltip from "../common/Tooltip";
import styles from "./LineTextInput.module.css";

type LineTextInputProps = {
  line: Line;
  // 1-based, for the input's label.
  number: number;
  // Called after applying or cancelling, to close the input.
  onDone: () => void;
};

// The line's text in an input. Enter or ✓ puts it in the line ("Save changes"
// stores it); Escape or ✕ cancels. Empty text is ignored.
export default function LineTextInput({
  line,
  number,
  onDone,
}: LineTextInputProps) {
  const editLine = useEditorStore((s) => s.editLine);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyEdit = () => {
    editLine(line.id, inputRef.current?.value ?? "");
    onDone();
  };

  return (
    // Clicks inside shouldn't select the line.
    <span className={styles.edit} onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        className={styles.textInput}
        defaultValue={line.text}
        autoFocus
        aria-label={`Edit line ${number}`}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyEdit();
          if (e.key === "Escape") onDone();
        }}
      />
      <Tooltip content="Apply">
        <Button
          variant="text"
          size="small"
          icon={<Check />}
          aria-label="Apply"
          onClick={applyEdit}
        />
      </Tooltip>
      <Tooltip content="Cancel">
        <Button
          variant="text"
          color="neutral"
          size="small"
          icon={<X />}
          aria-label="Cancel editing"
          onClick={onDone}
        />
      </Tooltip>
    </span>
  );
}
