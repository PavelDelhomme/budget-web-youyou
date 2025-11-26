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
    <section className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
      <h2 className="font-semibold text-lg">
        Abonnements (dépenses fixes mensuelles)
      </h2>
      <div className="grid md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-sm text-slate-600">Nom</label>
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="ex: Spotify, Assurance, Téléphone"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Mensuel (€)</label>
          <input
            type="number"
            className="w-full border rounded-xl px-3 py-2"
            placeholder="0.00"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Débute (mois)</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full border rounded-xl px-3 py-2"
            value={startMonth}
            onChange={(e) => setStartMonth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Se termine (mois)</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full border rounded-xl px-3 py-2"
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
          />
          <label htmlFor="ongoing" className="text-sm text-slate-700">
            En cours toute l'année
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl bg-black text-white"
          onClick={handleAdd}
        >
          Ajouter l'abonnement
        </button>
      </div>
      {subs.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
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
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-4">{s.name}</td>
                    <td className="py-2 pr-4">{currency(s.monthly)}</td>
                    <td className="py-2 pr-4">{monthsFull}</td>
                    <td className="py-2 pr-4">{currency(s.monthly * monthsFull)}</td>
                    <td className="py-2 pr-4">{currency(s.monthly * monthsToDate)}</td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        className="text-red-600"
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

