import {
  CancellationToken,
  debug,
  DebugConfiguration,
  DebugConfigurationProvider,
  ExtensionContext,
  ProviderResult,
  WorkspaceFolder,
} from 'vscode';

import { Event } from '../sentry';

export function startDebugging(event: Event): Thenable<boolean> {
  return debug.startDebugging(undefined, {
    event,
    name: 'View',
    request: 'launch',
    type: 'sentry',
  });
}

export class SentryConfigurationProvider implements DebugConfigurationProvider {
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  public resolveDebugConfiguration(
    _folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    _token?: CancellationToken,
  ): ProviderResult<DebugConfiguration> {
    return config;
  }

  public dispose(): void {
    return;
  }
}

export function configureDebugger(context: ExtensionContext): void {
  const provider = new SentryConfigurationProvider();
  context.subscriptions.push(
    debug.registerDebugConfigurationProvider('sentry', provider),
  );
  context.subscriptions.push(provider);
}
