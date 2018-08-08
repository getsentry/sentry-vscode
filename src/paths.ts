import { ConfigurationChangeEvent, workspace } from 'vscode';

enum PathConfig {
  Python = 'python.pythonPath',
}

export function affectsSearchPaths(event: ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration(PathConfig.Python);
}

function getPythonPaths(): string[] {
  // TODO: Implement
  return [];
}

export function discoverSearchPaths(): string[] {
  let paths = workspace.workspaceFolders
    ? workspace.workspaceFolders.map(folder => folder.uri.fsPath)
    : ['.'];

  paths = paths.concat(getPythonPaths());

  return paths;
}
