import { SentryEvent } from '@sentry/types';
import { debug } from 'vscode';

export function startDebugging(event: SentryEvent): Thenable<boolean> {
  console.info(event);
  return debug.startDebugging(undefined, 'configuration');
}
