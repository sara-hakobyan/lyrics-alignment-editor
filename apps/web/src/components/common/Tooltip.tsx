import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

type TooltipProps = {
  content: ReactNode;
  // The side it prefers; it flips to the other one when there's no room.
  placement?: "top" | "bottom";
  // One element, e.g. an icon Button. It gets `aria-describedby` while the tooltip shows.
  children: ReactElement;
};

// Hovering this long shows it, so moving the mouse across buttons doesn't flash tooltips.
const SHOW_DELAY_MS = 300;
// Space between the tooltip and its trigger, and the tooltip and the window edge.
const GAP_PX = 6;

type Position = { top: number; left: number };

export default function Tooltip({
  content,
  placement = "top",
  children,
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const show = (delayMs: number) => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsOpen(true), delayMs);
  };
  const hide = () => {
    window.clearTimeout(timerRef.current);
    setIsOpen(false);
    setPosition(null);
  };

  // Placed once it has rendered, because its size is needed to center and flip it.
  useLayoutEffect(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const tooltip = tooltipRef.current?.getBoundingClientRect();
    if (!isOpen || !trigger || !tooltip) return;

    const fitsAbove = trigger.top - tooltip.height - GAP_PX >= 0;
    const fitsBelow =
      trigger.bottom + tooltip.height + GAP_PX <= window.innerHeight;
    const isAbove =
      placement === "top" ? fitsAbove || !fitsBelow : fitsAbove && !fitsBelow;

    setPosition({
      top: isAbove
        ? trigger.top - tooltip.height - GAP_PX
        : trigger.bottom + GAP_PX,
      // Centered on the trigger, but kept inside the window.
      left: Math.min(
        Math.max(trigger.left + trigger.width / 2 - tooltip.width / 2, GAP_PX),
        window.innerWidth - tooltip.width - GAP_PX
      ),
    });
  }, [isOpen, placement, content]);

  // Its fixed position goes stale when anything scrolls, and Escape dismisses it.
  useEffect(() => {
    if (!isOpen) return;

    const close = () => {
      setIsOpen(false);
      setPosition(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <span
      ref={triggerRef}
      className={styles.trigger}
      // Mouse only: a tap on a touch screen would otherwise leave it open.
      onPointerEnter={(e) => e.pointerType === "mouse" && show(SHOW_DELAY_MS)}
      onPointerLeave={hide}
      onPointerDown={hide}
      // Keyboard focus only, not the focus a mouse click gives a button.
      onFocus={(e) => e.target.matches(":focus-visible") && show(0)}
      onBlur={hide}
    >
      {cloneElement(children, { "aria-describedby": isOpen ? id : undefined })}

      {/* In the body, so a panel's overflow can't clip it. */}
      {isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className={styles.tooltip}
            // Hidden until it's measured and placed.
            style={position ?? { top: 0, left: 0, visibility: "hidden" }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}
