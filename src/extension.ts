import { debug, ExtensionContext, workspace } from 'vscode';
import { configureCommands, SentryContext, setContext } from './commands';
import { SentryConfigurationProvider } from './debugger';

export function activate(context: ExtensionContext): void {
  const enabled = workspace
    .getConfiguration('sentry', null)
    .get<boolean>('enabled', true);

  if (!enabled) {
    return;
  }

  setContext(SentryContext.Enabled, enabled);
  configureCommands(context);

  // register a configuration provider for 'mock' debug type
  const provider = new SentryConfigurationProvider();
  context.subscriptions.push(
    debug.registerDebugConfigurationProvider('sentry', provider),
  );
  context.subscriptions.push(provider);
}

export function deactivate(): void {
  // noop
}
