interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="panel p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-zinc-500">{helper}</p> : null}
    </article>
  );
}
