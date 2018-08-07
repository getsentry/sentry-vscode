import * as request from 'request-light';
import {
  ConfigurationChangeEvent,
  Disposable,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  ThemeColor,
  window,
  workspace,
} from 'vscode';

import { SentryContext, setContext } from './commands';
import { COMMAND as SHOW_PROJECT_PICK_COMMAND } from './commands/showProjectPick';

const NAMESPACE = 'sentry';

export enum SentryConfig {
  Enabled = 'enabled',
  ServerUrl = 'serverUrl',
  Projects = 'projects',
}

function configName(config: SentryConfig): string {
  return `${NAMESPACE}.${config}`;
}

export class Configuration {
  private subscription?: Disposable;
  private status?: StatusBarItem;

  private serverUrl?: string;
  private projects?: string[];

  public configure(context: ExtensionContext): void {
    this.subscription = workspace.onDidChangeConfiguration(this.update, this);
    context.subscriptions.push(this);

    // Force initialization of all config variables
    this.update({ affectsConfiguration: () => true });
  }

  public getServerUrl(): string {
    return this.serverUrl || 'https://sentry.io';
  }

  public getProjects(): string[] {
    return this.projects || [];
  }

  public setProjects(projects: string[]): void {
    this.set(SentryConfig.Projects, projects);
  }

  public dispose(): void {
    if (this.subscription) {
      this.subscription.dispose();
    }

    if (this.status) {
      this.status.dispose();
    }
  }

  private get<T>(config: SentryConfig): T | undefined;

  private get<T>(config: SentryConfig, defaultValue: T): T;

  private get<T>(config: SentryConfig, defaultValue?: T): T | undefined {
    return workspace
      .getConfiguration(NAMESPACE)
      .get<T | undefined>(config, defaultValue);
  }

  private set(config: SentryConfig, value: any): void {
    workspace.getConfiguration(NAMESPACE).update(config, value, false);
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

    if (event.affectsConfiguration(configName(SentryConfig.Projects))) {
      this.projects = this.get<string[]>(SentryConfig.Projects, []);

      if (!this.status) {
        this.status = window.createStatusBarItem(StatusBarAlignment.Left);
        this.status.command = SHOW_PROJECT_PICK_COMMAND;
      }

      if (this.projects.length === 0) {
        this.status.color = new ThemeColor('editorWarning.foreground');
        this.status.text = '$(alert) Select Sentry Project';
      } else {
        this.status.color = new ThemeColor('statusBar.foreground');
        this.status.text =
          this.projects.length === 1
            ? `Sentry: ${this.projects[0]}`
            : (this.status.text = `Sentry: ${this.projects.length} projects`);
      }

      this.status.show();
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
