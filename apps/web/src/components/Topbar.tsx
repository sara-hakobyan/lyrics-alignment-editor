import { useState } from "react";
import { Plus } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import AddTrackModal from "./AddTrackModal";
import Button from "./common/Button";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const { title, error } = useEditorStore(
    useShallow((s) => ({
      title: s.track?.title,
      error: s.error,
    }))
  );

  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);

  const openAddTrack = () => setIsAddTrackOpen(true);

  const closeModal = () => setIsAddTrackOpen(false);

  return (
    <header className={styles.topbar}>
      <Button
        variant="outlined"
        color="neutral"
        prependIcon={<Plus />}
        onClick={openAddTrack}
      >
        Add track
      </Button>

      <h2 className={styles.title}>{title}</h2>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <AddTrackModal isOpen={isAddTrackOpen} onClose={closeModal} />
    </header>
  );
}
