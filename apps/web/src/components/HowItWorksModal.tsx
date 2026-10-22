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
            <li>
              Stamping only works while the track plays. Press <kbd>P</kbd> to
              play or pause when you're not focused on a control. Use the speed
              menu to slow down a difficult section.
            </li>
            <li>
              The waveform under the player fills in as the song plays. Click it
              to jump to that point.
            </li>
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
              apply, <kbd>Esc</kbd> to cancel), or <b>Restore last save</b> to
              restore its saved text and timing.
            </li>
            <li>
              Use <b>Undo</b> and <b>Redo</b> in the top bar, or{" "}
              <kbd>Ctrl/⌘ Z</kbd> and <kbd>Ctrl/⌘ Shift Z</kbd> (
              <kbd>Ctrl Y</kbd> also redoes). Bulk actions undo together. While
              typing, these shortcuts undo text in the input.
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
              If the track was saved elsewhere, your draft stays in the editor.
              Choose <b>Keep editing</b>, <b>Use latest saved version</b> to
              discard your unsaved changes, or <b>Replace with my version</b> to
              overwrite the latest saved lyrics and timings. You can reopen the
              choice with <b>Review save conflict</b>.
            </li>
            <li>
              Drafts and undo history survive track switches and saves, but not
              a page reload. Undo after saving creates unsaved changes. Adopting
              a server version or replacing a whole lyric sheet clears that
              track's history.
            </li>
            <li>
              In the track list, each track's ⋮ menu has <b>Reset timings</b>,
              which clears every timing and saves straight away.
            </li>
            <li>
              Your own tracks can also be edited or deleted from that menu. The
              list stays open afterwards, so you can carry on with another
              track.
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
