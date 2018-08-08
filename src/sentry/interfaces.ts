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
  eventID: string;
  entries: EventEntry[];
}

export interface EventEntry {
  type: string;
  data: EventEntryData;
}

export interface EventEntryData {
  values: EventException[];
}

export interface EventException {
  stacktrace: Stacktrace;
  type: string;
  value: string;
  module: string;
}

export interface Stacktrace {
  frames: Frame[];
}

export interface Frame {
  absPath: string;
  lineNo: number;
  colNo: number;
  inApp: boolean;
  function: string;
  vars: Record<string, any>;
  context: Array<[number, string]>;
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
