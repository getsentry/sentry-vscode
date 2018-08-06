import { window } from 'vscode';

import { searchIssues } from '../sentry';
import { SentryCommand } from './base';
import { showIssueResults } from './showIssueResults';

export const COMMAND = 'sentry.showIssueSearch';

export interface ShowIssueSearchArgs {
  search?: string;
}

export class ShowIssueSearchCommand extends SentryCommand<ShowIssueSearchArgs> {
  public constructor() {
    super(COMMAND);
  }

  protected async run(args: ShowIssueSearchArgs = {}): Promise<void> {
    const query = await window.showInputBox({
      placeHolder:
        'search by issue id, message, tags, status, or tag or paste an issue link',
      prompt: 'Please search for an issue',
      value: args.search,
    });

    if (!query) {
      // Cancel silently also for empty strings. This is just like pressing ESC,
      // for now.
      return;
    }

    try {
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
