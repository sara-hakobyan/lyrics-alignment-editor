import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Music,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useEditorStore } from "../data-alignment/store";
import {
  getSavedStartTimes,
  hasUnsavedChanges,
} from "../data-alignment/timings";
import type { EditorTrack } from "../types";
import { cx } from "../utils";
import ActionMenu, { type Action } from "./common/ActionMenu";
import ConfirmModal from "./common/ConfirmModal";
import UnsavedDot from "./common/UnsavedDot";
import AddTrackModal from "./AddTrackModal";
import styles from "./TrackSwitcher.module.css";

type PendingAction = "edit" | "reset" | "delete";

// The action waiting for its modal, and the track it's for.
type Pending = { action: PendingAction; track: EditorTrack };

// A track's ⋮ actions in the list. The backend has no routes to edit or delete
// a track, so only local tracks get them.
const trackActions = (
  track: EditorTrack,
  onAction: (action: PendingAction) => void
): Action[] => [
  ...(track.isLocal
    ? [{ label: "Edit", icon: <Pencil />, onClick: () => onAction("edit") }]
    : []),
  {
    label: "Reset timings",
    icon: <RotateCcw />,
    onClick: () => onAction("reset"),
  },
  ...(track.isLocal
    ? [
        {
          label: "Delete",
          icon: <Trash2 />,
          onClick: () => onAction("delete"),
          danger: true,
        },
      ]
    : []),
];

// The open track's name in the top bar. Clicking it opens the list of tracks.
export default function TrackSwitcher() {
  const { track, selectTrack, deleteTrack, resetTimings, isUnsaved } =
    useEditorStore(
      useShallow((s) => ({
        track: s.track,
        selectTrack: s.selectTrack,
        deleteTrack: s.deleteTrack,
        resetTimings: s.resetTimings,
        isUnsaved:
          !!s.track &&
          hasUnsavedChanges(
            s.track,
            s.startTimesByTrack[s.track.id],
            s.linesByTrack[s.track.id]
          ),
      }))
    );

  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on a click outside or on Escape, like ActionMenu. Not while an
  // action's modal is open, so the list is still there after it.
  useEffect(() => {
    if (!isOpen || pending) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, pending]);

  const openAddTrack = () => {
    setIsOpen(false);
    setIsAddOpen(true);
  };

  // Reset works on the open track, so it opens that track first. Edit and
  // delete take the track itself.
  const startAction = (target: EditorTrack, action: PendingAction) => {
    if (action === "reset") selectTrack(target.id);
    setPending({ action, track: target });
  };

  return (
    <div className={styles.switcher}>
      <div ref={wrapperRef} className={styles.wrapper}>
        {/* A heading wrapping a button, so the open track is still the page's title. */}
        <h2
          className={styles.heading}
          aria-label={track?.title ?? "Choose a track"}
        >
          <button
            ref={triggerRef}
            type="button"
            className={cx(styles.trigger, isOpen && styles.open)}
            aria-label={
              track
                ? `Track: ${track.title}${isUnsaved ? ", not saved" : ""}`
                : "Choose a track"
            }
            aria-expanded={isOpen}
            aria-controls={menuId}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={styles.cover}>
              <Music />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>
                {track?.title ?? "No track yet"}
                {isUnsaved && <UnsavedDot />}
              </span>
              <span className={styles.meta}>
                {track
                  ? `${track.artist}${track.isLocal ? " · local" : ""}`
                  : "Add one to start"}
              </span>
            </span>
            <ChevronDown className={styles.chevron} />
          </button>
        </h2>

        {isOpen && (
          <TrackMenu
            id={menuId}
            onPicked={() => setIsOpen(false)}
            onAddTrack={openAddTrack}
            onAction={startAction}
          />
        )}
      </div>

      <AddTrackModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {pending?.action === "edit" && (
        <AddTrackModal
          isOpen
          track={pending.track}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.action === "reset" && (
        <ConfirmModal
          isOpen
          onClose={() => setPending(null)}
          onConfirm={resetTimings}
          title="Reset timings?"
          message={`All timings of "${pending.track.title}" will be cleared and saved, together with any unsaved text edits. This can't be undone.`}
          confirmLabel="Reset timings"
          danger
        />
      )}

      {pending?.action === "delete" && (
        <ConfirmModal
          isOpen
          onClose={() => setPending(null)}
          onConfirm={() => deleteTrack(pending.track.id)}
          title="Delete track?"
          message={`"${pending.track.title}" and its audio will be removed from this browser. This can't be undone.`}
          confirmLabel="Delete track"
          danger
        />
      )}
    </div>
  );
}

type TrackMenuProps = {
  id: string;
  onPicked: () => void;
  onAddTrack: () => void;
  onAction: (track: EditorTrack, action: PendingAction) => void;
};

// Its own component, so the counts are only worked out while the menu is open,
// not on every stamp.
function TrackMenu({ id, onPicked, onAddTrack, onAction }: TrackMenuProps) {
  const {
    tracks,
    currentTrackId,
    selectTrack,
    startTimesByTrack,
    linesByTrack,
  } = useEditorStore(
    useShallow((s) => ({
      tracks: s.tracks,
      currentTrackId: s.track?.id,
      selectTrack: s.selectTrack,
      startTimesByTrack: s.startTimesByTrack,
      linesByTrack: s.linesByTrack,
    }))
  );

  return (
    <div id={id} className={styles.menu}>
      <div className={styles.menuHeader}>
        <span>Your tracks</span>
        <span>{tracks.length}</span>
      </div>

      <ul className={styles.list}>
        {tracks.map((track) => {
          const isCurrent = track.id === currentTrackId;
          // A track that was never opened has no draft yet, so its last save is used.
          const lines = linesByTrack[track.id] ?? track.lines;
          const startTimes =
            startTimesByTrack[track.id] ?? getSavedStartTimes(track);
          const timedCount = lines.filter(
            (line) => startTimes[line.id] !== undefined
          ).length;
          const isUnsaved = hasUnsavedChanges(
            track,
            startTimesByTrack[track.id],
            linesByTrack[track.id]
          );

          return (
            <li key={track.id} className={styles.row}>
              <button
                type="button"
                className={cx(styles.item, isCurrent && styles.current)}
                aria-current={isCurrent}
                onClick={() => {
                  selectTrack(track.id);
                  onPicked();
                }}
              >
                <span className={styles.cover}>
                  <Music />
                </span>
                <span className={styles.text}>
                  <span className={styles.title}>
                    {track.title}
                    {isUnsaved && <UnsavedDot />}
                  </span>
                  <span className={styles.meta}>
                    {track.artist}
                    {track.isLocal && (
                      <span className={styles.badge}>local</span>
                    )}
                  </span>
                </span>
                {isCurrent ? (
                  <Check className={styles.check} aria-label="Open now" />
                ) : (
                  <span className={styles.count}>
                    {timedCount} / {lines.length} timed
                  </span>
                )}
              </button>
              <ActionMenu
                label={`Actions for ${track.title}`}
                actions={trackActions(track, (action) =>
                  onAction(track, action)
                )}
              />
            </li>
          );
        })}
      </ul>

      <div className={styles.divider} />

      <button type="button" className={styles.addItem} onClick={onAddTrack}>
        <span className={styles.addIcon}>
          <Plus />
        </span>
        Add track
      </button>
    </div>
  );
}
