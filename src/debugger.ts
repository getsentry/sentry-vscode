import { debug } from 'vscode';

import { Event } from './sentry';

export function startDebugging(event: Event): Thenable<boolean> {
  return debug.startDebugging(undefined, 'configuration');
}
