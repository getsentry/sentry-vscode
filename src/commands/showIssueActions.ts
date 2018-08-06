import { window } from 'vscode';

import { Issue } from '../issues';
import { CommandQuickPickItem } from '../pick';
import { SentryCommand } from './base';
import { startDebugger } from './startDebugger';

export const COMMAND = 'sentry.showIssueActions';

export interface ShowIssueActionsArgs {
  issue: Issue;
}

export class ShowIssueActionsCommand extends SentryCommand<
  ShowIssueActionsArgs
> {
  public constructor() {
    super(COMMAND);
  }

  protected async run(_args: ShowIssueActionsArgs): Promise<void> {
    const cmds = [
      CommandQuickPickItem.from(
        { label: 'Launch debugger on Issue' },
        startDebugger,
        undefined, // TODO: pass the issue
      ),
    ];

    const pick = await window.showQuickPick(cmds);
    if (!pick) {
      return;
    }

    pick.execute();
  }
}

export const showIssueActions = new ShowIssueActionsCommand();
