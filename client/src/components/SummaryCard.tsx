import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow p-4 border">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-2">{subtitle}</div>}
    </div>
  );
}

