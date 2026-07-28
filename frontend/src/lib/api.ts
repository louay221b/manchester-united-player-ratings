import { supabase } from './supabase';

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const apiUrl = import.meta.env.VITE_API_URL;

const getApiBaseUrl = () => {
  if (!apiUrl) {
    throw new ApiError(
      500,
      'API_CONFIGURATION_ERROR',
      'Configuration API incomplete. Variable manquante: VITE_API_URL.',
    );
  }

  return apiUrl.replace(/\/$/, '');
};

const getReadableMessage = (status: number, fallback: string) => {
  if (status === 400) {
    return fallback || 'Requete incorrecte.';
  }

  if (status === 401) {
    return fallback || 'Connexion requise ou session expiree.';
  }

  if (status === 403) {
    return fallback || 'Tu n as pas les droits necessaires pour cette action.';
  }

  if (status === 404) {
    return fallback || 'Route API introuvable.';
  }

  if (status >= 500) {
    return fallback || 'Erreur serveur. Reessaie plus tard.';
  }

  return fallback || 'Erreur API inattendue.';
};

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { message: text } : null;
  }

  return response.json() as Promise<unknown>;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const apiError =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object'
        ? payload.error
        : null;

    const code =
      apiError && 'code' in apiError && typeof apiError.code === 'string'
        ? apiError.code
        : `HTTP_${response.status}`;
    const message =
      apiError && 'message' in apiError && typeof apiError.message === 'string'
        ? apiError.message
        : '';

    throw new ApiError(response.status, code, getReadableMessage(response.status, message));
  }

  return payload as T;
}
