import { ApiPlayerAvatar } from '../ApiPlayerAvatar';
import { RatingInput } from '../RatingInput';
import type { BallotPlayer } from '../../types/match';

interface PlayerRatingCardProps {
  player: BallotPlayer;
  rating?: number;
  disabled?: boolean;
  onChange: (playerId: string, rating: number) => void;
}

export function PlayerRatingCard({
  player,
  rating,
  disabled = false,
  onChange,
}: PlayerRatingCardProps) {
  return (
    <section className="panel p-5">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-center">
        <div className="flex items-center gap-4">
          <ApiPlayerAvatar player={player} />
          <div>
            <p className="font-black text-zinc-950">
              {player.shirtNumber ? `#${player.shirtNumber} ` : ''}
              {player.displayName}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{player.position}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-600">
              {player.participationStatus === 'starter' ? 'Titulaire' : 'Remplacant entre'} -{' '}
              {player.minutesPlayed} min
            </p>
          </div>
        </div>
        <RatingInput
          value={rating}
          onChange={(nextRating) => onChange(player.id, nextRating)}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
