import { ExtensionContext } from 'vscode';
import { openInBrowser } from './openInBrowser';
import { showIssueActions } from './showIssueActions';
import { showIssueResults } from './showIssueResults';
import { showIssueSearch } from './showIssueSearch';
import { showProjectPick } from './showProjectPick';
import { startDebugger } from './startDebugger';

export function configureCommands(context: ExtensionContext): void {
  context.subscriptions.push(showProjectPick.register());
  context.subscriptions.push(showIssueSearch.register());
  context.subscriptions.push(showIssueResults.register());
  context.subscriptions.push(showIssueActions.register());
  context.subscriptions.push(startDebugger.register());
  context.subscriptions.push(openInBrowser.register());
}
