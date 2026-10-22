# Decisions

This file logs the technical and architectural decisions that the AI agent (Claude) made on its own while working on this project. Each entry was written while the work was being done, not afterwards.

Decisions and requirements that came from the developer are not recorded here; those go in the developer's own notes.

Every solution was discussed with the developer first. A decision is added to this file only after the developer approved the suggestion.

Each entry has this format:

```
## <short title>
**Decision:** what was decided.
**Why:** the reasoning.
**Alternatives rejected:** what else was considered, and why it lost.
**Trade-offs / assumptions:** what this costs, or what was guessed because the brief did not say.
```

---

_Task: moving the UI from `App.tsx` into the developer's `components/` files._

## State lives in `App`; components get props

All state (track, start times, selected line), the audio ref and the Space-key handler stay in `App`. The components in `components/` only render and call callbacks. `Topbar` gets the audio element through a plain `audioRef` prop.

- **Why:** stamping updates the start times and the selection together and reads the audio element, so one owner means nothing to keep in sync.
- **Considered:** React context, which wasn't worth it for components one level deep, and `forwardRef` for the audio. A named prop does the same job with less code.
- **Trade-off:** `App` passes several props per panel and is still the largest file.

**Changed by developer:** the state moved from `App` into a Zustand store (`alignment/store.ts`): the tracks, each track's stamps (`startTimesByTrack`), the selected line, stamping, saving and loading. Components such as `Topbar` and `AudioScreen` now read the store directly instead of getting everything through `App`, because the developer wanted parts like the Save button to call the store themselves rather than have `App` pass callbacks down. The audio element ref and the Space-key handler still live in `App`, since they need the `<audio>` element.

## Shared types in `src/types.ts`

`Line`, `Track`, `Segment` and `Alignment` moved from `App.tsx` to `src/types.ts`.

- **Why:** both panels need `Line`. Exporting it from `App.tsx` would work, since `import type` is removed at compile time and creates no runtime cycle. But it would make components depend on the file that renders them. A separate types file keeps dependencies pointing one way.
- **Considered:** exporting the types from `App.tsx`.

---

_Task: adding the alignment service (`alignment/service.ts`) with try/catch around the repository calls._

## Service returns a result object instead of throwing

`loadTrack` and `saveAlignment` catch errors and return `{ ok: true, ... }` or `{ ok: false, ... }`. A 409 comes back as its own `reason: "conflict"` case carrying the server's state. Other failures become a `message`, using the server's `hint` when there is one.

- **Why:** callers can't forget to handle a failure, because TypeScript makes them check `ok` first. The 409 is kept apart from other errors because it needs different handling (reconcile with the server's state, not just show an error), and the brief rewards handling it.
- **Considered:** rethrowing a custom error from the `catch`, which still leaves every caller to write its own try/catch.
- **Trade-off:** the 409 body is cast to `ServerState` without checking it at runtime. It trusts the fixture server's documented shape.

**Changed by developer:** replaced with one simple generic type, `Response<T> = { success, data, error }` in `types.ts`, which the store uses too, because the separate result types were more complex than needed. A 409 is now an `error` message like any other failure, so the server's state from the 409 is no longer passed back to the caller.

---

_Task: replacing the colour tokens in `styles.css` with a new palette (light theme only, as the developer asked)._

## Colour tokens named by role, with one colour per line state

The palette adds tokens named after what they mean in the editor, not what they look like: `--success` for timed lines, `--text-muted` for untimed ones, `--accent-soft` for the selected line, `--danger` for save errors and invalid timings, and `--playhead`, `--waveform` and `--waveform-played` for the waveform that doesn't exist yet. There's one violet accent, used only for frequent actions (Save, play, the current track).

- **Why:** the brief asks that untimed lines be obvious at a glance, so each line state gets its own colour. Role names let components say what something _is_, and changing the palette later is a one-file edit.
- **Considered:** colour-named tokens (`--violet-500`, `--green-600`), which make components choose a shade instead of a meaning.
- **Trade-off:** tokens for the waveform are defined before it exists. The component CSS modules still use hard-coded greys (`#ccc`, `#eee`, `#f0f0f0`) and don't follow the palette until they're switched to tokens.

## `color-scheme: light` with only the light theme active

`color-scheme` changed from `light dark` to `light`.

- **Why:** with only light colours defined, `light dark` would still let the browser draw dark form controls, scrollbars and the file picker for viewers whose system is in dark mode, which clashes with a light page.
- **Trade-off:** turning the commented-out dark theme back on needs `color-scheme: light dark` restored as well. The comment above the dark block is the reminder.

---

_Task: creating a reusable `Button` component (icons, colour, size, icon-only), modelled on MUI / Vuetify as the developer asked._

## Button label is `children`, not a `title` prop

The developer listed a "button title" property. It's implemented as `children`.

- **Why:** `title` is already an HTML attribute (the hover tooltip), and the component passes native button props through, so a `title` prop would clash with it. MUI uses `children` for the same reason.
- **Trade-off:** the label goes between the tags (`<Button>Save</Button>`), not in an attribute.

## Colour set through CSS variables, so variants and colours combine freely

Each colour class (`primary`, `neutral`) only sets `--btn-color`, `--btn-contrast` and `--btn-soft`. Each variant (`contained`, `outlined`, `text`) only reads those variables.

- **Why:** 3 variants × 2 colours need 5 classes this way instead of 6 combined ones, and adding a colour later is one small class.
- **Considered:** one class per combination (`.containedPrimary`, `.textNeutral`…), which grows with every new colour.

## Scope limited to what the app uses now

`color` is only `primary` / `neutral` and `size` is only `small` / `medium`. Icons are sized by CSS (`1em`) instead of a prop, and an `icon`-only button is round.

- **Why:** the developer asked for nothing beyond the app's needs. Today the app has a primary Save, neutral Load Track / Undo, and small icon buttons in the lyrics list. Sizing icons from the font size means Lucide icons no longer need `size={14}` to match the button.
- **Considered:** MUI's full set (`large`, `error`/`success`/`warning` colours, loading state), which nothing in the app would use yet.
- **Trade-off:** `danger` or `large` have to be added when the first button needs them.

---

_Task: creating a reusable `TextField` in `components/common` (the developer's empty `Textfield.tsx`, renamed), with no MUI/Vuetify-style variants._

## One `TextField` for single-line and multi-line text; file input stays separate

`TextField` renders an `<input type="text">`, or a `<textarea>` when `multiline` is set, like MUI's `TextField`. The audio file picker doesn't use it.

- **Why:** title, artist and lyrics share the same label, border and error message, so one component keeps them consistent. A file input works differently: it can't be controlled with `value`, and it has no text or placeholder, so forcing it into the same props would mean special cases.
- **Considered:** separate `TextInput` and `TextArea` components, which would duplicate the label and error markup.

## `onChange` passes the value, not the event

Callers write `onChange={setTrackTitle}` instead of `onChange={(e) => setTrackTitle(e.target.value)}`.

- **Why:** every field in the app only needs the text. Passing the value removes the same small arrow function from every caller.
- **Considered:** passing the event like a native input (MUI does this).
- **Trade-off:** a caller that someday needs the event, e.g. to read the cursor position, would need the prop changed.

## Label and error wired up with `useId`, no `id` prop

The component generates its own id with React's `useId` and uses it for `<label htmlFor>` and for `aria-describedby` on the error message. It also sets `aria-invalid` when there's an error.

- **Why:** screen readers announce the label and the error with the field, and callers can't forget or duplicate an id. Playwright tests can still find fields with `getByLabel("Title")`.
- **Considered:** a required `id` prop, which every caller would have to invent and keep unique.

---

_Task: restyling the whole app with the palette, spacing tokens and the common `Button` / `TextField` (developer's request), then making the side panels wider (300→340px and 250→290px; the exact widths were my pick)._

## Save errors show in the top bar, not instead of the editor

`App` used to return only the error text whenever the store had an `error`. Now it shows a full-screen message only while there's no track (it never loaded). Any later error, like a rejected save, shows in red in the top bar.

- **Why:** load errors and save errors share the store's `error`. A failed save (a 400 or 409) replaced the whole editor, so the user lost their screen and their unsaved stamps were out of view. The brief rewards coping with a rejected save.
- **Considered:** separate `loadError` and `saveError` in the store, which is cleaner but changes the store's shape for a styling task.
- **Trade-off:** the error stays in the top bar until the next successful save or load clears it.

## "Add track" disabled until a file and lyrics are given

The modal's button is disabled until an audio file is picked and the lyrics aren't empty, and it was renamed from "Save" to "Add track".

- **Why:** `addNewTrack` already did nothing in that case, so the click silently failed. Disabling shows the rule up front. The new name avoids two buttons called "Save" doing different things.
- **Considered:** error messages under the empty fields (`TextField`'s `error` prop). More helpful, but it needs "touched" tracking to avoid showing errors before the user has typed anything.

## Untimed count calculated in the lyrics panel

The "N untimed" badge is counted in `LeftPannel` from the `lines` and `startTimesMs` it already receives.

- **Why:** the brief asks for untimed lines to be obvious at a glance. Counting from existing props means no new state that could drift out of sync.

## Track list uses its own buttons, not the common `Button`

The track cards in `AudioScreen` are plain `<button>`s with their own styles.

- **Why:** they're two-line cards (title + artist) with a "current" state, not actions. Giving `Button` a card variant would add an option only one place uses, which the developer asked to avoid.
- **Replaced (2026-10-21):** the developer chose a track switcher in the top bar over the cards. `TrackSwitcher`'s button and list rows are still plain `<button>`s, for the same reason.

## Editor fills the window; panel headings styled once

The `24px` padding around `#root` was removed, and the global `h3` became the small uppercase label used by every panel.

- **Why:** an editor works better edge to edge, and the padding plus `height: 100vh` made the page scroll a little. All `h3`s in the app are panel labels, so one global rule keeps them identical without repeating it in each CSS module.
- **Trade-off:** a future `h3` used for something else would need its own class.

---

_Task: making loading visible for longer ("extra seconds", developer's request) and showing a full-page loader instead of "Loading…" text (developer asked for a plain loader)._

## Loading lasts at least 1 second, instead of always adding a delay

`loadTrack` and `saveAlignment` in the store wait for both the request and a 1-second timer (`MIN_LOADING_MS`) with `Promise.all`. The loader or spinner stays up for whichever takes longer.

- **Why:** a fast response (local API, localStorage) made spinners flash for a moment, which looks like a glitch. With a minimum, a slow request adds no extra wait on top.
- **Considered:** adding a fixed delay after every request, which would make slow requests even slower.
- **Trade-off:** every save takes at least 1 second, even when it could finish sooner. `MIN_LOADING_MS` is one constant to tune or set to `0`.

---

_Task: creating a reusable `ActionMenu` in `components/common` (⋮ button, any actions such as edit, reset, delete — developer's request)._

## Actions passed as a list of `{ label, icon, onClick, danger }`

Callers pass an `actions` array, and the menu renders one item per entry. `danger` makes an item red.

- **Why:** each place can add or remove actions without touching the component, and the menu closes itself after any action runs, so callers don't manage open/closed state.
- **Considered:** passing menu items as `children`, which is more flexible but makes every caller rebuild the item markup and the closing logic.

## Simple show/hide button, not a full ARIA `role="menu"`

The ⋮ button has `aria-expanded` and `aria-controls`, and the items are plain buttons in a list. Escape and a click outside close it, and Escape returns focus to ⋮.

- **Why:** `role="menu"` promises arrow-key navigation to screen readers. Without implementing that, the role would be wrong. Plain buttons already work with Tab and Enter, which covers the keyboard-only goal.
- **Considered:** the full menu pattern (arrow keys, Home/End, focus roving), which is more code than the app needs now.
- **Trade-off:** the menu is positioned inside its parent, so in a scrolling panel (like the lyrics list) it can be cut off or add a scrollbar near the bottom edge. Rendering it outside the panel (a portal or the Popover API) would fix that.

## Clicks stop at the menu

The wrapper calls `stopPropagation` on clicks.

- **Why:** the menu will sit inside clickable rows like lyric lines. Without this, opening the menu or choosing an action would also select the line behind it.

---

_Task: cleaning up leftovers found in the code review (developer's request)._

## Separate `isSaving` flag; `error` stays shared

The store now has `isSaving` for `saveAlignment`, and `isLoading` is only for `loadTrack`. The Save button reads `isSaving`.

- **Why:** with one flag, any future loader would also turn on during a save (and the other way round).
- **Considered:** also splitting `error` into `loadError` / `saveError`. App only shows the error screen while there's no track, so the shared `error` works for now.
- **Trade-off:** an add-track error and a save error still show in the same place in the top bar.

---

_Task: removing repetition found in the code review (developer's request)._

## `Spinner` in `components/common`, with only a `className` prop

The spinning `Loader2` and its `@keyframes spin` were defined twice (the full-page loader and `Button`). Both now use `<Spinner />`, which owns the animation. Size and colour come from the caller's `className`, or from the font size and text colour when there isn't one.

- **Why:** CSS module keyframe names are local to their file, so one global `@keyframes` couldn't be shared without `:global`. A component keeps the animation in one place.
- **Considered:** `size` / `color` props. Every caller already styles it with CSS, and inside `Button` it must follow the button's font size.

---

_Task: moving local tracks from localStorage to IndexedDB with Dexie (developer's request), because their audio stopped playing after a reload._

## Saved tracks get an empty `audio_url`; the file is stored separately

`addLocalTrack` saves each track with `audio_url: ""` and puts the audio file in its own `audio` table, keyed by track id. `getLocalTracks` makes a new `blob:` URL from the stored file every time it loads.

- **Why:** a `blob:` URL only works in the tab that created it, so a saved one is always dead after a reload. `Track` requires `audio_url` to be a string, and `""` means "no URL saved; it's built on load."
- **Considered:** storing the file on the track record itself (`{ ...track, audioFile }`), which would give `EditorTrack` an extra field that backend tracks never have.
- **Trade-off:** if a track's file were ever missing, the player would just stay empty instead of showing an error. Saving the track and its file in one transaction keeps that from happening.

---

_Task: confirmation modal for "Reset timings" and "Delete" (developer's request; reset clears and saves at once, as the developer chose)._

## `ConfirmModal` awaits `onConfirm` and closes itself

`ConfirmModal` in `components/common` takes `title`, `message`, `confirmLabel`, `danger` and an async `onConfirm`. It shows a spinner on the confirm button while `onConfirm` runs, then closes.

- **Why:** reset and delete both wait on storage, and a spinner shows the click was taken. Callers pass the store action as it is and don't track their own pending state.
- **Considered:** `onConfirm` returning nothing and the caller closing the modal, which leaves every caller to handle loading and closing.
- **Trade-off:** the modal closes even if the action failed. The error then shows in the top bar like any other store error.

## `danger` colour added to `Button`

`color` now takes `"danger"`, which sets the same three CSS variables from `--danger`.

- **Why:** the confirm button for actions that can't be undone should be red. This is the first button that needs it, as the earlier Button entry expected.

## `resetTimings` clears the open track and reuses `saveAlignment`

The store action empties the open track's start times, selects its first line, then calls `saveAlignment`.

- **Why:** saving an empty alignment is a normal save, so it gets the same version check, 409 handling and spinner. It works for local and backend tracks alike.
- **Considered:** a separate "delete alignment" call in the repository, which the backend doesn't have.
- **Trade-off:** it acts on the open track, not a track passed in. That works because the menu selects the track before any action runs, and the modal blocks switching tracks in between.

---

_Task: bulk nudging in the lyrics pane (developer's request: checkboxes, a bulk bar, ±0.5 steps, never past the song's duration). The ±0.1 steps, shift-click ranges and the sticky bar were in the design the developer approved._

## Checked lines are their own store state, apart from the stamping selection

The store has `checkedLineIds` next to `selectedLineId`. Opening another track clears it.

- **Why:** stamping moves `selectedLineId` forward on every Space press. If checking reused it, stamping would keep changing what a bulk nudge applies to.
- **Trade-off:** two kinds of "selected" in one pane. The rows show them differently: a checked row is a lighter tint, and the stamping row is drawn over it.

## The shift-click anchor lives in `LyricsPanel`, not the store

The panel keeps the last checkbox clicked in a ref and works out the range itself, then passes the full id list to `setCheckedLineIds`.

- **Why:** the anchor only matters for the next click, and nothing else reads it. Keeping it in the store would add state that isn't part of the editor's data.
- **Trade-off:** the anchor is lost if the panel remounts, so the next shift-click acts like a plain click.

---

_Task: highlighting the line that's playing, in the box under the audio player where the waveform placeholder was (developer's request)._

## `NowPlaying` is a separate component with its own state

I made the readout its own component instead of adding it to `AudioScreen`. It follows the audio itself and keeps the playing line in its own state, not in the store. It only re-renders when the playing line changes.

- **Why:** the playback position changes all the time while the song plays. Kept local, only that small box re-renders, not the track list, the panels or anything else reading the store.
- **Considered:** the playback time in the Zustand store, so other features could share it, at the cost of re-rendering the app throughout playback.
- **Trade-off:** another component that needs the playback position, like a future waveform playhead, has to read it from the audio element too.

---

_Task: review fixes on the timing branch (shared timing helpers, fewer re-renders, dropping lodash)._

## TrackList's selector returns the unsaved track ids as one string

The selector joins the unsaved track ids into a string, so `useShallow` only re-renders the list when that set changes, not on every stamp. I chose this over caching `getSavedStartTimes` per track, because the cached object would be shared and would have to stay unmutated everywhere.

- **Replaced (2026-10-21):** `TrackList` is gone. The track list now lives in `TrackSwitcher`'s menu, which only renders while it's open, so it reads the drafts directly. The top bar only checks the open track for unsaved changes.

## `canShift` takes the lines that are broken now as a parameter

App passes its memoized `issueByLineId` and the store builds the set once per nudge, so the eight nudge buttons no longer rebuild and re-check all the segments on every render.

---

_Task: review fixes on the user-experience branch (line text edits, store actions, splitting the lyrics panel)._

## Line text edits are a per-track draft, like the stamps

Edited lines live in `linesByTrack`, next to `startTimesByTrack`; `track` and `tracks` always hold the last save. "Save changes" sends the draft lines, and the edit form opens with them.

- **Why:** text edits used to overwrite `track` and keep the saved copy aside, the opposite of how stamps work. One pattern for both means "unsaved" is always draft vs `track`, and a future editable field doesn't need its own `saved…ByTrack`.
- **Trade-off:** "Reset timings" saves at once, so it also saves pending text edits. Its confirm message now says so.

## One store action per job: `clearTimings(ids)` and `resetLines(ids)`

`clearLineTiming` / `clearLinesTiming` and `revertLine` / `resetLines` were merged. Single-line callers pass `[id]`.

- **Why:** each pair did the same thing for one line or many. Merging also made the details panel's Undo revert text edits, not only timing.

## One unsaved check per line: start time or text

`isLineUnsaved(line, …)` in `timings.ts` compares both, by line id. `useTimingState` exposes it as `isUnsaved(line)`, and `hasUnsavedChanges` checks every line with it.

- **Why:** the check lived in three places, and the track-level one compared text by position instead of by id.

## Line actions in the row's ⋮ menu; each row keeps its own edit state

`LyricsPanel` is split into `components/lyrics/` (`LyricsPanel`, `LyricsBulkBar`, `LyricLineRow`, `LineTextInput`). Edit text, Clear timing and Undo changes moved into the existing `ActionMenu`; only Play stays visible, so the panel is back to 380px.

- **Why:** the row had grown to five buttons and the panel to ~300 lines. Keeping `isEditing` in each row means typed text isn't lost when another row is edited.
- **Trade-off:** clearing a line's timing takes two clicks instead of one. The menu can be clipped at the bottom of the scrolling panel (noted under `ActionMenu`).

## `NowPlaying` starts and stops its loop from `useIsPlaying`

- **Why:** it listened to play/pause/ended itself as well as through the hook. Now only its `seeked` listener is its own.

---

_Task: UI/UX review and improvements (custom audio controls, new layout and restyle)._

## Space and P only work outside controls

The global key handler now ignores keys while focus is in a button, link, form field or dialog, or while Ctrl, Cmd or Alt is held. Outside controls, Space stamps and P plays or pauses.

- **Why:** the handler runs in the capture phase and calls `preventDefault`, so Space couldn't press a focused button. P keeps play/pause on the keyboard now that the native player is hidden.
- **Trade-off:** after tabbing to a button, Space presses it instead of stamping. The play, stamp and lyric buttons blur after a mouse click, so Space keeps stamping after using them.

## Playback position stays in `AudioTransport`, not the store

A custom player (play/pause, restart, speed, mute, seek slider) replaces the native `<audio controls>`, which is now hidden. It keeps the position, duration, speed and mute state in its own state, from the audio element's events.

- **Why:** the same reason as `NowPlaying`: the position changes all the time, so only the player re-renders during playback.
- **Trade-off:** `NowPlaying`, `Waveform` and `AudioTransport` each listen to the audio element on their own. The slider sets its value straight away when dragged, before `seeked` fires, so it doesn't jump back.

## The lyric list scrolls itself, not the page

When the selected line changes, `LyricsPanel` measures the selected row and changes only the list's `scrollTop`, so the row stays in view with an 8px gap.

- **Why:** stamping moves the selection down the list, so the next line would soon be out of view.
- **Considered:** `row.scrollIntoView()`, which also scrolls the page when the panels are stacked on a phone, away from the stamp button.
- **Trade-off:** the row is found by its `data-selected` attribute instead of a ref per row, so it depends on `LyricLineRow` keeping that attribute.

---

_Task: recovering from a 409 save conflict._

## A 409 opens a choice instead of asking for a reload

The service returns the server's version, lines and alignment from the 409. A dialog offers Keep editing, Use latest saved version (drops the draft) and Replace with my version (saves the draft over the server's version).

- **Why:** the 409 already carries the latest state, and a reload loses the draft. Retrying with the new version on its own could overwrite someone else's work without asking.
- **Trade-off:** there's no automatic merge, and the draft and the conflict are only in memory, so a reload still loses them.

## The 409 body is only checked for its shape

`readConflict` checks that the version is an integer and that the lines and segments are arrays, then returns only `version`, `lines` and `alignment`.

- **Why:** the 200 response from the same endpoint isn't checked either, and the server builds both from the same state. Returning only those three fields keeps the 409's `error` and `*_version` fields off the track.

## One save at a time, and a late answer stays with its track

Only one save runs at a time. When it finishes, only that track's last save is updated, so stamps and text edits made in the meantime stay as drafts. Conflicts and save errors are kept per track id (`conflictsByTrack`, `saveErrorsByTrack`).

- **Why:** the user can keep editing or switch tracks while a save runs. A late answer mustn't overwrite newer edits or open the dialog over another track.
- **Trade-off:** Reset timings and the track ⋮ actions are disabled while saving, so they can't race the request.

## The conflict dialog flag is a boolean

`conflictDialogTrackId` became `isConflictDialogOpen`, and the dialog reads the open track's conflict.

- **Why:** the id was always `null` or the open track's id, so it added nothing and needed the same ternary in three places.

**Changed by developer:** back to `conflictDialogTrackId`. The dialog and the top bar only treat it as open when the id matches the open track, which the developer finds safer if there are several conflicts.

---

_Task: undo/redo. The developer asked for a class-based command history with Undo/Redo and keyboard shortcuts, kept out of Zustand, limited to 150–200 steps, that also works for bulk changes._

## Commands keep their before and after values; bulk edits are one composite

Each command takes the draft and returns a new one, and keeps only the values it changes. Bulk actions (nudge, clear, restore, reset) are one `CompositeCommand`, which runs its children in order and undoes them in reverse.

- **Why:** redo puts back exactly the same values, including a stamp's playback time. A bulk nudge is one undo step and one store update, so in-between states with invalid timings are never shown.
- **Trade-off:** stamping and Reset timings also undo the selection change they make, but selecting a line by hand isn't recorded. A text edit is recorded when it's applied, not per keystroke. An action that changes nothing isn't recorded and keeps Redo available.

## One history per track, up to 200 steps

Each track gets its own `CommandManager`, kept in a `Map` inside the store creator. Zustand only holds `historyByTrack`, the next Undo and Redo labels that the buttons and tooltips show.

- **Why:** undo shouldn't change a track you aren't looking at, and switching back should keep that track's history.
- **Trade-off:** histories are only in memory, so a reload clears them.

## Saving keeps history; a new lyric sheet clears it

Saving and switching tracks keep the history, and undo after a save makes that change unsaved again. Using the latest saved version in a conflict, editing the track through its form, or deleting it clears that track's history. Reset timings is undoable but still saves straight away; undo and redo never save.

- **Why:** the history is about local edits, not the server's version. A new lyric sheet can remove or reuse line ids, so old commands could change the wrong lines.

## Shortcuts skip text fields and dialogs

Ctrl/⌘ Z undoes, Ctrl/⌘ Shift Z and Ctrl Y redo. The handler ignores keys while focus is in an input, textarea, select or dialog.

- **Why:** while typing, Ctrl Z should undo the text in the input, not the last stamp.
- **Trade-off:** checkboxes are inputs too, so after ticking a line Ctrl Z does nothing until focus moves. The Undo button still works.

## The store is built by `createEditorStore(service)`

`createEditorStore.ts` holds the store and takes the persistence service as an argument; `store.ts` passes the real one.

- **Why:** tests can create separate stores with a fake service, without IndexedDB.
- **Trade-off:** no store or command tests exist yet; only the Playwright specs in `e2e/` do.

---

_Task: improving the "How it works" guide (developer's request)._

## Three steps up front, the details in expandable sections

The guide starts with three steps (choose a track, stamp, fine-tune and save) and the shortcuts beside them. The details on editing, saving, conflicts and tracks moved into native `<details>` sections, while the title, ✕, a save-before-reload reminder and "Back to editor" stay outside the scrolling part.

- **Why:** a new user sees the whole workflow at once, and a returning user opens only the part they need. `<details>` works with the keyboard on its own, with no open/closed state to manage.
- **Considered:** custom tabs or an accordion, which need their own state and keyboard handling.
- **Trade-off:** the rules (red lines, Reset timings saving at once) are only seen after opening a section. On phones the guide is one column, and in short landscape windows the subtitle and the save reminder are hidden to leave room for the help.
