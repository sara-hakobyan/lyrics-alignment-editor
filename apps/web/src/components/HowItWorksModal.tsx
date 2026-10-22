import { useId } from "react";
import {
  ArrowRight,
  AudioLines,
  ChevronDown,
  Keyboard,
  Save,
  X,
} from "lucide-react";
import Button from "./common/Button";
import Modal from "./common/Modal";
import styles from "./HowItWorksModal.module.css";

type HowItWorksModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width={860}
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <div className={styles.guide}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.brandIcon}>
              <AudioLines aria-hidden="true" />
            </span>
            <div>
              <p className={styles.eyebrow}>A QUICK GUIDE</p>
              <h2 id={titleId} className={styles.title}>
                How it works
              </h2>
            </div>
          </div>
          <Button
            variant="text"
            color="neutral"
            icon={<X />}
            aria-label="Close"
            onClick={onClose}
          />
          <p id={descriptionId} className={styles.intro}>
            Play the song. Tap the starts. Fine-tune the rest.
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.overview}>
            <section aria-labelledby={`${titleId}-start`}>
              <h3 id={`${titleId}-start`}>Your first alignment</h3>
              <ol className={styles.steps}>
                <li>
                  <span className={styles.stepNumber} aria-hidden="true">
                    1
                  </span>
                  <div>
                    <h4>Choose a track</h4>
                    <p>
                      Open the track menu at the top to pick a song, or{" "}
                      <strong>Add track</strong> with your own audio and lyrics.
                    </p>
                  </div>
                </li>
                <li>
                  <span className={styles.stepNumber} aria-hidden="true">
                    2
                  </span>
                  <div>
                    <h4>Play, then stamp</h4>
                    <p>
                      During playback, press <kbd>Space</kbd> or the{" "}
                      <strong>Stamp</strong> button as each line starts. The
                      next line is selected for you.
                    </p>
                  </div>
                </li>
                <li>
                  <span className={styles.stepNumber} aria-hidden="true">
                    3
                  </span>
                  <div>
                    <h4>Fine-tune and save</h4>
                    <p>
                      Select a lyric and adjust its start by ±0.1 or ±0.5
                      seconds in <strong>Fine-tune</strong>. Listen back, then{" "}
                      <strong>Save changes</strong>.
                    </p>
                  </div>
                </li>
              </ol>
              <p className={styles.tip}>
                You only set the starts. Each line ends at the next timed line,
                or the end of the song.
              </p>
            </section>

            <section
              className={styles.shortcuts}
              aria-labelledby={`${titleId}-keys`}
            >
              <div className={styles.shortcutHeading}>
                <Keyboard aria-hidden="true" />
                <h3 id={`${titleId}-keys`}>At your fingertips</h3>
              </div>
              <dl className={styles.keyList}>
                <div>
                  <dt>Stamp a line</dt>
                  <dd>
                    <kbd>Space</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Play / pause</dt>
                  <dd>
                    <kbd>P</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Undo</dt>
                  <dd>
                    <kbd>Ctrl / ⌘</kbd>
                    <kbd>Z</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Redo</dt>
                  <dd>
                    <kbd>Ctrl / ⌘</kbd>
                    <kbd>Shift</kbd>
                    <kbd>Z</kbd>
                  </dd>
                </div>
              </dl>
              <p className={styles.shortcutNote}>
                <kbd>Ctrl</kbd> + <kbd>Y</kbd> also redoes.
              </p>
              <p className={styles.shortcutNote}>
                Space and P work outside focused controls. While typing, undo
                works on the text in that field.
              </p>
              <div className={styles.inputKeys}>
                <span>
                  <kbd>Enter</kbd> Apply text
                </span>
                <span>
                  <kbd>Esc</kbd> Cancel edit
                </span>
              </div>
            </section>
          </div>

          <section
            className={styles.reference}
            aria-labelledby={`${titleId}-reference`}
          >
            <h3 id={`${titleId}-reference`}>When you need a little more</h3>
            <div className={styles.topics}>
              <details className={styles.topic}>
                <summary>
                  Adjust timing &amp; lyrics <ChevronDown aria-hidden="true" />
                </summary>
                <div className={styles.topicContent}>
                  <p>
                    <strong>Missed a start?</strong> Select the lyric and stamp
                    it again while the song plays. Click the waveform to seek,
                    or use the speed menu to slow down a tricky section. A
                    line’s play button previews its timing.
                  </p>
                  <p>
                    <strong>Move several lines:</strong> tick their checkboxes,
                    or Shift-click a checkbox to select a range. Nudge them
                    together to keep their spacing; untimed lines are skipped.
                    Bulk clear and restore work on the same selection.
                  </p>
                  <p>
                    <strong>Edit a line:</strong> use its pencil button, then
                    Enter to apply or Esc to cancel. Clear timing removes its
                    start. Restore last save returns its saved text and timing;
                    that restore can itself be undone.
                  </p>
                  <p>
                    <strong>A line marked in red</strong> starts at or after the
                    next timed line, or at or beyond the end of the song. Fix it
                    before saving. Nudges that would leave the song or create a
                    new timing error are disabled.
                  </p>
                </div>
              </details>
              <details className={styles.topic}>
                <summary>
                  Undo, redo &amp; saving <ChevronDown aria-hidden="true" />
                </summary>
                <div className={styles.topicContent}>
                  <p>
                    <strong>Undo reverses your last edit.</strong> Redo brings
                    it back. Stamps, text edits, nudges, clearing and restoring
                    are all included. A bulk action takes one undo step; a new
                    edit replaces the redo history.
                  </p>
                  <p>
                    <strong>Save changes saves the open track.</strong> A dot
                    beside a line or track means it has unsaved changes.
                    Switching tracks keeps each track’s draft and undo history;
                    reloading loses unsaved edits and history.
                  </p>
                  <p>
                    <strong>You can undo after saving.</strong> The result
                    becomes an unsaved draft, so save again to keep it.
                    Accepting a newer saved version or updating a track through
                    its edit form clears that track’s history.
                  </p>
                </div>
              </details>
              <details className={styles.topic}>
                <summary>
                  Another version was saved <ChevronDown aria-hidden="true" />
                </summary>
                <div className={styles.topicContent}>
                  <p>
                    Your draft stays in the editor if the track was saved
                    elsewhere. You choose what happens next:
                  </p>
                  <ul>
                    <li>
                      <strong>Keep editing</strong> keeps your draft without
                      saving it.
                    </li>
                    <li>
                      <strong>Use latest saved version</strong> discards your
                      draft and loads the newer saved lyrics and timings.
                    </li>
                    <li>
                      <strong>Replace with my version</strong> saves your draft
                      over the newer version, including changes made elsewhere.
                    </li>
                  </ul>
                  <p>
                    You can reopen these choices with{" "}
                    <strong>Review save conflict</strong>.
                  </p>
                </div>
              </details>
              <details className={styles.topic}>
                <summary>
                  Your tracks &amp; resetting timings{" "}
                  <ChevronDown aria-hidden="true" />
                </summary>
                <div className={styles.topicContent}>
                  <p>
                    <strong>Bring your own song:</strong> choose Add track, pick
                    an audio file and paste lyrics with one line per row. Title
                    and artist are optional. Your tracks, including audio, are
                    saved in this browser; the built-in track is saved on the
                    server.
                  </p>
                  <p>
                    <strong>The track’s ⋮ menu</strong> lets you edit or delete
                    your own tracks. The built-in track only offers Reset
                    timings here; you can still edit its individual lyric lines.
                  </p>
                  <p>
                    <strong>
                      Reset timings clears every start and saves immediately,
                    </strong>{" "}
                    together with any unsaved text edits. Undo can restore the
                    timings during this session; save again to keep them.
                    Deleting a track cannot be undone.
                  </p>
                </div>
              </details>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <div className={styles.saveReminder}>
            <Save aria-hidden="true" />
            <p>
              <strong>Save before you leave.</strong>
              <br />
              Unsaved edits and undo history are lost on reload.
            </p>
          </div>
          <Button appendIcon={<ArrowRight />} onClick={onClose}>
            Back to editor
          </Button>
        </div>
      </div>
    </Modal>
  );
}
