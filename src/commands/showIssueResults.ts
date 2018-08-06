import { window } from 'vscode';

import { CommandQuickPickItem } from '../pick';
import { Issue } from '../sentry';
import { SentryCommand } from './base';
import { showIssueActions } from './showIssueActions';

export const COMMAND = 'sentry.showIssueResults';

export interface ShowIssueResultsArgs {
  issues: Issue[];
}

function makeIssueItem(issue: Issue): CommandQuickPickItem {
  const item = {
    description: issue.culprit,
    detail: issue.metadata.value,
    label: `${issue.shortId}: ${issue.metadata.type}`,
  };
  return CommandQuickPickItem.from(item, showIssueActions, { issue });
}

export class ShowIssueResultsCommand extends SentryCommand<
  ShowIssueResultsArgs
> {
  public constructor() {
    super(COMMAND);
  }

  protected async run(args: ShowIssueResultsArgs): Promise<void> {
    const items = args.issues.map(makeIssueItem);
    const pick = await window.showQuickPick(items, {
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Please select an issue from the list',
    });

    if (!pick) {
      return;
    }

    pick.execute();
  }
}

export const showIssueResults = new ShowIssueResultsCommand();
