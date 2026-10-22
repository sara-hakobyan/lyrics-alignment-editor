import { useId } from "react";
import { GitCompareArrows } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import Button from "./common/Button";
import Modal from "./common/Modal";
import styles from "./SaveConflictModal.module.css";

export default function SaveConflictModal() {
  const { track, conflict, error, isSaving, dismiss, useLatest, replace } =
    useEditorStore(
      useShallow((s) => ({
        track: s.track,
        conflict:
          s.track && s.conflictDialogTrackId === s.track.id
            ? s.conflictsByTrack[s.track.id]
            : undefined,
        error: s.track ? s.saveErrorsByTrack[s.track.id] : undefined,
        isSaving: s.isSaving,
        dismiss: s.dismissSaveConflict,
        useLatest: s.useLatestSavedVersion,
        replace: s.replaceWithMyVersion,
      }))
    );
  const titleId = useId();
  const descriptionId = useId();
  if (!track || !conflict) return null;

  return (
    <Modal
      isOpen
      onClose={dismiss}
      dismissible={!isSaving}
      labelledBy={titleId}
      describedBy={descriptionId}
      width={560}
    >
      <div className={styles.content}>
        <span className={styles.icon}>
          <GitCompareArrows aria-hidden="true" />
        </span>
        <h2 id={titleId}>This track was updated elsewhere</h2>
        <p id={descriptionId}>
          Your changes to <strong>{track.title}</strong> haven't been saved.
          They are still in the editor. Choose which version to keep.
        </p>
        <p className={styles.versions} role="status">
          Your draft started from version {track.version}. Latest saved version:{" "}
          {conflict.version}.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {/* The first focus target keeps the draft; destructive choices are explicit. */}
        <Button
          variant="outlined"
          color="neutral"
          onClick={dismiss}
          disabled={isSaving}
        >
          Keep editing
        </Button>
        <div className={styles.choice}>
          <p id={`${descriptionId}-latest`}>
            Discard your unsaved lyrics and timings and load the latest saved
            version.
          </p>
          <Button
            variant="outlined"
            color="neutral"
            aria-describedby={`${descriptionId}-latest`}
            disabled={isSaving}
            onClick={() => useLatest(track.id)}
          >
            Use latest saved version
          </Button>
        </div>
        <div className={styles.choice}>
          <p id={`${descriptionId}-replace`}>
            Save your draft over the latest saved lyrics and timings, including
            changes made elsewhere.
          </p>
          <Button
            color="danger"
            aria-describedby={`${descriptionId}-replace`}
            loading={isSaving}
            onClick={() => replace(track.id)}
          >
            Replace with my version
          </Button>
        </div>
      </div>
    </Modal>
  );
}
