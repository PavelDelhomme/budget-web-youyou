import { useState } from 'react';
import { TemporaryIncome, MonthlyIncomeAdjustment } from '../../core/types';
import { currency, parseAmount, today } from '../../lib/utils';

interface MonthlyIncomeAdjustmentsProps {
  income: TemporaryIncome;
  currentYear: number;
  onUpdate: (income: TemporaryIncome) => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MonthlyIncomeAdjustments({
  income,
  currentYear,
  onUpdate,
}: MonthlyIncomeAdjustmentsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState<{
    month: number;
    amount: string;
    note: string;
  }>({
    month: new Date().getMonth() + 1,
    amount: '',
    note: '',
  });

  const adjustments = income.monthlyAdjustments || [];

  function handleAddAdjustment() {
    if (!newAdjustment.amount) return;
    
    const amount = parseAmount(newAdjustment.amount);
    if (amount <= 0) return;

    const adjustment: MonthlyIncomeAdjustment = {
      year: currentYear,
      month: newAdjustment.month,
      amount,
      note: newAdjustment.note || undefined,
    };

    const updatedIncome: TemporaryIncome = {
      ...income,
      monthlyAdjustments: [...adjustments, adjustment],
    };

    onUpdate(updatedIncome);
    setNewAdjustment({ month: new Date().getMonth() + 1, amount: '', note: '' });
    setIsAdding(false);
  }

  function handleRemoveAdjustment(year: number, month: number) {
    const updatedIncome: TemporaryIncome = {
      ...income,
      monthlyAdjustments: adjustments.filter(
        adj => !(adj.year === year && adj.month === month)
      ),
    };
    onUpdate(updatedIncome);
  }

  const currentMonthAdjustments = adjustments.filter(adj => adj.year === currentYear);

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
          🔧 Ajustements mensuels pour {currentYear}
        </h5>
        {!isAdding && income.duration === 'permanent' && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Ajouter un ajustement mensuel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-600">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mois
              </label>
              <select
                value={newAdjustment.month}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, month: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nouveau montant (€)
              </label>
              <input
                type="text"
                value={newAdjustment.amount}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                placeholder={currency(income.amount)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optionnel)
            </label>
            <input
              type="text"
              value={newAdjustment.note}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, note: e.target.value })}
              placeholder="Ex: Ajustement Pôle Emploi"
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddAdjustment}
              disabled={!newAdjustment.amount}
              className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewAdjustment({ month: new Date().getMonth() + 1, amount: '', note: '' });
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {currentMonthAdjustments.length > 0 && (
        <div className="space-y-1">
          {currentMonthAdjustments.map((adj, idx) => (
            <div
              key={`${adj.year}-${adj.month}`}
              className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 text-xs"
            >
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {MONTH_NAMES[adj.month - 1]}:
                </span>
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {currency(adj.amount)} (au lieu de {currency(income.amount)})
                </span>
                {adj.note && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    - {adj.note}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemoveAdjustment(adj.year, adj.month)}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Supprimer l'ajustement"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {currentMonthAdjustments.length === 0 && !isAdding && income.duration === 'permanent' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Aucun ajustement. Cliquez sur l'icône ➕ pour ajouter une exception mensuelle.
        </p>
      )}
    </div>
  );
}

