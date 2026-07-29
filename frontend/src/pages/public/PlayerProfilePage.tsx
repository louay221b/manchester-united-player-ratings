import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { usePlayer } from '../../hooks/use-players';
import { ApiError } from '../../lib/api';
import type { Player } from '../../types/player';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const getPlayerInitials = (player: Player) =>
  `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase();

function PlayerHeroAvatar({ player }: { player: Player }) {
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt=""
        className="h-24 w-24 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-3xl font-black text-white">
      {getPlayerInitials(player)}
    </span>
  );
}

export function PlayerProfilePage() {
  const { playerId } = useParams();
  const playerQuery = usePlayer(playerId ?? '');

  if (!playerId) {
    return (
      <PageHeader
        eyebrow="Joueur"
        title="Joueur introuvable"
        description="Aucun identifiant joueur n a ete fourni."
      />
    );
  }

  if (playerQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Chargement du profil joueur...
      </div>
    );
  }

  if (playerQuery.isError) {
    const isNotFound = playerQuery.error instanceof ApiError && playerQuery.error.status === 404;

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Joueur"
          title={isNotFound ? 'Joueur introuvable' : 'Profil indisponible'}
          description={getErrorMessage(playerQuery.error, 'Impossible de charger ce profil joueur.')}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void playerQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Reessayer
          </button>
          <Link
            to="/ranking"
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            Voir le classement
          </Link>
        </div>
      </div>
    );
  }

  if (!playerQuery.data) {
    return null;
  }

  const player = playerQuery.data;

  return (
    <div className="space-y-6">
      <section className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <PlayerHeroAvatar player={player} />
        <div>
          <p className="eyebrow">Manchester United</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            {player.shirtNumber ? `#${player.shirtNumber} ` : ''}
            {player.displayName}
          </h1>
          <p className="mt-2 text-zinc-600">{player.position}</p>
          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${
              player.active ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-700'
            }`}
          >
            {player.active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Numero</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.shirtNumber ? `#${player.shirtNumber}` : 'Non renseigne'}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Arrivee</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.joinedAt ?? 'Non renseignee'}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Depart</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.leftAt ?? 'Non renseigne'}
          </p>
        </article>
      </section>
    </div>
  );
}
