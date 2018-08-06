import { Event, Issue } from './sentry';

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
