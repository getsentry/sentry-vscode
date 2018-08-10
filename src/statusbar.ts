import { ExtensionContext, StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode';
import { COMMAND_SHOW_PROJECT_PICK } from './commands/showProjectPick';

class StatusbarItems {
  public projectSelector!: StatusBarItem;

  public configure(context: ExtensionContext): void {
    context.subscriptions.push(this);
    this.projectSelector = window.createStatusBarItem(StatusBarAlignment.Left);
    this.projectSelector.command = COMMAND_SHOW_PROJECT_PICK;
  }

  public dispose(): void {
    this.projectSelector.dispose();
  }

  public updateFromProjects(projects: string[]): void {
    if (projects.length === 0) {
      this.projectSelector.color = 'yellow';
      this.projectSelector.text = '$(alert) Select Sentry Project';
      this.projectSelector.tooltip = undefined;
    } else {
      this.projectSelector.color = new ThemeColor('statusBar.foreground');
      this.projectSelector.text =
        projects.length === 1
          ? `Sentry: ${projects[0]}`
          : (this.projectSelector.text = `Sentry: ${projects.length} projects selected`);
      this.projectSelector.tooltip = projects.join('\n');
    }

    this.projectSelector.show();
  }
}

export const statusbar = new StatusbarItems();
