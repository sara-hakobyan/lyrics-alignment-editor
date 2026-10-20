import styles from "./UnsavedDot.module.css";

// A small dot marking a line or track with changes that aren't saved yet.
export default function UnsavedDot() {
  return (
    <span
      className={styles.dot}
      role="img"
      aria-label="Not saved"
      title="Not saved"
    />
  );
}
