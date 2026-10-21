import type { RefObject } from "react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../alignment/store";
import NowPlaying from "./NowPlaying";
import TrackList from "./TrackList";
import styles from "./AudioScreen.module.css";

type AudioScreenProps = {
  audioRef: RefObject<HTMLAudioElement>;
};

export default function AudioScreen({ audioRef }: AudioScreenProps) {
  const { audioUrl, setDuration } = useEditorStore(
    useShallow((s) => ({
      audioUrl: s.track?.audio_url,
      setDuration: s.setDuration,
    }))
  );

  return (
    <main className={styles.panel}>
      <TrackList />

      <section className={styles.section}>
        <h3>Alignment</h3>
        {/* Blur on play so Space reaches the stamping shortcut instead of the player. */}
        <audio
          className={styles.audio}
          controls
          src={audioUrl}
          ref={audioRef}
          onPlay={(e) => e.currentTarget.blur()}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        <NowPlaying audioRef={audioRef} />
      </section>
    </main>
  );
}
