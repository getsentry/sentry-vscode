export interface Issue {
  id: string;
  shortId: string;
  culprit: string;
  title: string;
  metadata: {
    type: string;
    value: string;
  };
  permalink: string;
  project: {
    slug: string;
    id: string;
    name: string;
  };
}

export interface Event {
  event_id: string;
  // TODO: Add required attributes here
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  slug: string;
  team: {
    id: string;
    name: string;
    slug: string;
  };
  organization: Organization;
}
