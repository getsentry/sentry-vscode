import { basename } from 'path';
import {
  Handles,
  InitializedEvent,
  Logger,
  logger,
  LoggingDebugSession,
  Scope,
  Source,
  StackFrame,
  StoppedEvent,
  Thread,
} from 'vscode-debugadapter/lib/main';
import { DebugProtocol } from 'vscode-debugprotocol/lib/debugProtocol';

// tslint:disable-next-line:no-empty-interface
interface LaunchRequestArguments {}

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
    _args: DebugProtocol.InitializeRequestArguments,
  ): void {
    console.info('initialize request');
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

  /**
   * Called at the end of the configuration sequence.
   * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
   */
  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    args: DebugProtocol.ConfigurationDoneArguments,
  ): void {
    super.configurationDoneRequest(response, args);

    this.sendEvent(new StoppedEvent('exception', 1));
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    _args: LaunchRequestArguments,
  ): Promise<void> {
    // make sure to 'Stop' the buffered logging if 'trace' is not set
    console.info('launch request');
    logger.setup(Logger.LogLevel.Verbose, false);

    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    console.info('threads request');
    response.body = {
      threads: [new Thread(1, 'fake thread')],
    };
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    _args: DebugProtocol.StackTraceArguments,
  ): void {
    console.info('stack trace request');
    response.body = {
      stackFrames: [
        new StackFrame(
          0,
          'foo.rs',
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
    console.info('scopes request');
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
    _args: DebugProtocol.VariablesArguments,
  ): void {
    console.info('variables request');
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
