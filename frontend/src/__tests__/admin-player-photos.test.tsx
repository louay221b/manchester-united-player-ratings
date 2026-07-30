import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPlayerPhotosPage } from '../pages/admin/AdminPlayerPhotosPage';
import { updatePlayer } from '../services/players-api.service';
import {
  removePlayerPhoto,
  uploadPlayerPhoto,
  validateImageFile,
} from '../services/storage.service';
import type { Player } from '../types/player';

const { testPlayer, updatedPlayer } = vi.hoisted(() => {
  const player: Player = {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Bruno',
    lastName: 'Fernandes',
    displayName: 'Bruno Fernandes',
    shirtNumber: 8,
    position: 'Milieu',
    photoUrl: 'https://storage.example.test/old.webp',
    photoPath: 'players/11111111-1111-4111-8111-111111111111/old.webp',
    active: true,
    joinedAt: '2020-01-29',
    leftAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  return {
    testPlayer: player,
    updatedPlayer: {
      ...player,
      photoUrl: 'https://storage.example.test/new.webp',
      photoPath: 'players/11111111-1111-4111-8111-111111111111/new.webp',
    },
  };
});

vi.mock('../hooks/use-players', () => ({
  playerQueryKey: (playerId: string) => ['player', playerId],
  playersQueryKey: ['players'],
  usePlayers: vi.fn(() => ({
    data: {
      data: [testPlayer],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
    },
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: vi.fn(),
  })),
}));

vi.mock('../services/players-api.service', () => ({
  updatePlayer: vi.fn(),
}));

vi.mock('../services/storage.service', () => ({
  removePlayerPhoto: vi.fn(),
  StorageValidationError: class StorageValidationError extends Error {},
  uploadPlayerPhoto: vi.fn(),
  validateImageFile: vi.fn(),
}));

const createObjectUrl = vi.fn(() => 'blob:player-preview');
const revokeObjectUrl = vi.fn();

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPlayerPhotosPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPlayerPhotosPage', () => {
  beforeEach(() => {
    vi.mocked(validateImageFile).mockClear();
    vi.mocked(uploadPlayerPhoto).mockResolvedValue({
      path: updatedPlayer.photoPath ?? '',
      publicUrl: updatedPlayer.photoUrl ?? '',
    });
    vi.mocked(updatePlayer).mockResolvedValue(updatedPlayer);
    vi.mocked(removePlayerPhoto).mockResolvedValue();
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uploads a selected photo, updates the player, then removes the old stored file', async () => {
    renderPage();

    const file = new File([new Uint8Array(128)], 'bruno.webp', { type: 'image/webp' });

    fireEvent.change(screen.getByLabelText('Selectionner une photo pour Bruno Fernandes'), {
      target: {
        files: [file],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() => {
      expect(screen.getByText('Photo envoyee.')).toBeInTheDocument();
    });

    expect(validateImageFile).toHaveBeenCalledWith(file);
    expect(uploadPlayerPhoto).toHaveBeenCalledWith(testPlayer.id, file);
    expect(updatePlayer).toHaveBeenCalledWith(testPlayer.id, {
      photoUrl: updatedPlayer.photoUrl,
      photoPath: updatedPlayer.photoPath,
    });
    expect(removePlayerPhoto).toHaveBeenCalledWith(testPlayer.photoPath);
  });

  it('requires an explicit player selection before a batch photo upload', async () => {
    renderPage();

    const file = new File([new Uint8Array(128)], 'unknown-file-name.webp', { type: 'image/webp' });

    fireEvent.change(screen.getByLabelText('Selectionner plusieurs photos'), {
      target: {
        files: [file],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer l import' }));

    expect(await screen.findByText('Selectionne un joueur pour ce fichier.')).toBeInTheDocument();
    expect(uploadPlayerPhoto).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Joueur correspondant'), {
      target: {
        value: testPlayer.id,
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer l import' }));

    await waitFor(() => {
      expect(screen.getByText('Photo envoyee.')).toBeInTheDocument();
    });

    expect(uploadPlayerPhoto).toHaveBeenCalledWith(testPlayer.id, file);
  });
});
