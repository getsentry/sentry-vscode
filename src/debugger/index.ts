import * as Net from 'net';
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
import { configuration } from '../config';
import { Event } from '../sentry';
import { exec, withTempFile } from '../utils';
import { SentryDebugSession } from './server';

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

export async function startDebugging(event: Event): Promise<void> {
  if (!(await checkRevision(event))) {
    return;
  }
  await withTempFile(JSON.stringify(event), tempFile =>
    debug.startDebugging(undefined, {
      // Interface arguments
      name: 'View',
      request: 'launch',
      type: 'sentry',

      // Custom arguments
      event: tempFile,
      searchPaths: configuration.getSearchPaths(),
    }),
  );
}

export function configureDebugger(context: ExtensionContext): void {
  const provider = new SentryConfigurationProvider();
  context.subscriptions.push(debug.registerDebugConfigurationProvider('sentry', provider));
  context.subscriptions.push(provider);
}

async function checkRevision(event: Event): Promise<boolean> {
  if (!event.release || !event.release.version) {
    return true;
  }

  const version = event.release.version;
  for (const folder of workspace.workspaceFolders || []) {
    try {
      const output = await exec('git', ['rev-parse', 'HEAD'], { cwd: folder.uri.fsPath });
      if (output.startsWith(version)) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }

  const buttonClicked = await window.showWarningMessage(
    getRevisionDescription(version),
    'Continue Debugging',
    'Cancel',
  );

  return buttonClicked === 'Continue Debugging';
}

function getRevisionDescription(version: string): string {
  return (
    `Mismatching revision: Event occurred at revision \`${version.substr(0, 7)} \`, ` +
    `but none of your workplace folders seem to have that revision checked out. Make ` +
    `sure the code checked out on your computer matches the code in production. For ` +
    `example, go to your project folder and run: \`git checkout ${version}\`. You ` +
    `might also have to reinstall dependencies for vscode-sentry to pick up the ` +
    `correct files.`
  );
}
