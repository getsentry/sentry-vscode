import * as fs from 'fs';
import { basename } from 'path';
import promisify = require('util.promisify');
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

logger.setup(Logger.LogLevel.Verbose, false);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

async function isFile(path: string): Promise<boolean> {
  try {
    const rv = await stat(path);
    return rv.isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENAMETOOLONG') {
      return false;
    }
    throw error;
  }
}

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  event: string;
  repos: string[];
}

export class SentryDebugSession extends LoggingDebugSession {
  private event!: Event;
  private repos!: string[];
  private exception!: EventException;

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

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    this.launchRequestAsync(response, args).catch(error => logger.error(error));
  }

  private async launchRequestAsync(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    const filename = args.event;
    this.event = JSON.parse(await readFile(filename, 'utf8'));
    this.exception = ([] as EventException[]).concat(
      ...(this.event.entries || [])
        .filter(entry => entry.type === 'exception')
        .map(entry => entry.data.values),
    )[0];

    this.repos = args.repos;
    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    response.body = {
      threads: [new Thread(1, 'fake thread')],
    };
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): void {
    this.stackTraceRequestAsync(response, args).catch(error =>
      logger.error(error),
    );
  }

  private async stackTraceRequestAsync(
    response: DebugProtocol.StackTraceResponse,
    _args: DebugProtocol.StackTraceArguments,
  ): Promise<void> {
    const frames = this.exception.stacktrace.frames;
    const forceNormal =
      frames.every(frame => frame.inApp) || frames.every(frame => !frame.inApp);
    const stackFrames: StackFrame[] = await Promise.all(
      frames.map(
        async (frame, i) =>
          new StackFrame(
            i,
            frame.function,
            (await this.createSource(frame, forceNormal)) as Source,
            frame.lineNo,
            frame.colNo,
          ),
      ),
    );

    response.body = {
      stackFrames,
      totalFrames: stackFrames.length,
    };
    this.sendResponse(response);
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ): void {
    const frameReference = args.frameId;
    const scopes = new Array<Scope>();
    scopes.push(new Scope('Local', frameReference, false));

    response.body = {
      scopes,
    };
    this.sendResponse(response);
  }

  protected variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): void {
    const rv = new Array<DebugProtocol.Variable>();
    const vars = this.exception.stacktrace.frames[args.variablesReference].vars;
    for (const name of Object.keys(vars)) {
      rv.push({
        name,
        type: 'string',
        value: `${vars[name]}`,
        variablesReference: args.variablesReference,
      });
    }

    response.body = {
      variables: rv,
    };
    this.sendResponse(response);
  }

  // ---- helpers
  private async createSource(
    frame: Frame,
    forceNormal: boolean,
  ): Promise<Source> {
    const localPath = await convertEventPathToLocalPath(
      this.repos,
      frame.absPath,
    );
    const rv = new CustomSource(
      basename(frame.absPath),
      this.convertDebuggerPathToClient(localPath || frame.absPath),
      frame.inApp || forceNormal ? 'normal' : 'deemphasize',
    );
    return rv;
  }
}

async function convertEventPathToLocalPath(
  repos: string[],
  filePath: string,
): Promise<string | undefined> {
  const segments = filePath.split('/').reverse();
  while (segments.length > 0) {
    for (const prefix of [''].concat(...repos)) {
      const path = `${prefix}/${segments
        .slice()
        .reverse()
        .join('/')}`;
      if (await isFile(path)) {
        return path;
      }
    }
    segments.pop();
  }
  logger.warn(`Failed to map ${filePath} to the local fs.`);
  return undefined;
}

// tslint:disable-next-line:max-classes-per-file
class CustomSource extends Source {
  public presentationHint: 'normal' | 'emphasize' | 'deemphasize';
  public constructor(
    name: string,
    path: string,
    presentationHint: 'normal' | 'emphasize' | 'deemphasize',
  ) {
    super(name, path);
    this.presentationHint = presentationHint;
  }
}
