import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import promisify = require('util.promisify');

import {
  CancellationToken,
  debug,
  DebugConfiguration,
  DebugConfigurationProvider,
  ExtensionContext,
  ProviderResult,
  WorkspaceFolder,
} from 'vscode';

import * as Net from 'net';
import { Event } from '../sentry';
import { SentryDebugSession } from './server';

const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

async function createTempFile(contents: string): Promise<string> {
  const random = Math.random()
    .toString()
    .substr(2);

  const filePath = path.join(os.tmpdir(), `${random}.json`);
  await writeFile(filePath, contents);
  return filePath;
}

export async function startDebugging(event: Event): Promise<boolean> {
  const tempFile = createTempFile(JSON.stringify(event));

  try {
    return debug.startDebugging(undefined, {
      event: tempFile,
      name: 'View',
      request: 'launch',
      type: 'sentry',
    });
  } finally {
    await unlink(tempFile);
  }
}

/*
 * Set the following compile time flag to true if the
 * debug adapter should run inside the extension host.
 * Please note: the test suite does no longer work in this mode.
 */
const EMBED_DEBUG_ADAPTER = true;

export class SentryConfigurationProvider implements DebugConfigurationProvider {
  private _server?: Net.Server;
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  public resolveDebugConfiguration(
    _folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    _token?: CancellationToken,
  ): ProviderResult<DebugConfiguration> {
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
    return;
  }
}

export function configureDebugger(context: ExtensionContext): void {
  const provider = new SentryConfigurationProvider();
  context.subscriptions.push(
    debug.registerDebugConfigurationProvider('sentry', provider),
  );
  context.subscriptions.push(provider);
}
