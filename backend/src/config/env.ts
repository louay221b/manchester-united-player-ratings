import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().trim().min(1).url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().optional().default(''),
  FOOTBALL_API_BASE_URL: z.string().trim().url().default('https://v3.football.api-sports.io'),
  FOOTBALL_API_KEY: z.string().trim().optional().default(''),
  FOOTBALL_PROVIDER: z.literal('api-football').default('api-football'),
  MANCHESTER_UNITED_EXTERNAL_ID: z.string().trim().optional().default(''),
  FOOTBALL_CURRENT_SEASON: z.string().trim().optional().default(''),
  FOOTBALL_INCLUDE_FRIENDLIES: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  FOOTBALL_ALLOWED_COMPETITIONS: z
    .string()
    .trim()
    .default('Premier League,UEFA Champions League,UEFA Europa League,FA Cup,EFL Cup,League Cup'),
  CRON_SYNC_SECRET: z.string().trim().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsedEnv.data;
