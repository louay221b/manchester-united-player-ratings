import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { updateOwnProfileSchema } from '../schemas/auth.schema.js';
import { updateOwnProfile } from '../services/auth.service.js';

const migrationPath = fileURLToPath(
  new URL('../../../supabase/migrations/009_account_management.sql', import.meta.url),
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('account management migration', () => {
  it('creates a locked RPC that updates only the authenticated full name', () => {
    expect(migrationSql).toContain('public.update_own_profile(p_full_name text)');
    expect(migrationSql).toContain('auth.uid()');
    expect(migrationSql).toContain('full_name = normalized_full_name');
    expect(migrationSql).toContain('updated_at = now()');
    expect(migrationSql).toContain('returning profiles.id, profiles.full_name, profiles.role');
    expect(migrationSql).toContain(
      'grant execute on function public.update_own_profile(text) to authenticated',
    );
    expect(migrationSql).toContain(
      'revoke all on function public.update_own_profile(text) from anon',
    );
    expect(migrationSql).not.toMatch(/\bp_role\b/);
    expect(migrationSql).not.toMatch(/\bset\s+role\s*=/i);
  });
});

describe('profile update validation', () => {
  it('trims a valid name and rejects role or identity fields', () => {
    expect(updateOwnProfileSchema.parse({ fullName: '  Alex Supporter  ' })).toEqual({
      fullName: 'Alex Supporter',
    });

    expect(() => updateOwnProfileSchema.parse({ fullName: 'A' })).toThrow();
    expect(() => updateOwnProfileSchema.parse({ fullName: 'Alex', role: 'admin' })).toThrow();
    expect(() => updateOwnProfileSchema.parse({ fullName: 'Alex', userId: '123' })).toThrow();
  });
});

describe('profile update service', () => {
  it('calls update_own_profile without client-provided role or user id', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        full_name: 'Alex Supporter',
        role: 'user',
      },
      error: null,
    });
    const rpc = vi.fn(() => ({
      maybeSingle,
    }));
    const client = { rpc } as unknown as SupabaseClient;

    await expect(updateOwnProfile(client, { fullName: 'Alex Supporter' })).resolves.toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      fullName: 'Alex Supporter',
      role: 'user',
    });

    expect(rpc).toHaveBeenCalledWith('update_own_profile', {
      p_full_name: 'Alex Supporter',
    });
  });
});
