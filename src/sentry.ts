import * as request from 'request-light/lib/main';
import { workspace } from 'vscode';

import { configuration, getToken } from './config';

export interface Issue {
  id: string;
  shortId: string;
  culprit: string;
  title: string;
  metadata: {
    type: string;
    value: string;
  };
}

export interface Event {
  event_id: string;
  // TODO: Add required attributes here
}

export function configureSentry(): void {
  const http = workspace.getConfiguration('http');
  const proxyUrl = http.get<string>('proxy', '');
  const strictSSL = http.get<boolean>('strictSSL', false);
  request.configure(proxyUrl, strictSSL);
}

async function xhr(options: request.XHROptions): Promise<request.XHRResponse> {
  const serverUrl = configuration.getServerUrl();
  const token = await getToken();

  return request.xhr({
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    url: `${serverUrl}${options.url}`,
  });

  // TODO: Handle common errors
}

async function get<T>(url: string): Promise<T> {
  const response = await xhr({ type: 'GET', url });
  return JSON.parse(response.responseText);
}

export async function searchIssues(input: string): Promise<Issue[]> {
  // TODO: Allow customizing environments
  const baseUrl = '/api/0/projects/sentry/sentry/issues/';
  const params = '&limit=25&sort=date&shortIdLookup=1';
  const url = `${baseUrl}?query=${encodeURIComponent(input)}${params}`;
  return get<Issue[]>(url);
}

export async function loadLatestEvent(issue: Issue): Promise<Event> {
  const url = `/api/0/issues/${issue.id}/events/latest/`;
  return get<Event>(url);
}
