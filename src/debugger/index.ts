import * as fs from 'fs';
import * as Net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as promisify from 'util.promisify';
import {
  CancellationToken,
  debug,
  DebugConfiguration,
  DebugConfigurationProvider,
  ExtensionContext,
  ProviderResult,
  window,
  workspace,
  WorkspaceFolder,
} from 'vscode';
import { Event } from '../sentry';
import { SentryDebugSession } from './server';

const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

/*
 * Set the following compile time flag to true if the
 * debug adapter should run inside the extension host.
 * Please note: the test suite does no longer work in this mode.
 */
const EMBED_DEBUG_ADAPTER = true;

class SentryConfigurationProvider implements DebugConfigurationProvider {
  private _server?: Net.Server;

  public resolveDebugConfiguration(
    _folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    _token?: CancellationToken,
  ): ProviderResult<DebugConfiguration> {
    if (!config.event) {
      // abort launch
      return window.showInformationMessage('Missing event payload').then(() => undefined);
    }

    if (EMBED_DEBUG_ADAPTER) {
      // start port listener on launch of first debug session
      if (!this._server) {
        // start listening on a random port
        this._server = Net.createServer(socket => {
          const session = new SentryDebugSession();
          session.setRunAsServer(true);
          session.start(socket as NodeJS.ReadableStream, socket);
        }).listen(0);
      }

      // make VS Code connect to debug server instead of launching debug adapter
      config.debugServer = this._server.address().port;
    }
    return config;
  }

  public dispose(): void {
    if (this._server) {
      this._server.close();
    }
  }
}

async function createTempFile(contents: string): Promise<string> {
  const random = Math.random()
    .toString()
    .substr(2);

  const filePath = path.join(os.tmpdir(), `${random}.json`);
  await writeFile(filePath, contents);
  return filePath;
}

export async function startDebugging(event: Event): Promise<boolean> {
  const tempFile = await createTempFile(JSON.stringify(event));
  const repos = (
    workspace.workspaceFolders || ([{ uri: { fsPath: '.' } }] as WorkspaceFolder[])
  ).map(folder => folder.uri.fsPath);

  try {
    return await debug.startDebugging(undefined, {
      event: tempFile,
      name: 'View',
      repos,
      request: 'launch',
      type: 'sentry',
    });
  } finally {
    await unlink(tempFile);
  }
}

export function configureDebugger(context: ExtensionContext): void {
  const provider = new SentryConfigurationProvider();
  context.subscriptions.push(debug.registerDebugConfigurationProvider('sentry', provider));
  context.subscriptions.push(provider);
}
