import { QuickPickItem } from 'vscode';
import { SentryCommand } from './commands/base';

export class CommandQuickPickItem implements QuickPickItem {
  public label!: string;
  public description?: string;
  public detail?: string;

  private command: SentryCommand<any>;
  private args: any[];

  public static from<C>(
    item: QuickPickItem,
    command: SentryCommand<C>,
    args: C,
  ): CommandQuickPickItem {
    return new CommandQuickPickItem(item, command, args);
  }

  private constructor(item: QuickPickItem, command: SentryCommand<any>, args: any) {
    this.command = command;
    this.args = args;

    Object.assign(this, item);
  }

  public execute(): Promise<void> {
    return this.command.execute(this.args);
  }
}
