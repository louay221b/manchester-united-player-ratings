export interface FootballSyncDifference {
  fixtureId: string;
  field: string;
  current: string | number | boolean | null;
  incoming: string | number | boolean | null;
}

export interface FootballSyncSummary {
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
  differences: FootballSyncDifference[];
  lastSyncedAt: string;
}

export interface FootballIntegrationStatus {
  provider: 'api-football';
  manchesterUnitedExternalId: string | null;
  currentSeason: string | null;
  lastSynchronization: string | null;
  lastSuccess: string | null;
  lastError: string | null;
}
