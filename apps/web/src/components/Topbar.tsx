import { useState } from "react";
import { Lightbulb, Save } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import { hasUnsavedChanges } from "../data-alignment/timings";
import Button from "./common/Button";
import HowItWorksModal from "./HowItWorksModal";
import TrackSwitcher from "./TrackSwitcher";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const { error, canSave, isSaving, saveAlignment } = useEditorStore(
    useShallow((s) => ({
      error: s.error,
      // Save follows the open track, so switching tracks updates it.
      canSave:
        !!s.track &&
        hasUnsavedChanges(
          s.track,
          s.startTimesByTrack[s.track.id],
          s.linesByTrack[s.track.id]
        ),
      isSaving: s.isSaving,
      saveAlignment: s.saveAlignment,
    }))
  );

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <TrackSwitcher />

      <div className={styles.spacer}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <Button
        prependIcon={<Save />}
        loading={isSaving}
        disabled={!canSave}
        onClick={saveAlignment}
      >
        Save changes
      </Button>

      <Button
        className={styles.guideButton}
        prependIcon={<Lightbulb />}
        onClick={() => setIsGuideOpen(true)}
      >
        How it works
      </Button>

      <HowItWorksModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </header>
  );
}
