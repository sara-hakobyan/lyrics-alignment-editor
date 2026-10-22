import type { Command } from "./Command";

export type HistoryStatus = {
  undoLabel: string | null;
  redoLabel: string | null;
};

/** Owns history, not application state. Stack changes happen only after success. */
export class CommandManager<State> {
  private readonly past: Command<State>[] = [];
  private readonly future: Command<State>[] = [];

  constructor(private readonly limit = 200) {}

  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }

  get status(): HistoryStatus {
    return {
      undoLabel: this.past.at(-1)?.label ?? null,
      redoLabel: this.future.at(-1)?.label ?? null,
    };
  }

  run(command: Command<State>, state: State): State {
    const next = command.run(state);
    // Commands return the same reference when they make no change.
    if (next === state) return state;
    this.past.push(command);
    if (this.past.length > this.limit) this.past.shift();
    this.future.length = 0;
    return next;
  }

  undo(state: State): State {
    const command = this.past.at(-1);
    if (!command) return state;
    const next = command.undo(state);
    this.past.pop();
    this.future.push(command);
    return next;
  }

  redo(state: State): State {
    const command = this.future.at(-1);
    if (!command) return state;
    const next = command.run(state);
    this.future.pop();
    this.past.push(command);
    return next;
  }

  clear() {
    this.past.length = 0;
    this.future.length = 0;
  }
}
