import Dexie, { type Table } from "dexie";
import type { EditorTrack, SaveAlignmentResponse } from "../types";

// `alignments` and `audio` are keyed by track id, like the old `alignment:<id>` keys  used to keep in local storage.
export const db = new Dexie("lyrics-editor") as Dexie & {
  tracks: Table<EditorTrack, number>;
  alignments: Table<SaveAlignmentResponse, string>;
  audio: Table<File, string>;
};

db.version(1).stores({
  // Auto-increment key keeps tracks in the order they were added; `id` is indexed for lookups.
  tracks: "++, id",
  alignments: "",
  audio: "",
});
