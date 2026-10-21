import { useEffect, useState, type RefObject } from "react";

// Whether the audio is playing, kept up to date from its play/pause events.
export function useIsPlaying(audioRef: RefObject<HTMLAudioElement>) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setIsPlaying(!audio.paused);
    update();
    audio.addEventListener("play", update);
    audio.addEventListener("pause", update);
    audio.addEventListener("ended", update);

    return () => {
      audio.removeEventListener("play", update);
      audio.removeEventListener("pause", update);
      audio.removeEventListener("ended", update);
    };
  }, [audioRef]);

  return isPlaying;
}
