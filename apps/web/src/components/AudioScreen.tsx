import { useState, type RefObject } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../alignment/store";
import type { EditorTrack } from "../types";
import { cx } from "../utils";
import ActionMenu, { type Action } from "./common/ActionMenu";
import ConfirmModal from "./common/ConfirmModal";
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
};

export default function AudioScreen({ audioUrl, audioRef }: AudioScreenProps) {
  const {
    tracks,
    currentTrackId,
    selectTrack,
    setDuration,
    deleteTrack,
    resetTimings,
  } = useEditorStore(
    useShallow((s) => ({
      tracks: s.tracks,
      currentTrackId: s.track?.id,
      selectTrack: s.selectTrack,
      setDuration: s.setDuration,
      deleteTrack: s.deleteTrack,
      resetTimings: s.resetTimings,
    }))
  );
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
        <h3>Tracks ({tracks.length})</h3>
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
                  <span className={styles.trackTitle}>{track.title}</span>
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
        <div className={styles.placeholder}>
          Waveform / timeline will go here
        </div>
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
