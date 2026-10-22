import { useState } from "react";
import { AudioLines, CircleCheck, CircleHelp, Save } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import { hasUnsavedChanges } from "../data-alignment/timings";
import Button from "./common/Button";
import HowItWorksModal from "./HowItWorksModal";
import TrackSwitcher from "./TrackSwitcher";
import SaveConflictModal from "./SaveConflictModal";
import HistoryControls from "./HistoryControls";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const {
    error,
    canSave,
    isSaving,
    saveAlignment,
    hasConflict,
    isConflictOpen,
    reviewConflict,
  } = useEditorStore(
    useShallow((s) => ({
      error: (s.track && s.saveErrorsByTrack[s.track.id]) || s.error,
      hasConflict: !!s.track && !!s.conflictsByTrack[s.track.id],
      isConflictOpen: !!s.track && s.conflictDialogTrackId === s.track.id,
      reviewConflict: s.reviewSaveConflict,
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
      <HistoryControls />
      <div className={styles.saveStatus} role="status">
        {!canSave && !hasConflict && !isSaving && !error && (
          <CircleCheck aria-hidden="true" />
        )}
        {isSaving
          ? "Saving…"
          : hasConflict
          ? "Save conflict"
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
          disabled={!canSave && !hasConflict}
          onClick={saveAlignment}
        >
          Save changes
        </Button>
      </div>
      {hasConflict && (
        <div className={styles.conflict} role="status">
          <span>A newer version is saved. Your draft is still here.</span>
          <Button
            variant="outlined"
            size="small"
            onClick={reviewConflict}
            disabled={isSaving}
          >
            Review save conflict
          </Button>
        </div>
      )}
      {error && !isConflictOpen && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <SaveConflictModal />

      <HowItWorksModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </header>
  );
}
