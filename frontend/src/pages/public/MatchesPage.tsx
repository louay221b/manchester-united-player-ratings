import { MatchCard } from '../../components/MatchCard';
import { PageHeader } from '../../components/PageHeader';
import { matches } from '../../data/mockData';

export function MatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendrier"
        title="Liste des matchs"
        description="Les cartes affichent les adversaires, le statut des votes, le score connu et les actions disponibles."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </section>
    </div>
  );
}
