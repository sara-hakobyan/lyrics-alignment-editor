import { useState } from "react";
import { AudioLines, CircleCheck, CircleHelp, Save } from "lucide-react";
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
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <AudioLines aria-hidden="true" />
        </span>
        <span>
          Lyric<span className={styles.brandAccent}>Align</span>
          <small>ALIGNMENT STUDIO</small>
        </span>
      </div>
      <TrackSwitcher />
      <div className={styles.saveStatus} role="status">
        {!canSave && !isSaving && !error && <CircleCheck aria-hidden="true" />}
        {isSaving
          ? "Saving…"
          : error
          ? "Needs attention"
          : canSave
          ? "Unsaved changes"
          : "All changes saved"}
      </div>
      <div className={styles.actions}>
        <Button
          variant="text"
          color="neutral"
          prependIcon={<CircleHelp />}
          onClick={() => setIsGuideOpen(true)}
        >
          How it works
        </Button>
        <Button
          prependIcon={<Save />}
          loading={isSaving}
          disabled={!canSave}
          onClick={saveAlignment}
        >
          Save changes
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <HowItWorksModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </header>
  );
}
