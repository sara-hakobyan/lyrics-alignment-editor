import type { Command } from "./Command";

/** Children form one history entry; no intermediate state is published. */
export class CompositeCommand<State> implements Command<State> {
  constructor(
    readonly label: string,
    private readonly commands: readonly Command<State>[]
  ) {}

  run(state: State): State {
    return this.commands.reduce(
      (current, command) => command.run(current),
      state
    );
  }

  undo(state: State): State {
    return this.commands.reduceRight(
      (current, command) => command.undo(current),
      state
    );
  }
}
