const secretValues = () =>
  [
    process.env.FOOTBALL_API_KEY,
    process.env.CRON_SYNC_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter((value): value is string => Boolean(value));

const redactSecrets = (value: string | undefined) => {
  if (!value) {
    return value;
  }

  return secretValues().reduce(
    (redactedValue, secret) => redactedValue.replaceAll(secret, '[redacted]'),
    value,
  );
};

export const logFootballSyncConfiguration = () => {
  console.info('[football-sync] Configuration', {
    hasApiKey: Boolean(process.env.FOOTBALL_API_KEY),
    hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    provider: process.env.FOOTBALL_PROVIDER,
    baseUrl: process.env.FOOTBALL_API_BASE_URL,
    teamId: process.env.MANCHESTER_UNITED_EXTERNAL_ID,
    season: process.env.FOOTBALL_CURRENT_SEASON,
  });
};

export const logFootballSyncFailure = (
  error: unknown,
  message = '[football-sync] Synchronization failed',
) => {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  console.error(message, {
    name: normalizedError.name,
    message: redactSecrets(normalizedError.message),
    stack: redactSecrets(normalizedError.stack),
  });
};
