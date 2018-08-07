import { CancellationTokenSource, window } from 'vscode';

import { CommandQuickPickItem } from '../pick';
import { Issue, searchIssues } from '../sentry';
import { SentryCommand } from './base';
import { showIssueActions } from './showIssueActions';

export const COMMAND_SHOW_ISSUE_RESULTS = 'sentry.showIssueResults';

export interface ShowIssueResultsArgs {
  search?: string;
  issues?: Issue[];
}

function makeIssueItem(issue: Issue): CommandQuickPickItem {
  const item = {
    description: issue.culprit,
    detail: issue.metadata.value,
    label: `${issue.shortId}: ${issue.metadata.type}`,
  };
  return CommandQuickPickItem.from(item, showIssueActions, { issue });
}

async function loadIssueResults(
  cancellation: CancellationTokenSource,
  search: string,
): Promise<CommandQuickPickItem[]> {
  try {
    const issues = await searchIssues(search);

    if (issues.length === 0) {
      cancellation.cancel();
      window.showInformationMessage('Sorry, no issues match your search.');
    }

    return issues.map(makeIssueItem);
  } catch (e) {
    cancellation.cancel();
    window.showErrorMessage(`Could not search issues: ${e}`);
    return [];
  } finally {
    cancellation.dispose();
  }
}

export class ShowIssueResultsCommand extends SentryCommand<
  ShowIssueResultsArgs
> {
  public constructor() {
    super(COMMAND_SHOW_ISSUE_RESULTS);
  }

  protected async run(args: ShowIssueResultsArgs): Promise<void> {
    let items;
    let cancellation;

    if (args.issues) {
      items = args.issues.map(makeIssueItem);
    } else if (args.search) {
      cancellation = new CancellationTokenSource();
      items = loadIssueResults(cancellation, args.search);
    } else {
      throw new Error('Missing issue search query');
    }

    const pick = await window.showQuickPick(
      items,
      {
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Please select an issue from the list',
      },
      cancellation && cancellation.token,
    );

    if (!pick) {
      return;
    }

    pick.execute();
  }
}

export const showIssueResults = new ShowIssueResultsCommand();
