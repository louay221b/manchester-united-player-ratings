import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const migrationPath = fileURLToPath(
  new URL('../../../supabase/migrations/008_storage_assets.sql', import.meta.url),
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('storage assets migration', () => {
  it('creates public buckets with image restrictions', () => {
    expect(migrationSql).toContain("'player-photos'");
    expect(migrationSql).toContain("'opponent-logos'");
    expect(migrationSql).toContain('5242880');
    expect(migrationSql).toContain("'image/jpeg'");
    expect(migrationSql).toContain("'image/png'");
    expect(migrationSql).toContain("'image/webp'");
  });

  it('adds nullable storage path columns without removing public URLs', () => {
    expect(migrationSql).toContain('add column if not exists photo_path text');
    expect(migrationSql).toContain('add column if not exists opponent_logo_path text');
    expect(migrationSql).not.toContain('drop column photo_url');
    expect(migrationSql).not.toContain('drop column opponent_logo_url');
  });

  it('restricts writes to authenticated admins through Storage RLS', () => {
    expect(migrationSql).toContain('storage_assets_admin_insert');
    expect(migrationSql).toContain('storage_assets_admin_update');
    expect(migrationSql).toContain('storage_assets_admin_delete');
    expect(migrationSql).toContain('auth.uid() is not null');
    expect(migrationSql).toContain('public.is_admin()');
    expect(migrationSql).not.toContain('service_role');
  });

  it('keeps match results able to expose the opponent logo URL', () => {
    expect(migrationSql).toContain("'opponentLogoUrl', target_match.opponent_logo_url");
  });
});
