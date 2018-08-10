import { commands, Uri } from 'vscode';

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
