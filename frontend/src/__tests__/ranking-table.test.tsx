import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { RankingTable } from '../components/ranking/RankingTable';
import type { SeasonRankingRow } from '../types/ranking';

const unratedPlayer: SeasonRankingRow = {
  rank: 1,
  playerId: '11111111-1111-4111-8111-111111111111',
  firstName: 'Kobbie',
  lastName: 'Mainoo',
  shirtNumber: 37,
  position: 'Midfielder',
  photoUrl: null,
  active: true,
  matchesPlayed: 2,
  ratedMatches: 0,
  totalVotes: 0,
  seasonAverage: null,
  manOfTheMatchCount: 0,
};

describe('RankingTable', () => {
  it('displays an em dash when a player has no season average', () => {
    render(
      <MemoryRouter>
        <RankingTable rows={[unratedPlayer]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0.00')).not.toBeInTheDocument();
  });
});
