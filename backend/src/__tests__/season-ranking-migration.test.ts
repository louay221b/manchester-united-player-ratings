import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const migrationPath = fileURLToPath(
  new URL('../../../supabase/migrations/007_season_rankings.sql', import.meta.url),
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('season ranking migration safeguards', () => {
  it('calculates season average from per-match averages', () => {
    expect(migrationSql).toContain('avg(v.rating) as match_average');
    expect(migrationSql).toContain('round(avg(match_average), 2)');
  });

  it('counts only starters and used substitutes as matches played', () => {
    expect(migrationSql).toContain("participation_status in ('starter', 'substitute_entered')");
  });

  it('keeps public rankings published-only and admin rankings role-protected', () => {
    expect(migrationSql).toContain('results_published = true');
    expect(migrationSql).toContain("role = 'admin'");
    expect(migrationSql).toContain('auth.uid()');
  });

  it('does not expose voter identity fields in returned JSON', () => {
    expect(migrationSql).not.toContain("'userId'");
    expect(migrationSql).not.toContain("'email'");
  });
});
