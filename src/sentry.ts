import * as request from 'request-light';
import { workspace } from 'vscode';

import { getServerUrl, getToken } from './config';

export interface Issue {
  id: string;
  title: string;
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
  const serverUrl = await getServerUrl();
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

export async function searchIssues(_input: string): Promise<Issue[]> {
  return [
    {
      id: 'a',
      title: 'First',
    },
    {
      id: 'b',
      title: 'Second',
    },
    {
      id: 'c',
      title: 'Third',
    },
  ];
}

export async function loadLatestEvent(_issue: Issue): Promise<Event> {
  return {
    event_id: 'asdf',
  };
}
