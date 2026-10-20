import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import styles from "./ConfirmModal.module.css";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = false,
}: ConfirmModalProps) {
  const [isPending, setIsPending] = useState(false);

  const confirm = async () => {
    setIsPending(true);
    await onConfirm();
    setIsPending(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width={400}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <Button
            variant="text"
            color="neutral"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            color={danger ? "danger" : "primary"}
            loading={isPending}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
