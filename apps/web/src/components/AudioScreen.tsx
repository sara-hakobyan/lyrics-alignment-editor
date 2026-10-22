import type { RefObject } from "react";
import { AudioLines, Timer } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import { useIsPlaying } from "../hooks/useIsPlaying";
import { useSelectedLine } from "../hooks/useSelectedLine";
import Button from "./common/Button";
import NowPlaying from "./NowPlaying";
import Waveform from "./Waveform";
import AudioTransport from "./AudioTransport";
import styles from "./AudioScreen.module.css";

type AudioScreenProps = {
  audioRef: RefObject<HTMLAudioElement>;
  // Stamps the selected line, like the Space shortcut.
  onStamp: () => void;
};

export default function AudioScreen({ audioRef, onStamp }: AudioScreenProps) {
  const { audioUrl, setDuration } = useEditorStore(
    useShallow((s) => ({
      audioUrl: s.track?.audio_url,
      setDuration: s.setDuration,
    }))
  );
  const isPlaying = useIsPlaying(audioRef);
  // The line the next stamp goes to; none once the last line is stamped.
  const { selectedLine, index } = useSelectedLine();
  const stampHint = !selectedLine
    ? "Listen back, check your timings, and save your changes."
    : isPlaying
    ? "Stamp as this line begins. The next line is selected automatically."
    : "Play the track to start stamping. You can slow it down with the speed control.";

  return (
    <main className={styles.panel}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>THE WORKSPACE</span>
        <h1>Every line. Right on time.</h1>
        <p>Listen, stamp each lyric, then fine-tune the timing.</p>
      </div>
      <section className={styles.section}>
        <div className={styles.player}>
          <div className={styles.sectionHeader}>
            <h2>
              <AudioLines aria-hidden="true" /> Audio timeline
            </h2>
            <span>Click the waveform to seek</span>
          </div>
          <audio
            hidden
            src={audioUrl}
            ref={audioRef}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
          <Waveform audioRef={audioRef} audioUrl={audioUrl} />
          <AudioTransport audioRef={audioRef} audioUrl={audioUrl} />
        </div>

        {/* For stamping without a keyboard, e.g. on a touch screen. */}
        <div className={styles.stamp}>
          <div className={styles.stampHeading}>
            <Timer className={styles.step} aria-hidden="true" />
            <h2>
              {selectedLine
                ? `Ready to stamp line ${index + 1}`
                : "No line selected"}
            </h2>
            <span className={styles.state}>
              {isPlaying ? "Listening" : "Paused"}
            </span>
          </div>
          <p className={styles.stampText}>
            {selectedLine?.text ??
              "Select any lyric to review or adjust its timing."}
          </p>
          <Button
            className={styles.stampButton}
            prependIcon={<Timer />}
            disabled={!selectedLine || !isPlaying}
            // Pointer presses stamp immediately; keyboard/assistive clicks stamp once.
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.blur();
              onStamp();
            }}
            onClick={(e) => {
              if (e.detail === 0) onStamp();
            }}
          >
            {selectedLine ? `Stamp line ${index + 1}` : "All lines stamped"}
            <kbd className={styles.key}>Space</kbd>
          </Button>
          <p className={styles.hint}>{stampHint}</p>
        </div>

        <div className={styles.previewHeader}>
          <h2>Live preview</h2>
          <span>Follow your lyrics as they play</span>
        </div>
        <NowPlaying audioRef={audioRef} />
        <div className={styles.shortcuts}>
          <span>
            <kbd>P</kbd> Play / pause
          </span>
          <span>
            <kbd>Space</kbd> Stamp line
          </span>
          <span>Select a lyric to refine it</span>
        </div>
      </section>
    </main>
  );
}
