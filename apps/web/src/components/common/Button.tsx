import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils";
import Spinner from "./Spinner";
import styles from "./Button.module.css";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "neutral" | "danger";
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
  const classes = cx(
    styles.button,
    styles[variant],
    styles[color],
    styles[size],
    !!icon && styles.iconOnly,
    loading && styles.loading,
    className
  );

  const spinner = <Spinner />;

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
