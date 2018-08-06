import { commands, QuickPickItem, window } from 'vscode';

import { SentryCommand } from './commands';

interface Issue {
  // TODO:
  id: string;
  title: string;
}

class IssueQuickPickItem implements QuickPickItem {
  public issue: Issue;

  public label!: string;
  public description!: string;
  public detail!: string;

  public constructor(issue: Issue) {
    this.issue = issue;

    this.label = issue.title;
    this.description = 'some description';
    this.detail = 'some detail';
  }
}

// tslint:disable-next-line
class CommandQuickPickItem implements QuickPickItem {
  public label!: string;
  private command: string;
  private args: any[];

  public constructor(label: string, command: SentryCommand, ...args: any[]) {
    this.label = label;
    this.command = command;
    this.args = args;
  }

  public run(): Thenable<{} | undefined> {
    return commands.executeCommand(this.command, ...this.args);
  }
}

async function searchIssues(input: string): Promise<Issue[]> {
  return [
    {
      id: 'a',
      title: 'First',
    },
    {
      id: 'b',
      title: 'Second',
    },
    {
      id: 'c',
      title: 'Third',
    },
  ];
}

export async function showSearchInput(): Promise<void> {
  const input = await window.showInputBox({
    placeHolder: 'search by issue id, message or tags',
    prompt: 'Please search for an issue',
  });

  if (!input) {
    // Cancel silently. This is just like pressing ESC, for now.
    return;
  }

  try {
    const results = await searchIssues(input);
    if (results.length === 0) {
      window.showInformationMessage('Sorry, no issues match your search.');
      return;
    }

    // TODO: command
    showIssuesQuickPick(results);
  } catch (e) {
    window.showErrorMessage(`Could not search issues: ${e}`);
  }
}

export async function showIssuesQuickPick(issues: Issue[]): Promise<void> {
  const items = issues.map(issue => new IssueQuickPickItem(issue));
  const pick = await window.showQuickPick(items, {
    matchOnDescription: true,
    matchOnDetail: true,
    placeHolder: 'Please select an issue from the list',
  });

  if (!pick) {
    // TODO: Go back?
    return;
  }

  // TODO: Command
  showIssueActions(pick.issue);
}

export async function showIssueActions(issue: Issue): Promise<void> {
  const cmds = [
    new CommandQuickPickItem(
      'Launch debugger on Issue',
      SentryCommand.StartDebugger,
      issue,
    ),
  ];

  const pick = await window.showQuickPick(cmds);
  if (!pick) {
    return;
  }

  pick.run();
}
