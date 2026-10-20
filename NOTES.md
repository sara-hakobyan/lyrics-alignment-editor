# Notes

A lyric alignment editor: play the track, press **Space** as each line starts, fix mistakes, save. It works with the seeded track and with any song the user adds (their own audio file and pasted lyrics).

The decisions the AI agent made on its own following my commands are logged in [`decisions.md`](decisions.md). This file covers my own choices.

## How to try it with your own song

1. `pnpm install && pnpm dev`, then open http://localhost:5173
2. **Add track** → pick an audio file (mp3, wav, ogg…), paste the lyrics (one line per row), optionally a title and artist
3. Select the new track, press play, and press **Space** as each line starts. The selection moves to the next line by itself.
4. **Save Changes**, then reload: the track, its audio and its timings are all still there.

## What I chose

### Architecture

```
src/
├── App.tsx               layout, audio element, Space shortcut
├── types.ts              shared data types
├── alignment/
│   ├── store.ts          Zustand store: tracks, stamps, selection, loading, saving
│   ├── service.ts        turns every call into { success, data, error }; picks server or browser
│   ├── remoteRepository.ts   API calls
│   ├── localRepository.ts    IndexedDB calls
│   ├── db.ts             IndexedDB schema (Dexie)
│   └── segments.ts       builds the API's segments from start times
└── components/
    ├── Topbar, LyricsPanel, AudioScreen, LineDetailsPanel, AddTrackModal
    └── common/           Button, TextField, Modal, ConfirmModal, ActionMenu, Spinner
```

Components only talk to the store, the store only talks to the service, and the service is the only place that knows whether a track lives on the server or in the browser. Each file has one job, which keeps the code modular and easy to find your way around.

### One data shape for the server and the browser

Local tracks use exactly the same types as the API: `Track`, `Line`, `Segment`, and the same save request and response. A local track is the server's `Track` plus `isLocal: true`, and saving it returns the same response shape as `PUT /api/v1/track/alignment`. In a real project this makes swapping mocked or local data for a real API quick: only the repository changes, not the store or the UI. `isLocal` is never sent to the API.

### Zustand instead of React state

A lot of data and logic is shared across the app: the open track, the stamps, the selected line, saving and loading. With a global store, each component reads what it needs directly, so there's no prop drilling, and the components stay short, readable and clean.

### Saving

The seeded track is saved through the API (`PUT /api/v1/track/alignment`), so the server stays the source of truth and the 400/409 cases are handled. Tracks the user adds are saved in the browser with IndexedDB, because the API has only one track and no route to create another. I used IndexedDB instead of localStorage because it can store the audio file itself, so a user's track still plays after a reload. localStorage only holds a few MB of text, and the temporary `blob:` URL stops working on reload. Both paths return the same response shape, so the rest of the app doesn't care where a track is saved.

### One units boundary

Times are kept in **integer milliseconds** everywhere in the app's data, the same as the API. Seconds only appear at the edges, where the browser or the API uses them: the audio element's `currentTime`, the track's `duration_seconds`, and the `m:ss.cc` text on screen. Conversion happens only there: when a line is stamped, when a line is played, when the last line's end time is worked out from the track length, and in `formatMs` for display.

### End times are calculated

The user only stamps start times. Each line ends where the next timed line starts, and the last one ends with the track. That keeps timing to one key press per line, and lines never overlap.

### Reusable components and global styles

A small UI kit (`Button`, `TextField`, `Modal`, `ConfirmModal`, `ActionMenu`, `Spinner`) and global design tokens for colour, spacing and radius in `styles.css`. Every component uses the same tokens, so spacing, corners and colours stay consistent and the app looks the same everywhere.

### Smaller things

- Each track keeps its own unsaved stamps when you switch between tracks.
- Editing a local track's lyrics keeps the timings of lines whose text didn't change.
- Reset and Delete ask for confirmation. Delete and Edit only exist for local tracks, since the API can't do either.
- Loaders stay up for at least 1 second, so a fast response doesn't make them flash.
- I didn't change the backend.
- Added dependencies: `zustand` (state), `dexie` (IndexedDB), `lucide-react` (icons).
