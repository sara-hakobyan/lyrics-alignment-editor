import { useRef, useState } from "react";
import { Plus, Save } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useAlignmentStore } from "../alignment/store";
import type { EditorTrack, Segment } from "../types";
import { parseLyrics } from "../utils";
import Button from "./common/Button";
import Modal from "./common/Modal";
import styles from "./Topbar.module.css";
import TextField from "./common/TextField";

type TopbarProps = {
  title: string;
  segments: Segment[];
};

export default function Topbar({ title, segments }: TopbarProps) {
  const { saveAlignment, addTrack, error, isLoading } = useAlignmentStore(
    useShallow((s) => ({
      saveAlignment: s.saveAlignment,
      addTrack: s.addTrack,
      error: s.error,
      isLoading: s.isLoading,
    }))
  );

  const [isLoadMoreOpen, setIsLoadMoreOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const audioFileRef = useRef<HTMLInputElement>(null);
  const [lyrics, setLyrics] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [artist, setArtist] = useState("");

  const canAddTrack = audioUrl !== "" && lyrics.trim() !== "";

  const onSave = () => saveAlignment(segments);

  const onLoadTrack = () => setIsLoadMoreOpen(!isLoadMoreOpen);

  const closeModal = () => setIsLoadMoreOpen(false);

  const addNewTrack = async () => {
    const lines = parseLyrics(lyrics);
    if (!audioUrl.trim() || lines.length === 0) return;

    const track: EditorTrack = {
      id: crypto.randomUUID(),
      title: trackTitle.trim() || "Untitled track",
      artist: artist.trim() || "Unknown artist",
      duration_seconds: 0, // unknown until the audio loads
      audio_url: audioUrl.trim(),
      lines,
      version: 0,
      alignment: null, // nothing timed yet
      isLocal: true,
    };

    await addTrack(track);

    setTrackTitle("");
    setAudioUrl("");
    // A file input can't be cleared through state, only through the element.
    if (audioFileRef.current) audioFileRef.current.value = "";
    setLyrics("");
    setIsLoadMoreOpen(false);
  };

  return (
    <header className={styles.topbar}>
      <Button
        variant="outlined"
        color="neutral"
        prependIcon={<Plus />}
        onClick={onLoadTrack}
      >
        Load Track
      </Button>

      <h2 className={styles.title}>{title}</h2>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button prependIcon={<Save />} loading={isLoading} onClick={onSave}>
        Save Changes
      </Button>

      <Modal isOpen={isLoadMoreOpen} onClose={closeModal} width={520}>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Add a track</h2>

          <TextField
            label="Title"
            value={trackTitle}
            onChange={setTrackTitle}
            placeholder="Song name"
          />

          <TextField
            label="Artist"
            value={artist}
            onChange={setArtist}
            placeholder="Artist name"
          />

          <div className={styles.fileField}>
            <label htmlFor="audio-file" className={styles.fileLabel}>
              Audio file
            </label>
            <input
              id="audio-file"
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setAudioUrl(file ? URL.createObjectURL(file) : "");
              }}
            />
          </div>

          <TextField
            label="Lyrics"
            value={lyrics}
            onChange={setLyrics}
            multiline
            rows={8}
            placeholder="One line per row"
          />

          <div className={styles.actions}>
            <Button variant="text" color="neutral" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={addNewTrack} disabled={!canAddTrack}>
              Add track
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
