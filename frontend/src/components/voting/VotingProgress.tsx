interface VotingProgressProps {
  ratedCount: number;
  totalCount: number;
  hasManOfTheMatch: boolean;
}

export function VotingProgress({ ratedCount, totalCount, hasManOfTheMatch }: VotingProgressProps) {
  const progress = totalCount === 0 ? 0 : Math.round((ratedCount / totalCount) * 100);

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-500">Progression</p>
          <p className="mt-1 text-2xl font-black text-zinc-950">
            {ratedCount}/{totalCount} joueurs notes
          </p>
        </div>
        <p className="text-sm font-semibold text-zinc-600">
          Homme du match : {hasManOfTheMatch ? 'selectionne' : 'a choisir'}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full bg-united-red" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
