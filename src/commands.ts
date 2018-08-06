import { commands, ExtensionContext } from 'vscode';

import { showIssueActions } from './commands/showIssueActions';
import { showIssueResults } from './commands/showIssueResults';
import { showIssueSearch } from './commands/showIssueSearch';
import { startDebugger } from './commands/startDebugger';

enum VSCodeCommands {
  SetContext = 'setContext',
}

export enum SentryContext {
  Enabled = 'sentry:enabled',
}

export function setContext(
  key: SentryContext | string,
  value: any,
): Thenable<{} | undefined> {
  return commands.executeCommand(VSCodeCommands.SetContext, key, value);
}

export function configureCommands(context: ExtensionContext): void {
  context.subscriptions.push(showIssueSearch.register());
  context.subscriptions.push(showIssueResults.register());
  context.subscriptions.push(showIssueActions.register());
  context.subscriptions.push(startDebugger.register());
}
