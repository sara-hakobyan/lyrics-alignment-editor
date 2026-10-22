import { useEffect, useRef, useState, type RefObject } from "react";
import WaveSurfer from "wavesurfer.js";
import styles from "./Waveform.module.css";

type WaveformProps = {
  audioRef: RefObject<HTMLAudioElement>;
  audioUrl?: string;
};

export default function Waveform({ audioRef, audioUrl }: WaveformProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  // Rebuilt per track: the URL arrives after the first render and changes on track switch.
  useEffect(() => {
    if (!boxRef.current || !audioRef.current || !audioUrl) return;
    setStatus("loading");
    // The canvas can't use CSS variables, so read the palette tokens once.
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const ws = WaveSurfer.create({
      container: boxRef.current,
      // Draws from the existing player and follows its playback.
      media: audioRef.current,
      url: audioUrl,
      height: 100,
      normalize: true,
      waveColor: token("--waveform"),
      progressColor: token("--waveform-played"),
      cursorColor: token("--playhead"),
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      interact: true,
    });
    const stopReady = ws.on("ready", () => setStatus("ready"));
    const stopError = ws.on("error", () => setStatus("error"));
    return () => {
      stopReady();
      stopError();
      ws.destroy();
    };
  }, [audioRef, audioUrl]);

  return (
    <div className={styles.waveform}>
      <div ref={boxRef} aria-hidden="true" />
      {status !== "ready" && (
        <p className={styles.status} role="status">
          {status === "loading"
            ? "Preparing waveform…"
            : "Waveform unavailable. Use the playback slider to seek."}
        </p>
      )}
    </div>
  );
}
