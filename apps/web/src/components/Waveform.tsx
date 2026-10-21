import { useEffect, useRef, type RefObject } from "react";
import WaveSurfer from "wavesurfer.js";

type WaveformProps = {
  audioRef: RefObject<HTMLAudioElement>;
  audioUrl?: string;
};

export default function Waveform({ audioRef, audioUrl }: WaveformProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  // Rebuilt per track: the URL arrives after the first render and changes on track switch.
  useEffect(() => {
    if (!boxRef.current || !audioRef.current || !audioUrl) return;
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
    return () => ws.destroy();
  }, [audioRef, audioUrl]);

  return <div ref={boxRef} />;
}
