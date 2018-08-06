import { window } from 'vscode';

import { startDebugging } from '../debugger';
import { Issue, loadLatestEvent } from '../sentry';
import { SentryCommand } from './base';

export const COMMAND = 'sentry.startDebugger';

export interface StartDebuggerArgs {
  issue: Issue;
}

export class StartDebuggerCommand extends SentryCommand<StartDebuggerArgs> {
  public constructor() {
    super(COMMAND);
  }

  protected async run(args: StartDebuggerArgs): Promise<void> {
    try {
      const event = await loadLatestEvent(args.issue);
      await startDebugging(event);
    } catch (e) {
      window.showErrorMessage(`Could not start debugger: ${e}`);
    }
  }
}

export const startDebugger = new StartDebuggerCommand();
