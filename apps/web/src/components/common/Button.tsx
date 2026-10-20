import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import styles from "./Button.module.css";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "neutral";
  size?: "small" | "medium";
  prependIcon?: ReactNode;
  appendIcon?: ReactNode;
  // Icon-only, round button. Give it an `aria-label`, since it has no visible text.
  icon?: ReactNode;
  // Shows a spinner in place of the (prepend) icon and blocks clicks.
  loading?: boolean;
};

export default function Button({
  variant = "contained",
  color = "primary",
  size = "medium",
  prependIcon,
  appendIcon,
  icon,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[color],
    styles[size],
    icon ? styles.iconOnly : "",
    loading ? styles.loading : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const spinner = <Loader2 className={styles.spinner} aria-hidden="true" />;

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon ? (
        loading ? spinner : icon
      ) : (
        <>
          {loading ? spinner : prependIcon}
          {children}
          {appendIcon}
        </>
      )}
    </button>
  );
}
