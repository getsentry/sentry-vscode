import promisify = require('util.promisify');

import { ExtensionContext, workspace } from 'vscode';
import { configureCommands, SentryContext, setContext } from './commands';
import { configureDebugger } from './debugger';
import { configureSentry } from './sentry';

export function activate(context: ExtensionContext): void {
  const enabled = workspace
    .getConfiguration('sentry', null)
    .get<boolean>('enabled', true);

  if (!enabled) {
    return;
  }

  setContext(SentryContext.Enabled, enabled);
  configureCommands(context);
  configureDebugger(context);
  configureSentry();
}

export function deactivate(): void {
  // noop
}
