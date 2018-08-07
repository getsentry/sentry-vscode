import { window } from 'vscode';

import { CommandQuickPickItem } from '../pick';
import { Issue } from '../sentry';
import { SentryCommand } from './base';
import { startDebugger } from './startDebugger';

export const COMMAND_SHOW_ISSUE_ACTIONS = 'sentry.showIssueActions';

export interface ShowIssueActionsArgs {
  issue: Issue;
}

export class ShowIssueActionsCommand extends SentryCommand<
  ShowIssueActionsArgs
> {
  public constructor() {
    super(COMMAND_SHOW_ISSUE_ACTIONS);
  }

  protected async run(args: ShowIssueActionsArgs): Promise<void> {
    const cmds = [
      CommandQuickPickItem.from(
        { label: 'Launch debugger on Issue' },
        startDebugger,
        { issue: args.issue },
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
