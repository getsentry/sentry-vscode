import * as fs from 'fs';
import * as path from 'path';
import * as promisify from 'util.promisify';
import { workspace } from 'vscode';
import {
  InitializedEvent,
  Logger,
  logger,
  LoggingDebugSession,
  Scope,
  Source,
  StackFrame,
  StoppedEvent,
  Thread,
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { Event, EventException, Frame } from '../sentry';
import { IndexMapper } from './indexMapper';

logger.setup(Logger.LogLevel.Verbose, false);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

async function isFile(filePath: string): Promise<boolean> {
  try {
    const rv = await stat(filePath);
    return rv.isFile();
  } catch (error) {
    return false;
  }
}

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  event: string;
  searchPaths: string[];
}

export class SentryDebugSession extends LoggingDebugSession {
  private event!: Event;
  private searchPaths!: string[];
  private exception!: EventException;

  /**
   * A mapping from arrays of the form [frameId, varName1, varField1, varField2, ...] to variableReferences.
   *
   * [1, "foo", "bar"] means for example that attribute "bar" of variable "foo" in frame 1 is accessed.
   */
  private varsMapper: IndexMapper = new IndexMapper();

  /**
   * Creates a new debug adapter that is used for one debug session.
   * We configure the default implementation of a debug adapter here.
   */
  public constructor() {
    super('mock-debug.txt');

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
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;

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

  protected launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): void {
    this.handleAsyncResponse(this.launchRequestAsync, response, args);
  }

  protected async launchRequestAsync(
    _response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    const filename = args.event;
    this.event = JSON.parse(await readFile(filename, 'utf8'));
    this.exception = ([] as EventException[]).concat(
      ...(this.event.entries || [])
        .filter(entry => entry.type === 'exception')
        .map(entry => entry.data.values),
    )[0];

    this.searchPaths = args.searchPaths;
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    response.body = {
      threads: [new Thread(1, 'fake thread')],
    };
    this.sendResponse(response);
  }

  protected sourceRequest(
    response: DebugProtocol.SourceResponse,
    args: DebugProtocol.SourceArguments,
  ): void {
    const frame = this.exception.stacktrace.frames[args.sourceReference - 1];
    const firstLine = frame.context.length ? frame.context[0][0] : frame.lineNo;

    const preContent = new Array(firstLine - 1).fill('\n').join('');
    const context = frame.context.map(([_, s]) => s).join('\n');

    response.body = response.body || {};
    response.body.content = `${preContent}${context}\n`;
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): void {
    this.handleAsyncResponse(this.stackTraceRequestAsync, response, args);
  }

  private async stackTraceRequestAsync(
    response: DebugProtocol.StackTraceResponse,
    _args: DebugProtocol.StackTraceArguments,
  ): Promise<void> {
    const frames = this.exception.stacktrace.frames;
    const forceNormal = frames.every(frame => frame.inApp) || frames.every(frame => !frame.inApp);
    const stackFrames: StackFrame[] = await Promise.all(
      frames
        .map(
          async (frame, i) =>
            new StackFrame(
              i,
              frame.function,
              await this.createSource(i, frame, forceNormal),
              frame.lineNo,
              frame.colNo,
            ),
        )
        .reverse(),
    );

    response.body = {
      stackFrames,
      totalFrames: stackFrames.length,
    };
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ): void {
    response.body = {
      scopes: [new Scope('Local', this.varsMapper.upsertArray([args.frameId]), false)],
    };
    this.sendResponse(response);
  }

  protected variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): void {
    const variablePath = this.varsMapper.getArray(args.variablesReference);
    const frameId = variablePath[0] as number;
    let vars = this.exception.stacktrace.frames[frameId].vars;
    for (const segment of variablePath.slice(1)) {
      vars = vars[segment];
    }

    response.body = {
      variables: Object.keys(vars).map(name => ({
        name,
        type: typeof vars[name],
        value: `${vars[name]}`,
        variablesReference:
          Object.prototype.toString.call(vars[name]) === '[object Object]' ||
          Object.prototype.toString.call(vars[name]) === '[object Array]'
            ? this.varsMapper.upsertArray(
                this.varsMapper.getArray(args.variablesReference).concat(name),
              )
            : 0,
      })),
    };
    this.sendResponse(response);
  }

  // ---- helpers
  private async createSource(
    frameId: number,
    frame: Frame,
    forceNormal: boolean,
  ): Promise<Source | undefined> {
    const localPath = await convertEventPathToLocalPath(this.searchPaths, frame.absPath);
    if (!localPath && frame.context.length === 0) {
      return undefined;
    }
    const rv = new CustomSource(
      path.basename(frame.absPath),
      localPath && this.convertDebuggerPathToClient(localPath),
      localPath ? undefined : frameId + 1,
      frame.inApp || forceNormal ? 'normal' : 'deemphasize',
    );
    return rv;
  }

  private handleAsyncResponse<R extends DebugProtocol.Response, A>(
    func: (r: R, a: A) => Promise<void>,
    response: R,
    args: A,
  ): void {
    func
      .call(this, response, args)
      .catch((error: Error) => {
        logger.error(error.message);
        response.message = error.message;
        response.success = false;
      })
      .then(() => this.sendResponse(response));
  }
}

async function convertEventPathToLocalPath(
  searchPaths: string[],
  filePath: string,
): Promise<string | undefined> {
  const segments = filePath
    .split(/\/+/g)
    .filter(segment => !segment.endsWith(':'))
    .filter(segment => segment !== '.');

  while (segments.length > 0) {
    for (const prefix of searchPaths) {
      const absPath = path.resolve(workspace.rootPath || '', prefix, ...segments);
      if (await isFile(absPath)) {
        return absPath;
      }
    }

    segments.shift();
  }

  logger.warn(`Failed to map ${filePath} to the local fs.`);
  return undefined;
}

// tslint:disable-next-line:max-classes-per-file
class CustomSource extends Source {
  public presentationHint?: 'normal' | 'emphasize' | 'deemphasize';
  public constructor(
    name: string,
    filePath?: string,
    sourceReference?: number,
    presentationHint?: 'normal' | 'emphasize' | 'deemphasize',
  ) {
    super(name, filePath, sourceReference);
    this.presentationHint = presentationHint;
  }
}
