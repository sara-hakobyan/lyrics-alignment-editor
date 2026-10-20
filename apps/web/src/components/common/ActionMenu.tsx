import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import Button from "./Button";
import styles from "./ActionMenu.module.css";

export type Action = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  // Red text, for destructive actions like Delete.
  danger?: boolean;
};

type ActionMenuProps = {
  actions: Action[];
  // Accessible name of the ⋮ button.
  label?: string;
};

export default function ActionMenu({
  actions,
  label = "More actions",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close on a click outside or on Escape.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsOpen(false);
      // Give focus back to the ⋮ button, since the item that had it is gone.
      wrapperRef.current?.querySelector("button")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    // Stops clicks from reaching a clickable parent, e.g. a lyric line.
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="text"
        color="neutral"
        size="small"
        icon={<MoreVertical />}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <ul id={menuId} className={styles.menu}>
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                className={
                  action.danger ? `${styles.item} ${styles.danger}` : styles.item
                }
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
