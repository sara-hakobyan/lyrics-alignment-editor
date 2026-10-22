import { useEffect, useState, type RefObject } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useIsPlaying } from "../hooks/useIsPlaying";
import { formatTime } from "../utils";
import Button from "./common/Button";
import styles from "./AudioTransport.module.css";

type AudioTransportProps = {
  audioRef: RefObject<HTMLAudioElement>;
  audioUrl?: string;
};

export default function AudioTransport({
  audioRef,
  audioUrl,
}: AudioTransportProps) {
  const isPlaying = useIsPlaying(audioRef);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    const update = () => {
      setPosition(audio.currentTime);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setMuted(audio.muted);
      setRate(audio.playbackRate);
    };
    const failed = () =>
      setError(
        "Audio couldn't load. Try reloading the audio or choose another track."
      );
    const clearError = () => setError(null);
    const events = [
      "timeupdate",
      "loadedmetadata",
      "durationchange",
      "emptied",
      "seeked",
      "volumechange",
      "ratechange",
    ];
    events.forEach((event) => audio.addEventListener(event, update));
    audio.addEventListener("error", failed);
    audio.addEventListener("playing", clearError);
    update();
    return () => {
      events.forEach((event) => audio.removeEventListener(event, update));
      audio.removeEventListener("error", failed);
      audio.removeEventListener("playing", clearError);
    };
  }, [audioRef, audioUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) audio.pause();
    else {
      try {
        await audio.play();
        setError(null);
      } catch {
        setError("Playback couldn't start. Try again or reload the audio.");
      }
    }
  };

  return (
    <div className={styles.transport}>
      <div className={styles.controls}>
        <Button
          className={styles.play}
          icon={isPlaying ? <Pause /> : <Play />}
          aria-label={isPlaying ? "Pause track" : "Play track"}
          disabled={!audioUrl}
          onClick={(event) => {
            if (event.detail > 0) event.currentTarget.blur();
            void togglePlayback();
          }}
        />
        <Button
          variant="text"
          color="neutral"
          icon={<RotateCcw />}
          aria-label="Restart track"
          disabled={!duration}
          onClick={() => {
            setPosition(0);
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
        />
        <div className={styles.time}>
          <span>{formatTime(position)}</span>
          <span className={styles.total}> / {formatTime(duration)}</span>
        </div>
        <label className={styles.speed}>
          <span className="srOnly">Playback speed</span>
          <select
            value={rate}
            onChange={(event) => {
              if (audioRef.current)
                audioRef.current.playbackRate = Number(event.target.value);
            }}
          >
            <option value={0.5}>0.5×</option>
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
          </select>
        </label>
        <Button
          variant="text"
          color="neutral"
          icon={muted ? <VolumeX /> : <Volume2 />}
          aria-label={muted ? "Unmute track" : "Mute track"}
          onClick={() => {
            if (audioRef.current)
              audioRef.current.muted = !audioRef.current.muted;
          }}
        />
      </div>
      <input
        className={styles.seek}
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(position, duration)}
        disabled={!duration}
        aria-label="Playback position"
        aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
        onChange={(event) => {
          const seconds = Number(event.target.value);
          setPosition(seconds);
          if (audioRef.current) audioRef.current.currentTime = seconds;
        }}
      />
      {error && (
        <div className={styles.error} role="alert">
          {error}
          <Button
            size="small"
            variant="outlined"
            color="neutral"
            onClick={() => {
              setError(null);
              audioRef.current?.load();
            }}
          >
            Reload audio
          </Button>
        </div>
      )}
    </div>
  );
}
