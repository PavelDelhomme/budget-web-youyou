import { useState } from 'react';
import { currency, parseAmount } from '../../lib/utils';
import { MonthlyAdditionalIncome } from '../../core/types';

interface AdditionalMonthlyIncomesProps {
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[];
  onUpdate: (incomes: MonthlyAdditionalIncome[]) => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function AdditionalMonthlyIncomes({
  additionalMonthlyIncomes = [],
  onUpdate,
}: AdditionalMonthlyIncomesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentIncome, setCurrentIncome] = useState<{
    name: string;
    amount: string;
    month: number;
    note: string;
  }>({
    name: '',
    amount: '',
    month: 1,
    note: '',
  });

  function handleAdd() {
    if (!currentIncome.name.trim() || !currentIncome.amount.trim()) return;

    const amount = parseAmount(currentIncome.amount);
    if (amount <= 0) return;

    const newIncome: MonthlyAdditionalIncome = {
      id: crypto.randomUUID(),
      name: currentIncome.name.trim(),
      amount,
      month: currentIncome.month,
      note: currentIncome.note.trim() || undefined,
    };

    onUpdate([...additionalMonthlyIncomes, newIncome]);
    setCurrentIncome({ name: '', amount: '', month: 1, note: '' });
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    onUpdate(additionalMonthlyIncomes.filter(inc => inc.id !== id));
  }

  function handleEdit(income: MonthlyAdditionalIncome) {
    setCurrentIncome({
      name: income.name,
      amount: income.amount.toString().replace('.', ','),
      month: income.month,
      note: income.note || '',
    });
    handleRemove(income.id);
    setIsAdding(true);
  }

  // Grouper les revenus par mois
  const incomesByMonth = additionalMonthlyIncomes.reduce((acc, inc) => {
    if (!acc[inc.month]) acc[inc.month] = [];
    acc[inc.month].push(inc);
    return acc;
  }, {} as Record<number, MonthlyAdditionalIncome[]>);

  const totalAdditional = additionalMonthlyIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            🎁 Revenus supplémentaires par mois (primes, cadeaux, etc.)
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Ajoutez des revenus supplémentaires qui s'ajoutent à votre revenu mensuel de base (primes, cadeaux de Noël, bonus, etc.)
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            title="Ajouter un revenu supplémentaire"
            aria-label="Ajouter un revenu supplémentaire"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du revenu
              </label>
              <input
                type="text"
                value={currentIncome.name}
                onChange={(e) => setCurrentIncome({ ...currentIncome, name: e.target.value })}
                placeholder="Ex: Prime de Noël, Cadeau, Bonus..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant (€)
              </label>
              <input
                type="text"
                value={currentIncome.amount}
                onChange={(e) => setCurrentIncome({ ...currentIncome, amount: e.target.value })}
                placeholder="0,00"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mois
              </label>
              <select
                value={currentIncome.month}
                onChange={(e) => setCurrentIncome({ ...currentIncome, month: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                Note (optionnel)
              </label>
              <input
                type="text"
                value={currentIncome.note}
                onChange={(e) => setCurrentIncome({ ...currentIncome, note: e.target.value })}
                placeholder="Note..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={!currentIncome.name.trim() || !currentIncome.amount.trim()}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setCurrentIncome({ name: '', amount: '', month: 1, note: '' });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {additionalMonthlyIncomes.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Total des revenus supplémentaires :</strong> {currency(totalAdditional)}
          </div>
          <div className="space-y-2">
            {Object.entries(incomesByMonth).map(([monthStr, incomes]) => {
              const month = parseInt(monthStr);
              const monthTotal = incomes.reduce((sum, inc) => sum + inc.amount, 0);
              return (
                <div
                  key={month}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                      {MONTH_NAMES[month - 1]}
                    </h5>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{currency(monthTotal)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {incomes.map((income) => (
                      <div
                        key={income.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {income.name}
                          </div>
                          {income.note && (
                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                              {income.note}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {currency(income.amount)}
                          </span>
                          <button
                            onClick={() => handleEdit(income)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemove(income.id)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {additionalMonthlyIncomes.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Aucun revenu supplémentaire défini. Cliquez sur "Ajouter" pour en ajouter un.
        </p>
      )}
    </div>
  );
}

