import { useEffect, useRef } from "react";
import Topbar from "./components/Topbar";
import LyricsPanel from "./components/LyricsPanel";
import AudioScreen from "./components/AudioScreen";
import LineDetailsPanel from "./components/LineDetailsPanel";
import Spinner from "./components/common/Spinner";
import styles from "./App.module.css";
import { useEditorStore } from "./alignment/store";
import { useTimingState } from "./hooks/useTimingState";
import { useShallow } from "zustand/shallow";

export default function App() {
  const { error, loadTracks, selectLine, stampLine } = useEditorStore(
    useShallow((s) => ({
      error: s.error,
      loadTracks: s.loadTracks,
      selectLine: s.selectLine,
      stampLine: s.stampLine,
    }))
  );
  const { track, startTimesMs } = useTimingState();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const playLine = (lineId: string) => {
    const audio = audioRef.current;
    const startMs = startTimesMs[lineId];

    if (!audio || startMs === undefined) return;
    selectLine(lineId);
    audio.currentTime = startMs / 1000;
    void audio.play();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;

      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input, textarea, select") ||
          e.target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      stampLine(audio.currentTime);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [stampLine]);

  // Save errors show in the top bar; these screens are only for before the track loads.
  if (!track && error) return <p className={styles.status}>{error}</p>;
  if (!track) {
    return (
      <div className={styles.loader} role="status">
        <Spinner className={styles.spinner} />
        <span>Loading editor…</span>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      <Topbar />

      <div className={styles.editorContent}>
        <LyricsPanel onPlayLine={playLine} />
        <AudioScreen audioRef={audioRef} />
        <LineDetailsPanel onPlayLine={playLine} />
      </div>
    </div>
  );
}
