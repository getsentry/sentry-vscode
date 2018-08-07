import * as request from 'request-light';
import {
  ConfigurationChangeEvent,
  Disposable,
  ExtensionContext,
  workspace,
} from 'vscode';

import { SentryContext, setContext } from './commands';

const NAMESPACE = 'sentry';

export enum SentryConfig {
  Enabled = 'enabled',
  ServerUrl = 'serverUrl',
}

function configName(config: SentryConfig): string {
  return `${NAMESPACE}.${config}`;
}

export class Configuration {
  private subscription?: Disposable;

  private serverUrl?: string;

  public configure(context: ExtensionContext): void {
    this.subscription = workspace.onDidChangeConfiguration(this.update, this);
    context.subscriptions.push(this);

    // Force initialization of all config variables
    this.update({ affectsConfiguration: () => true });
  }

  public getServerUrl(): string {
    return this.serverUrl || 'https://sentry.io';
  }

  public dispose(): void {
    if (this.subscription) {
      this.subscription.dispose();
    }
  }

  private get<T>(config: SentryConfig): T | undefined;

  private get<T>(config: SentryConfig, defaultValue: T): T;

  private get<T>(config: SentryConfig, defaultValue?: T): T | undefined {
    return workspace
      .getConfiguration(NAMESPACE)
      .get<T | undefined>(config, defaultValue);
  }

  private update(event: ConfigurationChangeEvent): void {
    if (!event.affectsConfiguration(NAMESPACE)) {
      return;
    }

    if (event.affectsConfiguration(configName(SentryConfig.Enabled))) {
      const enabled = this.get<boolean>(SentryConfig.Enabled, true);
      setContext(SentryContext.Enabled, enabled);
    }

    if (event.affectsConfiguration(configName(SentryConfig.ServerUrl))) {
      this.serverUrl = this.get<string>(SentryConfig.ServerUrl);
    }

    if (event.affectsConfiguration('http')) {
      const http = workspace.getConfiguration('http');
      const proxyUrl = http.get<string>('proxy', '');
      const strictSSL = http.get<boolean>('strictSSL', false);
      request.configure(proxyUrl, strictSSL);
    }
  }
}

export const configuration = new Configuration();
