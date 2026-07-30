import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: storageMocks.from,
    },
  },
}));

import {
  removeOpponentLogo,
  removePlayerPhoto,
  StorageValidationError,
  uploadOpponentLogo,
  uploadPlayerPhoto,
  validateImageFile,
} from '../services/storage.service';

const playerId = '11111111-1111-4111-8111-111111111111';
const matchId = '22222222-2222-4222-8222-222222222222';
const fileUuid = '33333333-3333-4333-8333-333333333333';

const createFile = (name: string, type: string, size = 128) =>
  new File([new Uint8Array(size)], name, { type });

describe('storage image validation', () => {
  it.each([
    ['JPEG', createFile('player.jpg', 'image/jpeg')],
    ['PNG', createFile('player.png', 'image/png')],
    ['WebP', createFile('player.webp', 'image/webp')],
  ])('accepts a valid %s image', (_label, file) => {
    expect(() => validateImageFile(file)).not.toThrow();
  });

  it('rejects oversized images, PDF files and empty files', () => {
    expect(() =>
      validateImageFile(createFile('large.png', 'image/png', 5 * 1024 * 1024 + 1)),
    ).toThrow(StorageValidationError);
    expect(() => validateImageFile(createFile('document.pdf', 'application/pdf'))).toThrow(
      StorageValidationError,
    );
    expect(() => validateImageFile(createFile('empty.webp', 'image/webp', 0))).toThrow(
      StorageValidationError,
    );
  });
});

describe('storage uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.from.mockReturnValue({
      getPublicUrl: storageMocks.getPublicUrl,
      remove: storageMocks.remove,
      upload: storageMocks.upload,
    });
    storageMocks.getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://storage.example.test/player.jpg',
      },
    });
    storageMocks.remove.mockResolvedValue({ error: null });
    storageMocks.upload.mockResolvedValue({ error: null });
    vi.stubGlobal('crypto', {
      ...globalThis.crypto,
      randomUUID: () => fileUuid,
    });
  });

  it('uploads player photos under the player UUID and returns a public URL', async () => {
    const file = createFile('original-name.jpg', 'image/jpeg');

    await expect(uploadPlayerPhoto(playerId, file)).resolves.toEqual({
      path: `${playerId}/${fileUuid}.jpg`,
      publicUrl: 'https://storage.example.test/player.jpg',
    });
    expect(storageMocks.from).toHaveBeenCalledWith('player-photos');
    expect(storageMocks.upload).toHaveBeenCalledWith(
      `${playerId}/${fileUuid}.jpg`,
      file,
      expect.objectContaining({
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: false,
      }),
    );
  });

  it('rejects invalid resource identifiers before upload', async () => {
    await expect(
      uploadPlayerPhoto('not-a-uuid', createFile('player.png', 'image/png')),
    ).rejects.toMatchObject({
      code: 'INVALID_ID',
    });
    expect(storageMocks.upload).not.toHaveBeenCalled();
  });

  it('surfaces unauthenticated and simple-user Storage refusals', async () => {
    storageMocks.upload.mockResolvedValueOnce({
      error: { message: 'row-level security refused unauthenticated upload' },
    });
    await expect(
      uploadPlayerPhoto(playerId, createFile('player.webp', 'image/webp')),
    ).rejects.toMatchObject({
      code: 'UPLOAD_FAILED',
    });

    storageMocks.upload.mockResolvedValueOnce({
      error: { message: 'row-level security refused non-admin upload' },
    });
    await expect(
      uploadOpponentLogo(matchId, createFile('logo.png', 'image/png')),
    ).rejects.toMatchObject({
      code: 'UPLOAD_FAILED',
    });
  });

  it('removes player photos and opponent logos by relative storage path', async () => {
    await removePlayerPhoto(`${playerId}/${fileUuid}.webp`);
    await removeOpponentLogo(`${matchId}/${fileUuid}.png`);

    expect(storageMocks.remove).toHaveBeenNthCalledWith(1, [`${playerId}/${fileUuid}.webp`]);
    expect(storageMocks.remove).toHaveBeenNthCalledWith(2, [`${matchId}/${fileUuid}.png`]);
  });
});
