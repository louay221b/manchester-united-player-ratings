import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandLogo } from '../components/layout/BrandLogo';
import { Footer } from '../components/layout/Footer';
import { PlayerAvatar } from '../components/players/PlayerAvatar';

describe('PlayerAvatar', () => {
  it('shows the player photo when a usable URL is available', () => {
    render(
      <PlayerAvatar
        photoUrl="https://storage.example.test/bruno.webp"
        firstName="Bruno"
        lastName="Fernandes"
      />,
    );

    expect(screen.getByRole('img', { name: 'Photo de Bruno Fernandes' })).toHaveAttribute(
      'src',
      'https://storage.example.test/bruno.webp',
    );
  });

  it('falls back to initials when the photo cannot be loaded', () => {
    render(
      <PlayerAvatar
        photoUrl="https://storage.example.test/missing.webp"
        firstName="Kobbie"
        lastName="Mainoo"
      />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Photo de Kobbie Mainoo' }));

    expect(screen.getByRole('img', { name: 'Initiales de Kobbie Mainoo' })).toHaveTextContent('KM');
  });
});

describe('Footer', () => {
  it('exposes contact, external links and development credit', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /yamen\.a\.ashour@gmail\.com/i })).toHaveAttribute(
      'href',
      'mailto:yamen.a.ashour@gmail.com',
    );
    expect(screen.getByRole('link', { name: 'Chaine YouTube de Yamen Ashour' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getAllByText(/Developpe par Ing\. Louay Tanazefti/i)).toHaveLength(2);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});

describe('BrandLogo', () => {
  it('uses the local Manchester United logo and falls back when it fails to load', () => {
    render(<BrandLogo />);

    const logo = screen.getByRole('img', { name: 'Manchester United' });

    expect(logo).toHaveAttribute('src', '/brand/manchester-united-logo.png');
    expect(logo).toHaveAttribute('width', '48');
    expect(logo).toHaveAttribute('height', '48');

    fireEvent.error(logo);

    expect(screen.getByRole('img', { name: 'Manchester United' })).toBeInTheDocument();
  });
});
