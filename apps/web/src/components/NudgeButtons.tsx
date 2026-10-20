import Button from "./common/Button";
import styles from "./NudgeButtons.module.css";

// The nudge steps, in ms.
const NUDGE_STEPS_MS = [-500, -100, 100, 500];

const formatStep = (ms: number) =>
  `${ms > 0 ? "+" : "−"}${Math.abs(ms) / 1000}`;

type NudgeButtonsProps = {
  // False for a step that would leave the track or break a line's timing.
  canNudge: (deltaMs: number) => boolean;
  onNudge: (deltaMs: number) => void;
  // What moves, for the tooltips, e.g. "the selected lines".
  subject: string;
};

export default function NudgeButtons({
  canNudge,
  onNudge,
  subject,
}: NudgeButtonsProps) {
  return (
    <>
      {NUDGE_STEPS_MS.map((ms) => (
        <Button
          key={ms}
          variant="outlined"
          color="neutral"
          size="small"
          className={styles.nudge}
          title={`Move ${subject} ${Math.abs(ms) / 1000}s ${
            ms < 0 ? "earlier" : "later"
          }`}
          disabled={!canNudge(ms)}
          onClick={() => onNudge(ms)}
        >
          {formatStep(ms)}
        </Button>
      ))}
    </>
  );
}
