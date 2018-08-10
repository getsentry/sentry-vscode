import { commands, ExtensionContext, Uri } from 'vscode';
import { openInBrowser } from './commands/openInBrowser';
import { showIssueActions } from './commands/showIssueActions';
import { showIssueResults } from './commands/showIssueResults';
import { showIssueSearch } from './commands/showIssueSearch';
import { showProjectPick } from './commands/showProjectPick';
import { startDebugger } from './commands/startDebugger';

enum VSCodeCommands {
  Open = 'vscode.open',
  SetContext = 'setContext',
}

export enum SentryContext {
  Enabled = 'sentry:enabled',
}

export function setContext(key: SentryContext | string, value: any): Thenable<{} | undefined> {
  return commands.executeCommand(VSCodeCommands.SetContext, key, value);
}

export function openUrl(url: Uri | string): Thenable<{} | undefined> {
  const uri = typeof url === 'string' ? Uri.parse(url) : url;
  return commands.executeCommand(VSCodeCommands.Open, uri);
}

export function configureCommands(context: ExtensionContext): void {
  context.subscriptions.push(showProjectPick.register());
  context.subscriptions.push(showIssueSearch.register());
  context.subscriptions.push(showIssueResults.register());
  context.subscriptions.push(showIssueActions.register());
  context.subscriptions.push(startDebugger.register());
  context.subscriptions.push(openInBrowser.register());
}
