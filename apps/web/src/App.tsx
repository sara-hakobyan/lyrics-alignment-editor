import { useEffect, useMemo, useRef } from "react";
import Topbar from "./components/Topbar";
import LyricsPanel from "./components/LyricsPanel";
import AudioScreen from "./components/AudioScreen";
import LineDetailsPanel from "./components/LineDetailsPanel";
import Spinner from "./components/common/Spinner";
import styles from "./App.module.css";
import { buildSegments } from "./alignment/segments";
import { useEditorStore } from "./alignment/store";
import { useShallow } from "zustand/shallow";

// Same object every time, so the store selector doesn't see a "change" when a track has no stamps.
const NO_START_TIMES: Record<string, number> = {};

export default function App() {
  const {
    track,
    startTimesMs,
    selectedLineId,
    error,
    loadTracks,
    selectLine,
    stampLine,
    clearLineTiming,
  } = useEditorStore(
    useShallow((s) => ({
      track: s.track,
      startTimesMs: s.track
        ? s.startTimesByTrack[s.track.id] ?? NO_START_TIMES
        : NO_START_TIMES,
      selectedLineId: s.selectedLineId,
      error: s.error,
      loadTracks: s.loadTracks,
      selectLine: s.selectLine,
      stampLine: s.stampLine,
      clearLineTiming: s.clearLineTiming,
    }))
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const endMsByLineId = useMemo(() => {
    const segments = track ? buildSegments(track, startTimesMs) : [];
    return new Map(segments.map((s) => [s.line_id, s.end_ms]));
  }, [track, startTimesMs]);

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

  const selectedIndex = track.lines.findIndex(
    (line) => line.id === selectedLineId
  );
  const selectedLine = track.lines[selectedIndex];

  return (
    <div className={styles.editor}>
      <Topbar />

      <div className={styles.editorContent}>
        <LyricsPanel
          lines={track.lines}
          startTimesMs={startTimesMs}
          selectedLineId={selectedLineId}
          onSelectLine={selectLine}
          onPlayLine={playLine}
          onClearLineTiming={clearLineTiming}
        />

        <AudioScreen audioUrl={track.audio_url} audioRef={audioRef} />

        <LineDetailsPanel
          selectedLine={selectedLine}
          lineNumber={selectedLine ? selectedIndex + 1 : undefined}
          startMs={selectedLine ? startTimesMs[selectedLine.id] : undefined}
          endMs={selectedLine ? endMsByLineId.get(selectedLine.id) : undefined}
          onClearLineTiming={clearLineTiming}
        />
      </div>
    </div>
  );
}
