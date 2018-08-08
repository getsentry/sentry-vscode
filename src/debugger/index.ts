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
  WorkspaceFolder,
} from 'vscode';
import { configuration } from '../config';
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
      // The event is required. We need to abort if it is missing.
      return window.showInformationMessage('Missing event payload').then(() => undefined);
    }

    if (!config.searchPaths) {
      config.searchPaths = [];
    }

    // Start a debug server in-process to allow debugging in development.
    // In production, VSCode will spawn a separate process.
    if (EMBED_DEBUG_ADAPTER) {
      if (!this._server) {
        this._server = Net.createServer(socket => {
          const session = new SentryDebugSession();
          session.setRunAsServer(true);
          session.start(socket as NodeJS.ReadableStream, socket);
        }).listen(0);
      }

      // Make VS Code connect to debug server instead of launching debug adapter
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

  try {
    return await debug.startDebugging(undefined, {
      // Interface arguments
      name: 'View',
      request: 'launch',
      type: 'sentry',

      // Custom arguments
      event: tempFile,
      searchPaths: configuration.getSearchPaths(),
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
