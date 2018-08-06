import { commands, ExtensionContext, window } from 'vscode';

import { startDebugging } from './debugger';
import { showSearchInput } from './issues';

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

function showIssueSearch(...args: any[]): void {
  showSearchInput();
}

function startDebugger(): void {
  startDebugging({ event_id: '' });
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
  registerCommand(context, SentryCommand.StartDebugger, startDebugger);
}
