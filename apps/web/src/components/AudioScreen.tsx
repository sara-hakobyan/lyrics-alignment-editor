import type { RefObject } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useAlignmentStore } from "../alignment/store";
import type { EditorTrack } from "../types";
import ActionMenu, { type Action } from "./common/ActionMenu";
import styles from "./AudioScreen.module.css";

type TrackAction = "edit" | "reset" | "delete";

const trackActions = (
  track: EditorTrack,
  onAction: (action: TrackAction, track: EditorTrack) => void
): Action[] => [
  {
    label: "Edit",
    icon: <Pencil />,
    onClick: () => onAction("edit", track),
  },
  {
    label: "Reset timings",
    icon: <RotateCcw />,
    onClick: () => onAction("reset", track),
  },
  // The backend has no delete route, so only local tracks can be deleted.
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
  const { tracks, currentTrackId, selectTrack, setDuration } =
    useAlignmentStore(
      useShallow((s) => ({
        tracks: s.tracks,
        currentTrackId: s.track?.id,
        selectTrack: s.selectTrack,
        setDuration: s.setDuration,
      }))
    );

  // Every action works on the track it was chosen for, so that track is selected first.
  const onTrackAction = (action: TrackAction, track: EditorTrack) => {
    selectTrack(track.id);

    switch (action) {
      case "edit":
        console.log("Edit track", track.id);
        break;
      case "reset":
        console.log("Reset timings", track.id);
        break;
      case "delete":
        console.log("Delete track", track.id);
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
                className={
                  isCurrent ? `${styles.track} ${styles.current}` : styles.track
                }
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
    </main>
  );
}
