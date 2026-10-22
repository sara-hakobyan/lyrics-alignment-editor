import { useEffect, useId, useRef, useState } from "react";
import { FileAudio } from "lucide-react";
import { getLines, useEditorStore } from "../data-alignment/store";
import Button from "./common/Button";
import Modal from "./common/Modal";
import TextField from "./common/TextField";
import styles from "./AddTrackModal.module.css";
import { EditorTrack } from "../types";
import { useShallow } from "zustand/shallow";

type AddTrackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  track?: EditorTrack;
};

export default function AddTrackModal({
  isOpen,
  onClose,
  track,
}: AddTrackModalProps) {
  const { addTrack, updateTrack, loadAudioFile, lines } = useEditorStore(
    useShallow((s) => ({
      addTrack: s.addTrack,
      updateTrack: s.updateTrack,
      loadAudioFile: s.loadAudioFile,
      // With text edits, so saving the form doesn't drop them.
      lines: track ? getLines(s, track) : undefined,
    }))
  );
  // The add and edit modals can be in the page together, so the id must be unique.
  const audioFileId = useId();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const [lyrics, setLyrics] = useState(
    lines?.map((line) => line.text).join("\n") ?? ""
  );
  const [trackTitle, setTrackTitle] = useState(track?.title ?? "");
  const [artist, setArtist] = useState(track?.artist ?? "");

  // When editing, the form is filled with the track's stored audio too.
  useEffect(() => {
    if (!track) return;
    loadAudioFile(track.id).then(setAudioFile);
  }, [track, loadAudioFile]);

  const canSubmit = audioFile !== null && lyrics.trim() !== "";

  // Puts the form back to how it opened, then closes it.
  const close = () => {
    setTrackTitle(track?.title ?? "");
    setArtist(track?.artist ?? "");
    setLyrics(lines?.map((line) => line.text).join("\n") ?? "");
    if (!track) setAudioFile(null);
    // A file input can't be cleared through state, only through the element.
    if (audioFileRef.current) audioFileRef.current.value = "";
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;

    const input = { title: trackTitle, artist, audioFile, lyrics };
    const isDone = track
      ? await updateTrack(track, input)
      : await addTrack(input);
    // On failure the form stays open with what was typed; the error shows in the top bar.
    if (!isDone) return;
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} width={520}>
      <div className={styles.form}>
        <h2 className={styles.formTitle}>
          {track ? "Edit track" : "Add a track"}
        </h2>

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

        {/* The audio can't be changed when editing, so the stored file is only shown. */}
        {track ? (
          <div className={styles.fileField}>
            <span className={styles.fileLabel}>Audio file</span>
            <div className={styles.audioFile}>
              <FileAudio />
              <span>{audioFile?.name ?? "Loading…"}</span>
            </div>
          </div>
        ) : (
          <div className={styles.fileField}>
            <label htmlFor={audioFileId} className={styles.fileLabel}>
              Audio file
            </label>
            <input
              id={audioFileId}
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setAudioFile(file ?? null);
              }}
            />
          </div>
        )}

        <TextField
          label="Lyrics"
          value={lyrics}
          onChange={setLyrics}
          multiline
          rows={8}
          placeholder="One line per row"
        />

        <div className={styles.actions}>
          <Button variant="text" color="neutral" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {track ? "Update track" : "Add track"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
