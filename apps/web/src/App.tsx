import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Alignment, Segment } from "./types";
import Topbar from "./components/Topbar";
import LeftPannel from "./components/LeftPannel";
import AudioScreen from "./components/AudioScreen";
import RightPannel from "./components/RightPannel";
import styles from "./App.module.css";
import { useAlignmentStore } from "./alignment/store";
import { useShallow } from "zustand/shallow";

export default function App() {
  const { track, error, loadTrack } = useAlignmentStore(
    useShallow((s) => ({
      track: s.track,
      error: s.error,
      loadTrack: s.loadTrack,
      isLoading: s.isLoading,
    }))
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const [startTimesMs, setStartTimesMs] = useState<Record<string, number>>({});
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  useEffect(() => {
    if (!track) return;
    setSelectedLineId(track.lines[0]?.id ?? null);
    setStartTimesMs(
      Object.fromEntries(
        (track.alignment?.segments ?? []).map((s) => [s.line_id, s.start_ms])
      )
    );
  }, [track?.id]);

  console.log(track);
  // Stamps the selected line with the current playback time, then moves the
  // selection to the next line so the user can keep tapping.
  const stampSelectedLine = (currentTime: number) => {
    if (!track || !selectedLineId) return;

    const selectedIndex = track.lines.findIndex(
      (line) => line.id === selectedLineId
    );
    if (selectedIndex === -1) return;

    setStartTimesMs({
      ...startTimesMs,
      [selectedLineId]: Math.round(currentTime * 1000),
    });
    setSelectedLineId(track.lines[selectedIndex + 1]?.id ?? null);
  };

  const alignment = useMemo<Alignment>(() => {
    const segments: Segment[] = track
      ? track.lines
          .filter((line) => startTimesMs[line.id] !== undefined)
          .map((line) => {
            const lineIndex = track.lines.findIndex(
              (item) => item.id === line.id
            );

            const nextTimedLine = track.lines
              .slice(lineIndex + 1)
              .find((item) => startTimesMs[item.id] !== undefined);

            return {
              line_id: line.id,
              start_ms: startTimesMs[line.id],
              end_ms: nextTimedLine
                ? startTimesMs[nextTimedLine.id]
                : Math.round((track.duration_seconds ?? 0) * 1000),
            };
          })
      : [];

    return { segments };
  }, [track, startTimesMs]);

  const playLine = (lineId: string) => {
    const audio = audioRef.current;
    const startMs = startTimesMs[lineId];

    if (!audio || startMs === undefined) return;
    setSelectedLineId(lineId);
    audio.currentTime = startMs / 1000;
    void audio.play();
  };

  const clearLineTiming = (lineId: string) => {
    setStartTimesMs((prev) => {
      const updated = { ...prev };
      delete updated[lineId];
      return updated;
    });

    setSelectedLineId(lineId);
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

      stampSelectedLine(audio.currentTime);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [track, selectedLineId, startTimesMs]);

  // Save errors show in the top bar; these screens are only for before the track loads.
  if (!track && error) return <p className={styles.status}>{error}</p>;
  if (!track) {
    return (
      <div className={styles.loader} role="status">
        <Loader2 className={styles.spinner} aria-hidden="true" />
        <span>Loading track…</span>
      </div>
    );
  }

  const selectedIndex = track.lines.findIndex(
    (line) => line.id === selectedLineId
  );
  const selectedLine = track.lines[selectedIndex];

  return (
    <div className={styles.editor}>
      <Topbar title={track.title} segments={alignment.segments} />

      <div className={styles.editorContent}>
        <LeftPannel
          lines={track.lines}
          startTimesMs={startTimesMs}
          selectedLineId={selectedLineId}
          onSelectLine={setSelectedLineId}
          onPlayLine={playLine}
          onClearLineTiming={clearLineTiming}
        />

        <AudioScreen audioUrl={track.audio_url} audioRef={audioRef} />

        <RightPannel
          selectedLine={selectedLine}
          lineNumber={selectedLine ? selectedIndex + 1 : undefined}
          startMs={selectedLine ? startTimesMs[selectedLine.id] : undefined}
          endMs={
            alignment.segments.find((s) => s.line_id === selectedLine?.id)
              ?.end_ms
          }
          onClearLineTiming={clearLineTiming}
        />
      </div>
    </div>
  );
}
