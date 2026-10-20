import { useEffect, useState, type RefObject } from "react";
import type { Line, Segment } from "../types";
import { cx } from "../utils";
import styles from "./NowPlaying.module.css";

type NowPlayingProps = {
  audioRef: RefObject<HTMLAudioElement>;
  lines: Line[];
  segments: Segment[];
};

// Karaoke-style readout: the line being sung in the middle, with the lines
// before and after it for context.
export default function NowPlaying({
  audioRef,
  lines,
  segments,
}: NowPlayingProps) {
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // Follows the audio every frame while it plays. State only changes when the
  // playing line does, so this re-renders a few times per line, not 60 times a second.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let frame = 0;
    const update = () => {
      const ms = audio.currentTime * 1000;
      const segment = segments.find((s) => ms >= s.start_ms && ms < s.end_ms);
      setPlayingLineId(segment?.line_id ?? null);
    };
    const loop = () => {
      update();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      loop();
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      update();
    };

    audio.addEventListener("play", start);
    audio.addEventListener("pause", stop);
    audio.addEventListener("ended", stop);
    audio.addEventListener("seeked", update);
    if (audio.paused) update();
    else start();

    return () => {
      cancelAnimationFrame(frame);
      audio.removeEventListener("play", start);
      audio.removeEventListener("pause", stop);
      audio.removeEventListener("ended", stop);
      audio.removeEventListener("seeked", update);
    };
  }, [audioRef, segments]);

  const index = lines.findIndex((line) => line.id === playingLineId);

  if (segments.length === 0) {
    return (
      <div className={styles.readout}>
        <p className={styles.empty}>
          Nothing is timed yet. Stamped lines will light up here as they're sung.
        </p>
      </div>
    );
  }

  if (index === -1) {
    return (
      <div className={styles.readout}>
        <p className={styles.empty}>Play the track to see the current line.</p>
      </div>
    );
  }

  const context = [lines[index - 1], lines[index], lines[index + 1]];

  return (
    <div className={styles.readout}>
      {context.map((line, i) => (
        <p
          key={line?.id ?? `empty-${i}`}
          className={cx(styles.line, i === 1 ? styles.current : styles.context)}
        >
          {/* A non-breaking space keeps the row's height at the first and last line. */}
          {line?.text ?? " "}
        </p>
      ))}
    </div>
  );
}
