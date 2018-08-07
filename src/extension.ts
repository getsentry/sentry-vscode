import { ExtensionContext } from 'vscode';

import { configureCommands } from './commands';
import { configuration } from './config';
import { configureDebugger } from './debugger';
import { configureSentry } from './sentry';

export function activate(context: ExtensionContext): void {
  configuration.configure(context);
  configureCommands(context);
  configureDebugger(context);
  configureSentry();
}

export function deactivate(): void {
  // noop
}
