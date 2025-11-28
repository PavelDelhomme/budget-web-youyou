// SummaryCard component

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{value}</div>
      {subtitle && <div className="text-xs text-slate-600 dark:text-gray-300 mt-2">{subtitle}</div>}
    </div>
  );
}

