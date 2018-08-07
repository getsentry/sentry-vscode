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
