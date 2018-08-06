import { commands, Disposable } from 'vscode';

export abstract class SentryCommand<A> {
  private command: string;
  private disposable?: Disposable;

  public constructor(command: string) {
    this.command = command;
  }

  protected abstract async run(args: A): Promise<void>;

  public async execute(args: A): Promise<void> {
    commands.executeCommand(this.command, args);
  }

  public register(): this {
    this.disposable = commands.registerCommand(this.command, (args: A) =>
      this.run(args),
    );

    return this;
  }

  public dispose(): void {
    if (this.disposable) {
      this.disposable.dispose();
    }
  }
}
