import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import promisify = require('util.promisify');

import {
  ConfigurationChangeEvent,
  Disposable,
  EventEmitter,
  ExtensionContext,
  workspace,
} from 'vscode';
import { SentryContext, setContext } from './commands';

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

let token: string | false | undefined;

async function loadToken(): Promise<string | false> {
  // TODO: Make this more robust
  // TODO: Add a way to ask for the token
  // TODO: Add a way to set/refresh the token

  const home = os.homedir();
  const rcpath = path.join(home, '.sentryclirc');

  if (!(await exists(rcpath))) {
    return false;
  }

  const rc = await readFile(rcpath, 'utf8');
  const match = rc.match(/^token\s*=\s*(\w+)$/m);
  if (!match) {
    return false;
  }

  return match[1].toLowerCase();
}

export async function getToken(): Promise<string | false> {
  if (token === undefined) {
    token = await loadToken();
  }

  return token;
}

const NAMESPACE = 'sentry';

export enum SentryConfig {
  Enabled = 'enabled',
  ServerUrl = 'serverUrl',
}

function configName(config: SentryConfig): string {
  return `${NAMESPACE}.${config}`;
}

export class Configuration {
  private emitter: EventEmitter<SentryConfig>;
  private subscription?: Disposable;

  private serverUrl?: string;

  public constructor() {
    this.emitter = new EventEmitter();
  }

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
    this.emitter.dispose();
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
  }
}

export const configuration = new Configuration();
