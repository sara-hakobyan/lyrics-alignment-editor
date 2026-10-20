# Decisions

This file logs the technical and architectural decisions that the AI agent (Claude) made on its own while working on this project. Each entry was written while the work was being done, not afterwards.

Decisions and requirements that came from the developer are not recorded here; those go in the developer's own notes.

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
