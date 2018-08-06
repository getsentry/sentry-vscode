export interface Issue {
  id: string;
  title: string;
}

export interface Event {
  event_id: string;
  // TODO: Add required attributes here
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
