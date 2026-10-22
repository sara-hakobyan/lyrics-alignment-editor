import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  width?: number | string;
  labelledBy?: string;
  describedBy?: string;
  dismissible?: boolean;
  children: ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  width = 480,
  labelledBy,
  describedBy,
  dismissible = true,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      style={{ width }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      // A click on the backdrop lands on the dialog itself, not on the content.
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>{children}</div>
    </dialog>
  );
}
