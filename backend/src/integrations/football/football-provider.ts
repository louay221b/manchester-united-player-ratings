import type {
  SyncedFixture,
  SyncedFixtureEvent,
  SyncedFixtureLineup,
  SyncedTeam,
  SyncedPlayer,
} from './football-sync.types.js';

export interface FootballProvider {
  readonly name: 'api-football';
  getTeamById(teamId: string): Promise<SyncedTeam>;
  getTeamFixtures(teamId: string, season: string): Promise<SyncedFixture[]>;
  getFixtureById(fixtureId: string): Promise<SyncedFixture>;
  getFixtureLineups(fixtureId: string): Promise<SyncedFixtureLineup[]>;
  getFixtureEvents(fixtureId: string): Promise<SyncedFixtureEvent[]>;
  getCurrentSquad(teamId: string): Promise<SyncedPlayer[]>;
}
