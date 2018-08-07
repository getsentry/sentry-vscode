import { ExtensionContext } from 'vscode';

import { configureCommands } from './commands';
import { configuration } from './config';
import { configureDebugger } from './debugger';

export function activate(context: ExtensionContext): void {
  configuration.configure(context);
  configureCommands(context);
  configureDebugger(context);
}

export function deactivate(): void {
  // noop
}
