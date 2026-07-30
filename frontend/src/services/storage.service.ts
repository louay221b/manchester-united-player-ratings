import { supabase } from '../lib/supabase';

// Frontend uploads use the existing Supabase publishable client and the admin session only.
// Authorization is enforced again by API admin routes and Storage RLS; never add privileged server keys here.
export type StorageBucket = 'player-photos' | 'opponent-logos';

export interface UploadedAsset {
  path: string;
  publicUrl: string;
}

const maxImageSize = 5 * 1024 * 1024;
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const extensionByMimeType: Record<(typeof allowedMimeTypes)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class StorageValidationError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const isAllowedImageType = (type: string): type is (typeof allowedMimeTypes)[number] =>
  allowedMimeTypes.includes(type as (typeof allowedMimeTypes)[number]);

export const validateImageFile = (file: File) => {
  if (file.size <= 0) {
    throw new StorageValidationError('EMPTY_FILE', 'Le fichier est vide.');
  }

  if (file.size > maxImageSize) {
    throw new StorageValidationError('FILE_TOO_LARGE', 'L image ne doit pas depasser 5 Mo.');
  }

  if (!isAllowedImageType(file.type)) {
    throw new StorageValidationError('INVALID_FILE_TYPE', 'Utilise une image JPEG, PNG ou WebP.');
  }
};

const validateUuid = (value: string, resourceLabel: string) => {
  if (!uuidPattern.test(value)) {
    throw new StorageValidationError('INVALID_ID', `${resourceLabel} invalide.`);
  }
};

const buildAssetPath = (resourceId: string, file: File) => {
  validateImageFile(file);
  const extension = extensionByMimeType[file.type as (typeof allowedMimeTypes)[number]];

  return `${resourceId}/${crypto.randomUUID()}.${extension}`;
};

const validateStoragePath = (path: string) => {
  if (!path || path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    throw new StorageValidationError('INVALID_PATH', 'Chemin Storage invalide.');
  }
};

const uploadImage = async (
  bucket: StorageBucket,
  resourceId: string,
  file: File,
  resourceLabel: string,
): Promise<UploadedAsset> => {
  validateUuid(resourceId, resourceLabel);
  const path = buildAssetPath(resourceId, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new StorageValidationError(
      'UPLOAD_FAILED',
      'Upload refuse ou impossible. Verifie ta session administrateur.',
    );
  }

  return {
    path,
    publicUrl: getStoragePublicUrl(bucket, path),
  };
};

const removeImage = async (bucket: StorageBucket, path: string | null) => {
  if (!path) {
    return;
  }

  validateStoragePath(path);

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new StorageValidationError('DELETE_FAILED', 'Impossible de supprimer l image Storage.');
  }
};

export const getStoragePublicUrl = (bucket: StorageBucket, path: string) => {
  validateStoragePath(path);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};

export const uploadPlayerPhoto = (playerId: string, file: File) =>
  uploadImage('player-photos', playerId, file, 'Identifiant joueur');

export const removePlayerPhoto = (path: string | null) => removeImage('player-photos', path);

export const uploadOpponentLogo = (matchId: string, file: File) =>
  uploadImage('opponent-logos', matchId, file, 'Identifiant match');

export const removeOpponentLogo = (path: string | null) => removeImage('opponent-logos', path);
