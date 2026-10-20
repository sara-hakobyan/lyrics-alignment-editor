import { Loader2 } from "lucide-react";
import { cx } from "../../utils";
import styles from "./Spinner.module.css";

type SpinnerProps = {
  // Size and colour come from the caller (by default it follows the font size and text colour).
  className?: string;
};

export default function Spinner({ className }: SpinnerProps) {
  return (
    <Loader2 className={cx(styles.spinner, className)} aria-hidden="true" />
  );
}
