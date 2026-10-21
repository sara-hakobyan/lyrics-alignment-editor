import { useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import AddTrackModal from "./AddTrackModal";
import Button from "./common/Button";
import HowItWorksModal from "./HowItWorksModal";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const { title, error } = useEditorStore(
    useShallow((s) => ({
      title: s.track?.title,
      error: s.error,
    }))
  );

  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

      <Button
        className={styles.guideButton}
        prependIcon={<Lightbulb />}
        onClick={() => setIsGuideOpen(true)}
      >
        How it works
      </Button>

      <AddTrackModal isOpen={isAddTrackOpen} onClose={closeModal} />
      <HowItWorksModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </header>
  );
}
