// SummaryCard component

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="w-full rounded-lg bg-white dark:bg-gray-800 shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden">
      <div className="text-sm sm:text-base uppercase tracking-wide text-slate-500 dark:text-gray-400 truncate font-medium">{title}</div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-2 text-gray-900 dark:text-white truncate">{value}</div>
      {subtitle && <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mt-2 truncate">{subtitle}</div>}
    </div>
  );
}

