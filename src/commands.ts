import { commands, ExtensionContext, window } from 'vscode';

enum VSCodeCommands {
  SetContext = 'setContext',
}

export enum SentryCommand {
  ShowIssueSearch = 'sentry.showIssueSearch',
  StartDebugger = 'sentry.startDebugger',
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

function showIssueSearch(): void {
  window.showInformationMessage('This would show the issue search box');
}

function registerCommand(
  context: ExtensionContext,
  command: SentryCommand | string,
  callback: (...args: any[]) => any,
): void {
  const disposable = commands.registerCommand(command, callback);
  context.subscriptions.push(disposable);
}

export function configureCommands(context: ExtensionContext): void {
  registerCommand(context, SentryCommand.ShowIssueSearch, showIssueSearch);
}
