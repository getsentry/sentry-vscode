import { window } from 'vscode';
import { openUrl } from '../commands';
import { Issue } from '../sentry';
import { SentryCommand } from './base';

export const COMMAND_OPEN_IN_BROWSER = 'sentry.OpenInBrowser';

export interface OpenInBrowserArgs {
  issue: Issue;
}

export class OpenInBrowserCommand extends SentryCommand<OpenInBrowserArgs> {
  public constructor() {
    super(COMMAND_OPEN_IN_BROWSER);
  }

  protected async run(args: OpenInBrowserArgs): Promise<void> {
    try {
      await openUrl(args.issue.permalink);
    } catch (e) {
      window.showErrorMessage(`Could not open Sentry issue: ${e}`);
    }
  }
}

export const openInBrowser = new OpenInBrowserCommand();
