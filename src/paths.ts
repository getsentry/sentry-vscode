import { execFile } from 'child_process';
import * as fs from 'fs';
import * as promisify from 'util.promisify';
import { ConfigurationChangeEvent, workspace } from 'vscode';

const stat = promisify(fs.stat);

const PYTHON_CONFIG = 'python.pythonPath';

/**
 * Helper to filter an array with asynchronous callbacks.
 *
 * @param array An array containing items to filter.
 * @param predicate An async predicate evaluated on every item.
 * @param thisArg Optional value passed as "this" into the callback.
 * @returns An array containing only values where the callback returned true.
 */
export async function filterAsync<T>(
  array: T[],
  predicate: (item: T) => Promise<boolean> | boolean,
  thisArg?: any,
): Promise<T[]> {
  const verdicts = await Promise.all(array.map(predicate, thisArg));
  return array.filter((_, index) => verdicts[index]);
}

function exec(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (e) {
    return false;
  }
}

async function getPythonPaths(): Promise<string[]> {
  const pythonPath = workspace.getConfiguration('python').get<string>('pythonPath', 'python');

  try {
    const json = await exec(pythonPath, [
      '-c',
      'import sys; import json; json.dump(sys.path, sys.stdout)',
    ]);

    return filterAsync(JSON.parse(json), isDirectory);
  } catch (e) {
    return [];
  }
}

export function affectsSearchPaths(event: ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration(PYTHON_CONFIG);
}

export async function discoverSearchPaths(): Promise<string[]> {
  // TODO: Workspace folders also need to be refreshed.
  // TODO: Maybe refactor this into a separate PathManager class?
  let paths = workspace.workspaceFolders
    ? workspace.workspaceFolders.map(folder => folder.uri.fsPath)
    : ['.'];

  // TODO: These should better be cached individually as good as possible.
  paths = paths.concat(await getPythonPaths());

  return paths;
}
