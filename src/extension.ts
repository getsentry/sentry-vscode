import { ExtensionContext } from 'vscode';
import { configureCommands } from './commands';
import { configuration } from './config';
import { configureDebugger } from './debugger';
import { statusbar } from './statusbar';

export function activate(context: ExtensionContext): void {
  statusbar.configure(context);
  configureCommands(context);
  configureDebugger(context);
  configuration.configure(context);
}

export function deactivate(): void {
  // noop
}
