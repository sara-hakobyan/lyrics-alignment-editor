import { useRef, useState } from "react";
import { useEditorStore } from "../alignment/store";
import Button from "./common/Button";
import Modal from "./common/Modal";
import TextField from "./common/TextField";
import styles from "./AddTrackModal.module.css";

type AddTrackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AddTrackModal({ isOpen, onClose }: AddTrackModalProps) {
  const addTrack = useEditorStore((s) => s.addTrack);

  const [audioUrl, setAudioUrl] = useState("");
  const audioFileRef = useRef<HTMLInputElement>(null);
  const [lyrics, setLyrics] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [artist, setArtist] = useState("");

  const canAddTrack = audioUrl !== "" && lyrics.trim() !== "";

  const addNewTrack = async () => {
    if (!canAddTrack) return;

    await addTrack({ title: trackTitle, artist, audioUrl, lyrics });

    setTrackTitle("");
    setArtist("");
    setAudioUrl("");
    // A file input can't be cleared through state, only through the element.
    if (audioFileRef.current) audioFileRef.current.value = "";
    setLyrics("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width={520}>
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
          <Button variant="text" color="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={addNewTrack} disabled={!canAddTrack}>
            Add track
          </Button>
        </div>
      </div>
    </Modal>
  );
}
