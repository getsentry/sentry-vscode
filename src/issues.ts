export interface Issue {
  // TODO:
  id: string;
  title: string;
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
