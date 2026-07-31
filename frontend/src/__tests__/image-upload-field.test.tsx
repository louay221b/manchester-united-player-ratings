import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageUploadField } from '../components/forms/ImageUploadField';

const createObjectUrl = vi.fn(() => 'blob:preview-url');
const revokeObjectUrl = vi.fn();

const createFile = (name: string, type: string, size = 128) =>
  new File([new Uint8Array(size)], name, { type });

function TestImageUploadField({ currentImageUrl = null }: { currentImageUrl?: string | null }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);

  return (
    <ImageUploadField
      label="Photo du joueur"
      currentImageUrl={currentImageUrl}
      placeholderLabel="KM"
      imageAlt="Photo de Kobbie Mainoo"
      selectedFile={selectedFile}
      removeRequested={removeRequested}
      onFileChange={setSelectedFile}
      onRemoveChange={setRemoveRequested}
    />
  );
}

describe('ImageUploadField', () => {
  beforeEach(() => {
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
  });

  it('shows a local preview with the selected file name and size', () => {
    render(<TestImageUploadField />);

    fireEvent.change(screen.getByLabelText('Sélectionner Photo du joueur'), {
      target: {
        files: [createFile('mainoo.png', 'image/png', 2048)],
      },
    });

    expect(screen.getByRole('img', { name: 'Photo de Kobbie Mainoo' })).toHaveAttribute(
      'src',
      'blob:preview-url',
    );
    expect(screen.getByText('mainoo.png')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('marks the current image for removal without requiring a new file', () => {
    render(<TestImageUploadField currentImageUrl="https://storage.example.test/player.webp" />);

    expect(screen.getByRole('img', { name: 'Photo de Kobbie Mainoo' })).toHaveAttribute(
      'src',
      'https://storage.example.test/player.webp',
    );

    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    expect(screen.getByRole('img', { name: 'KM' })).toBeInTheDocument();
    expect(screen.getByText('L’image sera retirée après enregistrement.')).toBeInTheDocument();
  });

  it('rejects invalid files before preview', () => {
    render(<TestImageUploadField />);

    fireEvent.change(screen.getByLabelText('Sélectionner Photo du joueur'), {
      target: {
        files: [createFile('notes.pdf', 'application/pdf')],
      },
    });

    expect(screen.getByText('Utilise une image JPEG, PNG ou WebP.')).toBeInTheDocument();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
