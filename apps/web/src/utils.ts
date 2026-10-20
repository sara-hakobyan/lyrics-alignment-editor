import type { Line } from "./types";

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2).padStart(5, "0");

  return `${minutes}:${remainingSeconds}`;
};

// Line timings are kept in ms; `undefined` means the line has no time yet.
export const formatMs = (ms: number | undefined): string =>
  ms === undefined ? "Not timed" : formatTime(ms / 1000);

// Joins class names, skipping the ones whose condition is false.
export const cx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// One lyric line per non-empty row; ids are random so repeated lyrics stay distinct.
export const parseLyrics = (text: string): Line[] =>
  text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row !== "")
    .map((row, index) => ({ id: crypto.randomUUID(), index, text: row }));
