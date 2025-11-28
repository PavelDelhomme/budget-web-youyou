// Component for displaying budget suggestions
import { BudgetSuggestion } from '../types';
import { currency } from '../utils';

interface BudgetSuggestionsProps {
  suggestions: BudgetSuggestion[];
  onApply?: (suggestionId: string) => void;
}

export function BudgetSuggestions({ suggestions, onApply }: BudgetSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Suggestions d'amélioration</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Aucune suggestion pour le moment. Vos habitudes de dépenses semblent équilibrées !
        </p>
      </div>
    );
  }

  function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  }

  function getTypeIcon(type: 'reduce' | 'increase' | 'optimize'): string {
    switch (type) {
      case 'reduce':
        return '⬇️';
      case 'increase':
        return '⬆️';
      case 'optimize':
        return '⚙️';
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Suggestions d'amélioration</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Analyse basée sur vos habitudes de dépenses historiques
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{suggestion.category}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      suggestion.priority === 'high'
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600'
                        : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600'
                    }`}
                  >
                    {suggestion.priority === 'high'
                      ? 'Priorité haute'
                      : suggestion.priority === 'medium'
                      ? 'Priorité moyenne'
                      : 'Priorité basse'}
                  </span>
                </div>
                <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">{suggestion.reason}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Actuel: <strong className="text-gray-900 dark:text-white">{currency(suggestion.currentValue)}</strong>
                  </span>
                  <span>→</span>
                  <span>
                    Suggéré: <strong className="text-gray-900 dark:text-white">{currency(suggestion.suggestedValue)}</strong>
                  </span>
                  <span className="text-xs">
                    (
                    {suggestion.suggestedValue > suggestion.currentValue ? '+' : ''}
                    {currency(suggestion.suggestedValue - suggestion.currentValue)})
                  </span>
                </div>
              </div>
              {onApply && (
                <button
                  onClick={() => onApply(suggestion.id)}
                  className="ml-4 px-3 py-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 transition-colors"
                >
                  Appliquer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

