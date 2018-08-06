import { startDebugging } from '../debugger';
import { SentryCommand } from './base';

export const COMMAND = 'sentry.startDebugger';

export class StartDebuggerCommand extends SentryCommand<void> {
  public constructor() {
    super(COMMAND);
  }

  protected async run(_args: void): Promise<void> {
    startDebugging({ event_id: 'asdf' });
  }
}

export const startDebugger = new StartDebuggerCommand();
