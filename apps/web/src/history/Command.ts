/**
 * A deterministic edit with no side effects. Neither method mutates its input;
 * return the same reference for a no-op. Redo calls run() on the same command.
 */
export interface Command<State> {
  readonly label: string;
  run(state: State): State;
  undo(state: State): State;
}
