import { ExtensionContext, window, workspace } from 'vscode';
import { configureCommands, SentryContext, setContext } from './commands';

export function activate(context: ExtensionContext): void {
  const enabled = workspace
    .getConfiguration('sentry', null)
    .get<boolean>('enabled', true);

  if (!enabled) {
    return;
  }

  setContext(SentryContext.Enabled, enabled);
  configureCommands(context);
}

export function deactivate(): void {
  // noop
}
