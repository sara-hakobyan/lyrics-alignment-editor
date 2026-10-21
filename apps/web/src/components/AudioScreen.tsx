import type { RefObject } from "react";
import { Timer } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import { useIsPlaying } from "../hooks/useIsPlaying";
import { useSelectedLine } from "../hooks/useSelectedLine";
import Button from "./common/Button";
import NowPlaying from "./NowPlaying";
import Waveform from "./Waveform";
import styles from "./AudioScreen.module.css";
import Tooltip from "./common/Tooltip";

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

  return (
    <main className={styles.panel}>
      <section className={styles.section}>
        <h3>Alignment</h3>
        {/* Blur on play so Space reaches the stamping shortcut instead of the player. */}
        <div className={styles.player}>
          <audio
            className={styles.audio}
            controls
            src={audioUrl}
            ref={audioRef}
            onPlay={(e) => e.currentTarget.blur()}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
          <Waveform audioRef={audioRef} audioUrl={audioUrl} />
        </div>

        {/* For stamping without a keyboard, e.g. on a touch screen. */}
        {
          <div className={styles.stamp}>
            <Tooltip content="(or press Space)">
              <Button
                className={styles.stampButton}
                prependIcon={<Timer />}
                disabled={!selectedLine || !isPlaying}
                // On press, not release, so the time isn't taken late.
                onPointerDown={(e) => {
                  e.currentTarget.blur();
                  onStamp();
                }}
              >
                {selectedLine ? `Stamp line ${index + 1}` : "All lines stamped"}
                <kbd className={styles.key}>Space</kbd>
              </Button>
            </Tooltip>
            {selectedLine && (
              <p className={styles.stampText}>{selectedLine.text}</p>
            )}
          </div>
        }

        <NowPlaying audioRef={audioRef} />
      </section>
    </main>
  );
}
