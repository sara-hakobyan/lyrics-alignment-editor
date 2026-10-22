import type { Command } from "../history/Command";
import { CompositeCommand } from "../history/CompositeCommand";
import type { Line } from "../types";

export type AlignmentDraft = {
  lines: Line[];
  startTimesMs: Record<string, number>;
  selectedLineId: string | null;
};

export class SetLineTimingCommand implements Command<AlignmentDraft> {
  readonly label = "Set line timing";

  constructor(
    private readonly lineId: string,
    private readonly before: number | undefined,
    private readonly after: number | undefined
  ) {}

  private apply(
    state: AlignmentDraft,
    value: number | undefined
  ): AlignmentDraft {
    if (state.startTimesMs[this.lineId] === value) return state;
    const startTimesMs = { ...state.startTimesMs };
    if (value === undefined) delete startTimesMs[this.lineId];
    else startTimesMs[this.lineId] = value;
    return { ...state, startTimesMs };
  }

  run(state: AlignmentDraft) {
    return this.apply(state, this.after);
  }
  undo(state: AlignmentDraft) {
    return this.apply(state, this.before);
  }
}

export class EditLineTextCommand implements Command<AlignmentDraft> {
  readonly label = "Edit lyric text";

  constructor(
    private readonly lineId: string,
    private readonly before: string,
    private readonly after: string
  ) {}

  private apply(state: AlignmentDraft, text: string): AlignmentDraft {
    const line = state.lines.find((item) => item.id === this.lineId);
    if (!line) throw new Error("Cannot edit a line outside this lyric sheet.");
    if (line.text === text) return state;
    return {
      ...state,
      lines: state.lines.map((item) =>
        item.id === this.lineId ? { ...item, text } : item
      ),
    };
  }

  run(state: AlignmentDraft) {
    return this.apply(state, this.after);
  }
  undo(state: AlignmentDraft) {
    return this.apply(state, this.before);
  }
}

class SelectLineCommand implements Command<AlignmentDraft> {
  readonly label = "Select lyric";
  constructor(
    private readonly before: string | null,
    private readonly after: string | null
  ) {}
  private apply(
    state: AlignmentDraft,
    selectedLineId: string | null
  ): AlignmentDraft {
    return state.selectedLineId === selectedLineId
      ? state
      : { ...state, selectedLineId };
  }
  run(state: AlignmentDraft) {
    return this.apply(state, this.after);
  }
  undo(state: AlignmentDraft) {
    return this.apply(state, this.before);
  }
}

export class StampLineCommand extends CompositeCommand<AlignmentDraft> {
  constructor(draft: AlignmentDraft, lineId: string, timeMs: number) {
    const index = draft.lines.findIndex((line) => line.id === lineId);
    if (index === -1)
      throw new Error("Cannot stamp a line outside this lyric sheet.");
    super(`Stamp line ${index + 1}`, [
      new SetLineTimingCommand(lineId, draft.startTimesMs[lineId], timeMs),
      new SelectLineCommand(
        draft.selectedLineId,
        draft.lines[index + 1]?.id ?? null
      ),
    ]);
  }
}

export class NudgeLinesCommand extends CompositeCommand<AlignmentDraft> {
  constructor(draft: AlignmentDraft, lineIds: string[], deltaMs: number) {
    const ids = new Set(lineIds);
    const timed = draft.lines.filter(
      (line) => ids.has(line.id) && draft.startTimesMs[line.id] !== undefined
    );
    super(
      `Nudge ${timed.length === 1 ? "line" : `${timed.length} lines`}`,
      timed.map(
        (line) =>
          new SetLineTimingCommand(
            line.id,
            draft.startTimesMs[line.id],
            draft.startTimesMs[line.id] + deltaMs
          )
      )
    );
  }
}

export class ClearTimingsCommand extends CompositeCommand<AlignmentDraft> {
  constructor(draft: AlignmentDraft, lineIds: string[]) {
    const ids = new Set(lineIds);
    const timed = draft.lines.filter(
      (line) => ids.has(line.id) && draft.startTimesMs[line.id] !== undefined
    );
    super(
      `Clear ${timed.length === 1 ? "line timing" : `${timed.length} timings`}`,
      timed.map(
        (line) =>
          new SetLineTimingCommand(
            line.id,
            draft.startTimesMs[line.id],
            undefined
          )
      )
    );
  }
}

export class RestoreLinesCommand extends CompositeCommand<AlignmentDraft> {
  constructor(
    draft: AlignmentDraft,
    lineIds: string[],
    savedLines: Line[],
    savedTimes: Record<string, number>
  ) {
    const ids = new Set(lineIds);
    const savedText = new Map(savedLines.map((line) => [line.id, line.text]));
    super(
      "Restore last save",
      draft.lines
        .filter((line) => ids.has(line.id))
        .flatMap((line) => [
          new SetLineTimingCommand(
            line.id,
            draft.startTimesMs[line.id],
            savedTimes[line.id]
          ),
          new EditLineTextCommand(
            line.id,
            line.text,
            savedText.get(line.id) ?? line.text
          ),
        ])
    );
  }
}

export class ResetTimingsCommand extends CompositeCommand<AlignmentDraft> {
  constructor(draft: AlignmentDraft) {
    super("Reset all timings", [
      new ClearTimingsCommand(
        draft,
        draft.lines.map((line) => line.id)
      ),
      new SelectLineCommand(draft.selectedLineId, draft.lines[0]?.id ?? null),
    ]);
  }
}
