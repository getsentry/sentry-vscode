import {
  CancellationToken,
  debug,
  DebugConfiguration,
  DebugConfigurationProvider,
  ProviderResult,
  window,
  WorkspaceFolder,
} from 'vscode';

import * as Net from 'net';
import { basename } from 'path';
import {
  Handles,
  InitializedEvent,
  logger,
  Logger,
  LoggingDebugSession,
  Scope,
  Source,
  StackFrame,
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { Event } from './sentry';

export function startDebugging(event: Event): Thenable<boolean> {
  return debug.startDebugging(undefined, {
    event,
    name: 'View',
    request: 'launch',
    type: 'sentry',
  });
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
    folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    token?: CancellationToken,
  ): ProviderResult<DebugConfiguration> {
    if (!config.event) {
      return window
        .showInformationMessage('Cannot find a program to debug')
        .then(_ => undefined);
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
    return;
  }
}

/**
 * This interface describes the mock-debug specific launch attributes
 * (which are not part of the Debug Adapter Protocol).
 * The schema for these attributes lives in the package.json of the mock-debug extension.
 * The interface should always match this schema.
 */
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  /** Event to debug. */
  event: Event;
}

// tslint:disable-next-line:max-classes-per-file
export class SentryDebugSession extends LoggingDebugSession {
  private _variableHandles: Handles<string> = new Handles<string>();

  /**
   * Creates a new debug adapter that is used for one debug session.
   * We configure the default implementation of a debug adapter here.
   */
  public constructor() {
    super('mock-debug.txt');

    console.info('debug session initiated');

    // this debugger uses zero-based lines and columns
    this.setDebuggerLinesStartAt1(false);
    this.setDebuggerColumnsStartAt1(false);
  }

  /**
   * The 'initialize' request is the first request called by the frontend
   * to interrogate the features the debug adapter provides.
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments,
  ): void {
    // build and return the capabilities of this debug adapter:
    response.body = response.body || {};

    // the adapter implements the configurationDoneRequest.
    response.body.supportsConfigurationDoneRequest = true;

    response.body.supportsDelayedStackTraceLoading = false;

    this.sendResponse(response);

    // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
    // we request them early by sending an 'initializeRequest' to the frontend.
    // The frontend will end the configuration sequence by calling 'configurationDone' request.
    this.sendEvent(new InitializedEvent());
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    // make sure to 'Stop' the buffered logging if 'trace' is not set
    console.info('launch request');
    logger.setup(Logger.LogLevel.Verbose, false);

    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): void {
    console.info('stack trace request');
    response.body = {
      stackFrames: [
        new StackFrame(
          0,
          'foo',
          this.createSource('/Users/untitaker/foo.rs'),
          2,
          0,
        ),
      ],
      totalFrames: 1,
    };
    this.sendResponse(response);
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ): void {
    const frameReference = args.frameId;
    const scopes = new Array<Scope>();
    scopes.push(
      new Scope(
        'Local',
        this._variableHandles.create(`local_${frameReference}`),
        false,
      ),
    );

    response.body = {
      scopes,
    };
    this.sendResponse(response);
  }

  protected variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): void {
    const variables = new Array<DebugProtocol.Variable>();
    variables.push({
      name: 'donko',
      type: 'integer',
      value: '123',
      variablesReference: 0,
    });

    response.body = {
      variables,
    };
    this.sendResponse(response);
  }

  // ---- helpers
  private createSource(filePath: string): Source {
    return new Source(
      basename(filePath),
      this.convertDebuggerPathToClient(filePath),
      undefined,
      undefined,
      'mock-adapter-data',
    );
  }
}
