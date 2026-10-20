import { useId } from "react";
import { cx } from "../../utils";
import styles from "./TextField.module.css";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // Renders a <textarea> instead of an <input>.
  multiline?: boolean;
  rows?: number;
  // Shown under the field; also marks the field as invalid.
  error?: string;
};

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
  error,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  const fieldProps = {
    id,
    value,
    placeholder,
    className: cx(styles.input, error && styles.invalid),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      {multiline ? (
        <textarea
          {...fieldProps}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          {...fieldProps}
          type="text"
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
