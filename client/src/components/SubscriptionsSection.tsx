import React, { useState } from 'react';
import { Subscription } from '../types';
import { parseAmount, currency } from '../utils';

interface SubscriptionsSectionProps {
  subs: Subscription[];
  monthNow: number;
  onAddSub: (sub: Omit<Subscription, 'id'>) => void;
  onRemoveSub: (id: string) => void;
  monthsOverlapFullYear: (s: Subscription) => number;
  monthsOverlapInYear: (s: Subscription, upToMonth: number) => number;
}

export function SubscriptionsSection({
  subs,
  monthNow,
  onAddSub,
  onRemoveSub,
  monthsOverlapFullYear,
  monthsOverlapInYear,
}: SubscriptionsSectionProps) {
  const [name, setName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [ongoing, setOngoing] = useState(false);

  const handleAdd = () => {
    const m = parseAmount(monthly);
    if (!m) return;
    const sm = Number(startMonth) || 1;
    const em = ongoing ? 12 : Number(endMonth) || 12;
    onAddSub({
      name: name || 'Abonnement',
      monthly: m,
      startMonth: sm,
      endMonth: em,
      ongoing,
    });
    setName('');
    setMonthly('');
    setStartMonth(1);
    setEndMonth(12);
    setOngoing(false);
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
        Abonnements (dépenses fixes mensuelles)
      </h2>
      <div className="grid md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-sm text-slate-600 dark:text-gray-400">Nom</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ex: Spotify, Assurance, Téléphone"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Mensuel (€)</label>
          <input
            type="number"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="0.00"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Débute (mois)</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={startMonth}
            onChange={(e) => setStartMonth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Se termine (mois)</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600"
            value={endMonth}
            onChange={(e) => setEndMonth(Number(e.target.value))}
            disabled={ongoing}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="ongoing"
            type="checkbox"
            checked={ongoing}
            onChange={(e) => setOngoing(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="ongoing" className="text-sm text-slate-700 dark:text-gray-300">
            En cours toute l'année
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          onClick={handleAdd}
        >
          Ajouter l'abonnement
        </button>
      </div>
      {subs.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Mensuel</th>
                <th className="py-2 pr-4">Mois actifs</th>
                <th className="py-2 pr-4">Total annuel</th>
                <th className="py-2 pr-4">Payé à date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const monthsFull = monthsOverlapFullYear(s);
                const monthsToDate = monthsOverlapInYear(s, monthNow);
                return (
                  <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{s.name}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{currency(s.monthly)}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{monthsFull}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(s.monthly * monthsFull)}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(s.monthly * monthsToDate)}</td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        onClick={() => onRemoveSub(s.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

