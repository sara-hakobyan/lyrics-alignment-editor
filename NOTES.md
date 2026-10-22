# Notes

A lyric alignment editor: play the track, press **Space** as each line starts, fix mistakes, save. It works with the seeded track and with any song the user adds (their own audio file and pasted lyrics).

The decisions the AI agent made on its own following my commands are logged in [`decisions.md`](decisions.md). This file covers my own choices.

## How I used AI

I used AI to cover the must-haves with a better user experience, and to cover as many edge cases as possible. My approach with it:

- I give it pseudocode and let it cover the cases, then I reviewed code.
- It refactors the components and splits them following my approach and commands.
- It reviews my code to find cases I didn't catch at first implemanation.
- The full design and styling is implemented by AI, as prompted, with modular CSS.

Some of the implementation may not match what the AI suggested, because some things were updated after its suggestions and after logging them in `decisions.md`.

## How to try it with your own song

1. `pnpm install && pnpm dev`, then open http://localhost:5173
2. Click the track name at the top left, then **Add track** at the bottom of the list → pick an audio file , paste the lyrics (one line per row), optionally a title and artist
3. Open the track name again and select the new track, press play, and press **Space** as each line starts. The selection moves to the next line by itself.
4. **Save changes** (in the top bar), then reload: the track, its audio and its timings are all still there.

The **How it works** button in the top bar explains every feature and rule inside the app.

Tested with a second song: "Wicked Game" by Chris Isaak (4:48), with its lyrics pasted in. I added it, timed every line, saved and reloaded, and the audio and all timings were kept.

## What it does

**Timing**

- **Stamping:** Space (or the Stamp button, for touch screens) stamps the selected line with the playback time and selects the next line, so a whole song is one pass of tapping. It only stamps while the track plays, and Space is ignored while typing in a field.
- **Re-stamping:** click any line to select it, then stamp it again.
- **End times are calculated:** each line ends where the next timed line starts, and the last one ends with the track.
- **Waveform:** under the player, the song's waveform fills in as it plays, with a violet playhead. Click it to jump to that point.
- **Playback:** P plays or pauses when focus is outside a control. The transport includes keyboard seeking, restart, mute, and playback speed. Space on a focused button or checkbox keeps its native behavior.

**Fixing**

- **Nudge one line** by ±0.1 s / ±0.5 s in the Selected line panel.
- **Bulk nudge:** tick lines (Shift-click for a range, or select all) and shift them together. Their spacing is kept and untimed lines are skipped.
- **Per line:** play from its start (to hear what was placed), clear its timing, edit its text, or restore its last saved time and text. These are icon buttons on each row, each with a tooltip.
- **Bulk clear / restore** for the ticked lines.
- **Undo / redo:** buttons in the top bar, or Ctrl/⌘ Z and Ctrl/⌘ Shift Z (Ctrl Y also redoes). A bulk action undoes in one step, and each track keeps its own history.

**Feedback and rules**

- Untimed lines are muted, with an "N untimed" count above the list.
- Invalid lines (starting at or after the next timed line, or after the end of the track) are red with the reason, and saving is blocked until they're fixed.
- A nudge that would create a new invalid line or leave the track is disabled.
- A dot marks unsaved changes on the line and on its track.
- A karaoke readout shows the line playing now with the lines before and after it.
- Errors (a failed load, a rejected save) show in the top bar without replacing the editor, so unsaved work stays on screen.
- A save conflict opens a choice: keep editing, discard the draft and use the latest saved version, or explicitly replace that version with the draft. Dismissing the dialog keeps the conflict available through **Review save conflict**.

**Tracks**

- Add, edit (title, artist, lyrics) and delete your own tracks. Editing the lyrics keeps the timings of lines whose text didn't change.
- **Reset timings** clears a track and saves at once. Reset and Delete ask for confirmation.
- A track's actions are in the ⋮ menu on its row in the track list. The list stays open after an action, so you can carry on with another track.
- Each track keeps its own unsaved work when you switch between tracks.

## What I chose

### Architecture

```
src/
├── App.tsx                 layout, audio element, Space shortcut
├── types.ts                shared data types
├── utils.ts                time formatting, lyric parsing
├── data-alignment/
│   ├── store.ts            creates the app's store with the real service
│   ├── createEditorStore.ts    Zustand store: tracks, stamps, text edits, selection, history, loading, saving
│   ├── commands.ts         undo/redo commands: stamp, edit text, clear, restore, nudge, reset
│   ├── service.ts          turns every call into { success, data, error }; picks server or browser
│   ├── remoteRepository.ts API calls
│   ├── localRepository.ts  IndexedDB calls
│   ├── db.ts               IndexedDB schema (Dexie)
│   └── timings.ts          segments from start times, validation, nudge limits, unsaved checks
├── history/                Command, CommandManager, CompositeCommand (no app code)
├── hooks/                  useTimingState, useSelectedLine, useIsPlaying, useHistoryShortcuts
└── components/
    ├── Topbar, TrackSwitcher, HistoryControls, AudioScreen, AudioTransport, Waveform, NowPlaying, LineDetailsPanel,
    │   SaveConflictModal, NudgeButtons, AddTrackModal, HowItWorksModal
    ├── lyrics/             LyricsPanel, LyricLineRow, LyricsBulkBar, LineTextInput
    └── common/             Button, TextField, Modal, ConfirmModal, ActionMenu, Tooltip, Spinner, UnsavedDot
```

Components only talk to the store, the store only talks to the service, and the service is the only place that knows whether a track lives on the server or in the browser. The timing rules are plain functions in `timings.ts`, so the store, the panels and the nudge buttons all use the same ones.

### One data shape for the server and the browser

Local tracks use exactly the same types as the API: `Track`, `Line`, `Segment`, and the same save request and response. A local track is the server's `Track` plus `isLocal: true`, and saving it returns the same response shape as `PUT /api/v1/track/alignment`. In a real project this makes swapping mocked or local data for a real API quick: only the repository changes, not the store or the UI. `isLocal` is never sent to the API.

### Zustand instead of React state

A lot of data and logic is shared across the app: the open track, the stamps, the text edits, the selected and ticked lines, saving and loading. With a global store, each component reads what it needs directly, so there's no prop drilling, and the components stay short. Each component reads the store with one `useShallow` selector, so it only re-renders when the values it uses change.

### Drafts next to the last save

Stamps and text edits are kept per track as drafts (`startTimesByTrack`, `linesByTrack`), while `track` always holds the last save. "Unsaved" is always draft vs last save, which drives the dots, the restore buttons and the Save button. Undo/redo availability comes from history, independently of whether the draft is saved.

### Undo and redo: a command history

I built undo/redo as a command history (the Command pattern), not as snapshots of the state. Every edit that can be undone is a small class with `run()` and `undo()` in `commands.ts`: stamp, edit text, clear timing, restore last save, nudge and reset timings. A command keeps only the values it changes, before and after, so undo puts back exactly what was there and redo puts back exactly what was done, even a stamp's playback time.

Why commands fit this editor:

- **A bulk edit is one step.** A bulk nudge, clear or restore is one `CompositeCommand` with a command per line. It runs them in order and undoes them in reverse, so moving eight lines is undone with one Ctrl Z, not eight.
- **The history stays small.** A stamp remembers one number, not a copy of every line and timing, so 200 steps per track cost almost nothing.
- **Every edit goes through one path.** Each store action builds a command and runs it with `runCommand`, so a new kind of edit gets undo by adding a command class. The history and the buttons don't change.
- **An edit that changes nothing isn't recorded**, so Undo never does nothing, and Redo stays available.

**Kept out of Zustand.** The classes in `history/` (`Command`, `CommandManager`, `CompositeCommand`) know nothing about the app. Each track has its own `CommandManager` with up to 200 steps, in a `Map` inside the store creator. Zustand only holds the next Undo and Redo labels (`historyByTrack`) for the buttons and their tooltips, so no component reads or re-renders from the command stacks.

**When history is kept and when it's cleared.** Saving and switching tracks keep it. Undo after a save makes that change unsaved again, and undo never saves; Reset timings can be undone, but has to be saved again. A new edit after an undo clears Redo. Using the latest saved version in a conflict, saving a track through its edit form, or deleting it clears that track's history, because old commands could point at lines that changed. A reload clears all history.

Selecting a line by hand isn't an undo step, but stamping and Reset timings undo the selection change they make. A text edit is recorded when it's applied, not per keystroke.

**Shortcuts.** Undo and Redo buttons sit in the top bar. Ctrl/⌘ Z undoes, Ctrl/⌘ Shift Z and Ctrl Y redo. The shortcuts are ignored while typing in a field or inside a dialog, so Ctrl Z there still undoes the typing.

### Saving

The seeded track is saved through the API (`PUT /api/v1/track/alignment`), so the server stays the source of truth and the 400/409 cases are handled. Tracks the user adds are saved in the browser with IndexedDB, because the API has only one track and no route to create another. I used IndexedDB instead of localStorage because it can store the audio file itself, so a user's track still plays after a reload. localStorage only holds a few MB of text, and the temporary `blob:` URL stops working on reload. Both paths return the same response shape, so the rest of the app doesn't care where a track is saved.

Invalid timings are never sent: the app checks them before saving, because the API would accept some of them and the local save would accept all of them.

For a 409, the service returns the latest version, lines and alignment from the response. Conflicts and save errors belong to their original track. **Use latest saved version** adopts that state without another request and explicitly discards the draft. **Replace with my version** sends the current draft with the returned version; it never retries automatically. Another 409 updates the dialog, and a failed retry keeps the draft and the choices. A successful save updates the saved baseline without dropping edits made while the request was pending.

Drafts, conflicts and undo history are kept in memory. Reloading still loses unsaved work; automatic draft recovery and automatic merging are not implemented.

### One units boundary

Times are kept in **integer milliseconds** everywhere in the app's data, the same as the API. Seconds only appear at the edges, where the browser or the API uses them: the audio element's `currentTime`, the track's `duration_seconds`, and the `m:ss.cc` text on screen. Conversion happens only there: when a line is stamped, when a line is played, when the last line's end time is worked out from the track length, and in `formatMs` for display.

### End times are calculated

The user only stamps start times. Each line ends where the next timed line starts, and the last one ends with the track. That keeps timing to one key press per line, and lines never overlap.

### Reusable components and global styles

A small UI kit (`Button`, `TextField`, `Modal`, `ConfirmModal`, `ActionMenu`, `Tooltip`, `Spinner`) and global design tokens for colour, spacing and radius in `styles.css`. Every component uses the same tokens, so spacing, corners and colours stay consistent.

### Waveform

I added a waveform (wavesurfer.js) to make the editor more appealing and the playback easier to follow: you can see where the song gets loud or quiet, how far it has played, and click anywhere to jump there. It draws from the app's existing `<audio>` element instead of playing the song itself, so there is still one player, and stamping, the karaoke readout and the waveform all follow the same playback. It is rebuilt when you switch tracks, and its colours come from the same design tokens as the rest of the app.

### Smaller things

- Line actions are visible icon buttons on each row, not hidden in a menu, because they're used constantly while fixing timings.
- Icon buttons have tooltips; a disabled button still shows its tooltip.
- Loaders stay up for at least 1 second, so a fast response doesn't make them flash.
- Delete and Edit only exist for local tracks, since the API can't do either.
- I didn't change the backend.
- Added dependencies: `zustand` (state), `dexie` (IndexedDB), `lucide-react` (icons), `wavesurfer.js` (waveform).

## Tests

`pnpm test` runs four Playwright specs (`pnpm test:ui` to watch them run):

- `e2e/save-conflict.spec.ts`: **a rejected save.** The test breaks the save payload on its way out (`version: "abc"`) and lets it reach the real server, which answers 400. It checks that the server's hint shows in the top bar, the edited line is still there, and Save is still enabled. The server rejects it before storing anything, so the database isn't touched.
- `e2e/own-track.spec.ts`: **bring your own track.** It adds a track with an audio file and 3 pasted lines, checks it shows 3 untimed lines, reloads, and checks the track and its lines are still there.
- `e2e/load-error.spec.ts`: **a failed load.** The API answers 503 until the retry. It checks that the error screen shows the server's hint, then that **Try again** opens the editor.
- `e2e/track.spec.ts`: **the seeded track loads.** It checks the track's title shows.

The 409 flow has no automated test. I tested it by hand with two tabs: I saved in one tab, then saved in the other without reloading, and the conflict dialog opened.

Undo/redo has no automated test.

## What I deliberately skipped

Only the bold part of each item was skipped. The rest says what the app does instead.

- **Line blocks on the waveform that can be dragged to move or trim them, and zoom.** The waveform is for following playback and seeking. Lines are placed by stamping and fixed by nudging, one line or many at once. End times are calculated from the next line's start, so there are no edges to trim by hand.
- **Split and merge, adding a single line, reordering lines.** Instead, a line's text can be edited on its row, and a track's whole lyric sheet can be edited (for your own tracks).
- **Automatic merging of conflicting versions.** Instead, a 409 provides an explicit choice to keep editing, adopt the latest saved version, or replace it with the draft.
- **LRC export.**
- **Dedicated shortcuts for line navigation and nudging.** Space stamps and P controls playback outside focused controls, and Ctrl/⌘ Z / Shift Z undo and redo. Native controls are keyboard-accessible, but there are no dedicated shortcuts for moving the lyric selection or nudging.
- **Dark mode.**

## What surprised me

- A `blob:` URL stops working after a reload, so local audio "saved" in localStorage was silently dead. That's what moved local tracks to IndexedDB.
