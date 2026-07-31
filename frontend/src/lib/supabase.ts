import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseMissingVariables = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabasePublishableKey ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : null,
].filter((variable): variable is string => Boolean(variable));

export const supabaseConfigError =
  supabaseMissingVariables.length > 0
    ? `Supabase configuration incomplete. Missing variable(s): ${supabaseMissingVariables.join(', ')}.`
    : null;

export const supabase = createClient(
  supabaseUrl || 'https://missing-supabase-url.supabase.co',
  supabasePublishableKey || 'missing-supabase-publishable-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
);
