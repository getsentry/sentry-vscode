import * as request from 'request-light';
import Uri from 'vscode-uri';

import { configuration } from '../config';
import { Event, Issue } from './interfaces';
import { getToken } from './rc';

async function xhr(options: request.XHROptions): Promise<request.XHRResponse> {
  const serverUrl = configuration.getServerUrl();
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Not authenticated with Sentry. Please provide an auth token.',
    );
  }

  // Normalize the URL passed in options. If it is missing a scheme or
  // serverUrl, the value configured in "sentry.serverUrl" is used instead.
  const parsedUrl = Uri.parse(options.url || '');
  const mergedUrl = Uri.parse(serverUrl).with(parsedUrl.toJSON());

  return request.xhr({
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    url: mergedUrl.toString(true),
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
