import React, { useState } from 'react';
import { Expense, Category } from '../types';
import { toISODate, parseAmount, currency, today } from '../utils';

interface ExpensesSectionProps {
  expenses: Expense[];
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
}

export function ExpensesSection({
  expenses,
  categories,
  onAddExpense,
  onRemoveExpense,
}: ExpensesSectionProps) {
  const [date, setDate] = useState(toISODate(today));
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories[0]?.id || ''
  );
  const [note, setNote] = useState('');

  const handleAdd = () => {
    const amt = parseAmount(amount);
    if (!amt) return;
    onAddExpense({
      date: date || toISODate(today),
      amount: amt,
      categoryId,
      note,
    });
    setAmount('');
    setNote('');
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Ajouter une dépense variable</h2>
      <div className="grid md:grid-cols-5 gap-3">
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Montant (€)</label>
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Ex: 50,00 ou 50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Catégorie</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-slate-600 dark:text-gray-400">Note</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ex: courses, concert, achat..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-xl bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          onClick={handleAdd}
        >
          Ajouter
        </button>
      </div>
      {expenses.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Catégorie</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2 pr-4">Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{toISODate(e.date)}</td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">
                    {categories.find((c) => c.id === e.categoryId)?.name || '—'}
                  </td>
                  <td className="py-2 pr-4 max-w-[300px] truncate text-gray-900 dark:text-white" title={e.note}>
                    {e.note}
                  </td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(e.amount)}</td>
                  <td className="py-2 pr-2 text-right">
                    <button
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      onClick={() => onRemoveExpense(e.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

