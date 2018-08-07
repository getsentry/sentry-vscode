import { window } from 'vscode';

import { searchIssues } from '../sentry';
import { SentryCommand } from './base';
import { showIssueResults } from './showIssueResults';

export const COMMAND_SHOW_ISSUE_SEARCH = 'sentry.showIssueSearch';
const DEFAULT_QUERY = 'is:unresolved ';

export interface ShowIssueSearchArgs {
  search?: string;
}

function getValueSelection(query: string): [number, number] {
  if (query.startsWith(DEFAULT_QUERY)) {
    return [DEFAULT_QUERY.length, query.length];
  } else {
    return [0, query.length];
  }
}

export class ShowIssueSearchCommand extends SentryCommand<ShowIssueSearchArgs> {
  public constructor() {
    super(COMMAND_SHOW_ISSUE_SEARCH);
  }

  protected async run(args: ShowIssueSearchArgs = {}): Promise<void> {
    // TODO: Perform auto-complete with a dynamic QuickPick instead.
    const initialQuery = args.search || DEFAULT_QUERY;
    const selection = getValueSelection(initialQuery);

    const query = await window.showInputBox({
      placeHolder:
        'search by issue id, message, tags, status, or tag or paste an issue link',
      prompt: 'Please search for an issue',
      value: initialQuery,
      valueSelection: selection,
    });

    if (!query) {
      // Cancel silently also for empty strings. This is just like pressing ESC,
      // for now.
      return;
    }

    try {
      // TODO: Show loading indicator and allow cancellation
      const issues = await searchIssues(query);
      if (issues.length === 0) {
        window.showInformationMessage('Sorry, no issues match your query.');
        return;
      }

      showIssueResults.execute({ issues });
    } catch (e) {
      window.showErrorMessage(`Could not search issues: ${e}`);
    }
  }
}

export const showIssueSearch = new ShowIssueSearchCommand();
