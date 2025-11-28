import { useState, useEffect } from 'react';
import { currency, parseAmount } from '../utils';

interface VariableMonthlyIncomesProps {
  monthlySalary: number; // Salaire de base
  variableMonthlyIncomes?: number[]; // [janvier, février, ..., décembre]
  onUpdate: (variableMonthlyIncomes: number[] | undefined) => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function VariableMonthlyIncomes({
  monthlySalary,
  variableMonthlyIncomes,
  onUpdate,
}: VariableMonthlyIncomesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyValues, setMonthlyValues] = useState<string[]>(() => {
    if (variableMonthlyIncomes && variableMonthlyIncomes.length === 12) {
      return variableMonthlyIncomes.map(v => v === monthlySalary ? '' : v.toString().replace('.', ','));
    }
    return Array(12).fill('');
  });

  // Mettre à jour les valeurs quand variableMonthlyIncomes change
  useEffect(() => {
    if (variableMonthlyIncomes && variableMonthlyIncomes.length === 12) {
      setMonthlyValues(
        variableMonthlyIncomes.map(v => v === monthlySalary ? '' : v.toString().replace('.', ','))
      );
    } else {
      setMonthlyValues(Array(12).fill(''));
    }
  }, [variableMonthlyIncomes, monthlySalary]);

  function handleSave() {
    const hasVariables = monthlyValues.some(v => v.trim() !== '');
    
    if (!hasVariables) {
      onUpdate(undefined);
      setIsEditing(false);
      return;
    }

    // Créer un tableau de 12 mois : si vide, utiliser monthlySalary, sinon la valeur
    const incomes = monthlyValues.map((value) => {
      const trimmed = value.trim();
      if (trimmed === '') {
        return monthlySalary;
      }
      const parsed = parseAmount(trimmed);
      return parsed > 0 ? parsed : monthlySalary;
    });

    onUpdate(incomes);
    setIsEditing(false);
  }

  function handleCancel() {
    // Restaurer les valeurs
    if (variableMonthlyIncomes && variableMonthlyIncomes.length === 12) {
      setMonthlyValues(
        variableMonthlyIncomes.map(v => v === monthlySalary ? '' : v.toString().replace('.', ','))
      );
    } else {
      setMonthlyValues(Array(12).fill(''));
    }
    setIsEditing(false);
  }

  function clearAll() {
    setMonthlyValues(Array(12).fill(''));
    onUpdate(undefined);
    setIsEditing(false);
  }

  const hasVariables = variableMonthlyIncomes && variableMonthlyIncomes.some((v) => v !== monthlySalary);
  const totalVariable = variableMonthlyIncomes 
    ? variableMonthlyIncomes.reduce((sum, v) => sum + v, 0)
    : monthlySalary * 12;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            💰 Revenus mensuels variables (primes, variations)
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Définissez des revenus différents par mois si votre revenu principal varie. Si un mois n'est pas modifié, le revenu mensuel principal est utilisé par défaut.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            {hasVariables ? 'Modifier' : 'Configurer'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MONTH_NAMES.map((monthName, index) => (
              <div key={index} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {monthName}
                </label>
                <input
                  type="text"
                  value={monthlyValues[index]}
                  onChange={(e) => {
                    const newValues = [...monthlyValues];
                    newValues[index] = e.target.value;
                    setMonthlyValues(newValues);
                  }}
                  placeholder={currency(monthlySalary)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Base: {currency(monthlySalary)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-blue-200 dark:border-blue-700">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
            >
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm"
            >
              Annuler
            </button>
            {hasVariables && (
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 transition-colors text-sm"
              >
                Effacer tout
              </button>
            )}
          </div>
        </div>
      ) : hasVariables ? (
        <div className="space-y-2">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Revenus annuels avec variations :</strong> {currency(totalVariable)}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {MONTH_NAMES.map((monthName, index) => {
              const value = variableMonthlyIncomes![index];
              const isDifferent = value !== monthlySalary;
              return (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    isDifferent
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-100 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-xs">{monthName}</div>
                  <div className={`font-semibold ${isDifferent ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {currency(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Tous les mois utilisent le revenu de base : {currency(monthlySalary)}/mois
        </p>
      )}
    </div>
  );
}

