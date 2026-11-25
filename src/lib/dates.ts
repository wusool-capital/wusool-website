// True when an update falls on a later day than publication.
export const isLaterDay = (published?: string, updated?: string) =>
  !!updated && updated.slice(0, 10) > (published ?? "").slice(0, 10);
