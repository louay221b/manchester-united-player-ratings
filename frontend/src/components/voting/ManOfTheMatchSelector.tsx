import { useTranslation } from 'react-i18next';

import { ApiPlayerAvatar } from '../ApiPlayerAvatar';
import type { BallotPlayer } from '../../types/match';

interface ManOfTheMatchSelectorProps {
  players: BallotPlayer[];
  selectedPlayerId: string | null;
  disabled?: boolean;
  onChange: (playerId: string) => void;
}

export function ManOfTheMatchSelector({
  players,
  selectedPlayerId,
  disabled = false,
  onChange,
}: ManOfTheMatchSelectorProps) {
  const { t } = useTranslation();

  return (
    <section className="panel space-y-4 p-5">
      <div>
        <p className="eyebrow">{t('voting.manOfTheMatch')}</p>
        <h2 className="mt-2 text-xl font-black text-zinc-950">{t('voting.separateChoice')}</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {players.map((player) => {
          const isSelected = selectedPlayerId === player.id;

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => onChange(player.id)}
              disabled={disabled}
              className={`focus-ring flex items-center gap-3 rounded-lg border p-3 text-start ${
                isSelected
                  ? 'border-united-red bg-red-50 text-united-red'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-united-red'
              } disabled:cursor-not-allowed disabled:opacity-60`}
              aria-pressed={isSelected}
            >
              <ApiPlayerAvatar player={player} size="sm" />
              <span>
                <span className="block font-black">{player.displayName}</span>
                <span className="block text-sm text-zinc-500">{player.position}</span>
              </span>
              {isSelected ? (
                <span className="ms-auto rounded-full bg-united-red px-2 py-1 text-xs font-black text-white">
                  {t('voting.selected')}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
