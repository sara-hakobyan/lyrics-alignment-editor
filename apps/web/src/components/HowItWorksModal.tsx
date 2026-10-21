import { X } from "lucide-react";
import Button from "./common/Button";
import Modal from "./common/Modal";
import styles from "./HowItWorksModal.module.css";

type HowItWorksModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Everything a user can do, and the rules the editor enforces, in reading order.
export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width={700}>
      <div className={styles.guide}>
        {/* ✕ comes first, so the dialog focuses it and opens scrolled to the top. */}
        <div className={styles.header}>
          <h2 className={styles.title}>How it works</h2>
          <Button
            variant="text"
            color="neutral"
            icon={<X />}
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <p className={styles.intro}>
          Play the song, tap <kbd>Space</kbd> as each line starts, fix the ones
          you missed, and save.
        </p>

        <section>
          <h3>1. Pick a track</h3>
          <ul>
            <li>
              Click the track name at the top left to switch tracks, or choose{" "}
              <b>Add track</b> at the bottom of that list to bring your own.
            </li>
            <li>
              A new track needs an audio file and the lyrics, one line per row.
              Title and artist are optional.
            </li>
            <li>
              Your own tracks are kept in this browser, audio included. The
              built-in track is saved on the server.
            </li>
            <li>
              The built-in track is limited: it can't be edited or deleted, so
              its ⋮ menu only has <b>Reset timings</b>. Stamping, nudging,
              editing a line's text and saving work as usual.
            </li>
          </ul>
        </section>

        <section>
          <h3>2. Stamp the lines</h3>
          <ul>
            <li>
              Press play, then press <kbd>Space</kbd> (or the <b>Stamp</b>{" "}
              button) the moment each line starts.
            </li>
            <li>
              The next line is selected for you, so you can keep tapping through
              the song.
            </li>
            <li>Stamping only works while the track plays.</li>
            <li>Missed one? Click the line to select it and stamp it again.</li>
            <li>
              You only stamp starts. Each line ends where the next timed line
              starts, and the last one ends with the song.
            </li>
          </ul>
        </section>

        <section>
          <h3>3. Fix the timing</h3>
          <ul>
            <li>
              <b>One line:</b> select it and use −0.5 / −0.1 / +0.1 / +0.5 in
              the <b>Selected line</b> panel.
            </li>
            <li>
              <b>Several lines:</b> tick their checkboxes, or <kbd>Shift</kbd>
              -click to tick a range, then nudge them together. Their spacing
              stays the same, and untimed lines are skipped.
            </li>
            <li>
              ▶ plays from a line's start, so you can hear what you placed.
            </li>
            <li>
              On each line: clear its timing, edit its text (<kbd>Enter</kbd> to
              apply, <kbd>Esc</kbd> to cancel), or undo its changes back to the
              last save.
            </li>
          </ul>
        </section>

        <section>
          <h3>4. Rules</h3>
          <ul>
            <li>
              A line turns <span className={styles.danger}>red</span> when it
              starts at or after the next timed line, or after the end of the
              song. Fix it before saving.
            </li>
            <li>
              A nudge that would push a line out of the song or out of order is
              disabled.
            </li>
            <li>
              A dot marks unsaved changes, on the line and on its track in the
              track list.
            </li>
          </ul>
        </section>

        <section>
          <h3>5. Save</h3>
          <ul>
            <li>
              <b>Save changes</b> saves the open track. Switching tracks keeps
              each track's unsaved work.
            </li>
            <li>
              The ⋮ menu next to the track name has <b>Reset timings</b>,
              which clears every
              timing and saves straight away.
            </li>
            <li>
              Your own tracks can also be edited or deleted from that menu.
            </li>
          </ul>
        </section>

        <div className={styles.actions}>
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </Modal>
  );
}
