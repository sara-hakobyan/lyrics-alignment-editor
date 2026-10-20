import { useState, type RefObject } from "react";
import { Pencil, RotateCcw, Save, Trash2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { hasUnsavedChanges } from "../alignment/segments";
import { useEditorStore } from "../alignment/store";
import type { EditorTrack, Line, Segment } from "../types";
import { cx } from "../utils";
import ActionMenu, { type Action } from "./common/ActionMenu";
import Button from "./common/Button";
import ConfirmModal from "./common/ConfirmModal";
import UnsavedDot from "./common/UnsavedDot";
import NowPlaying from "./NowPlaying";
import styles from "./AudioScreen.module.css";
import AddTrackModal from "./AddTrackModal";

type TrackAction = "edit" | "reset" | "delete";

const trackActions = (
  track: EditorTrack,
  onAction: (action: TrackAction, track: EditorTrack) => void
): Action[] => [
  // The backend has no routes to edit or delete a track, so only local tracks get them.
  ...(track.isLocal
    ? [
        {
          label: "Edit",
          icon: <Pencil />,
          onClick: () => onAction("edit", track),
        },
      ]
    : []),
  {
    label: "Reset timings",
    icon: <RotateCcw />,
    onClick: () => onAction("reset", track),
  },
  ...(track.isLocal
    ? [
        {
          label: "Delete",
          icon: <Trash2 />,
          onClick: () => onAction("delete", track),
          danger: true,
        },
      ]
    : []),
];

type AudioScreenProps = {
  audioUrl: string;
  audioRef: RefObject<HTMLAudioElement>;
  // The open track's lines and timings, for the "now playing" readout.
  lines: Line[];
  segments: Segment[];
};

export default function AudioScreen({
  audioUrl,
  audioRef,
  lines,
  segments,
}: AudioScreenProps) {
  const {
    tracks,
    currentTrackId,
    selectTrack,
    setDuration,
    deleteTrack,
    resetTimings,
    startTimesByTrack,
    saveAlignment,
    isSaving,
  } = useEditorStore(
    useShallow((s) => ({
      tracks: s.tracks,
      currentTrackId: s.track?.id,
      selectTrack: s.selectTrack,
      setDuration: s.setDuration,
      deleteTrack: s.deleteTrack,
      resetTimings: s.resetTimings,
      startTimesByTrack: s.startTimesByTrack,
      saveAlignment: s.saveAlignment,
      isSaving: s.isSaving,
    }))
  );

  const unsavedTrackIds = new Set(
    tracks
      .filter((track) => hasUnsavedChanges(track, startTimesByTrack[track.id]))
      .map((track) => track.id)
  );
  // Save follows the open track, so switching tracks updates it.
  const canSave = !!currentTrackId && unsavedTrackIds.has(currentTrackId);
  const [editingTrack, setEditingTrack] = useState<EditorTrack | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: "reset" | "delete";
    track: EditorTrack;
  } | null>(null);

  // Every action works on the track it was chosen for, so that track is selected first.
  const onTrackAction = (action: TrackAction, track: EditorTrack) => {
    selectTrack(track.id);

    switch (action) {
      case "edit":
        setEditingTrack(track);
        break;

      case "reset":
      case "delete":
        setPendingAction({ action, track });
        break;
    }
  };

  return (
    <main className={styles.panel}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Tracks ({tracks.length})</h3>
          <Button
            prependIcon={<Save />}
            loading={isSaving}
            disabled={!canSave}
            onClick={saveAlignment}
          >
            Save changes
          </Button>
        </div>
        <ul className={styles.tracks}>
          {tracks.map((track) => {
            const isCurrent = track.id === currentTrackId;

            return (
              <li
                key={track.id}
                className={cx(styles.track, isCurrent && styles.current)}
              >
                <button
                  type="button"
                  className={styles.select}
                  onClick={() => selectTrack(track.id)}
                  aria-current={isCurrent}
                >
                  <span className={styles.trackTitle}>
                    {track.title}
                    {unsavedTrackIds.has(track.id) && <UnsavedDot />}
                  </span>
                  <span className={styles.trackMeta}>
                    {track.artist}
                    {track.isLocal && " · local"}
                  </span>
                </button>

                <ActionMenu
                  label={`Actions for ${track.title}`}
                  actions={trackActions(track, onTrackAction)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Alignment</h3>
        {/* Blur on play so Space reaches the stamping shortcut instead of the player. */}
        <audio
          className={styles.audio}
          controls
          src={audioUrl}
          ref={audioRef}
          onPlay={(e) => e.currentTarget.blur()}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        <NowPlaying audioRef={audioRef} lines={lines} segments={segments} />
      </section>
      {editingTrack && (
        <AddTrackModal
          isOpen
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
        />
      )}

      {pendingAction?.action === "reset" && (
        <ConfirmModal
          isOpen
          onClose={() => setPendingAction(null)}
          onConfirm={resetTimings}
          title="Reset timings?"
          message={`All timings of "${pendingAction.track.title}" will be cleared and saved. This can't be undone.`}
          confirmLabel="Reset timings"
          danger
        />
      )}

      {pendingAction?.action === "delete" && (
        <ConfirmModal
          isOpen
          onClose={() => setPendingAction(null)}
          onConfirm={() => deleteTrack(pendingAction.track.id)}
          title="Delete track?"
          message={`"${pendingAction.track.title}" and its audio will be removed from this browser. This can't be undone.`}
          confirmLabel="Delete track"
          danger
        />
      )}
    </main>
  );
}
