import React from 'react';
import { BudgetSuggestion } from '../types';
import { currency } from '../utils';

interface BudgetSuggestionsProps {
  suggestions: BudgetSuggestion[];
  onApply?: (suggestionId: string) => void;
}

export function BudgetSuggestions({ suggestions, onApply }: BudgetSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Suggestions d'amélioration</h2>
        <p className="text-gray-500 text-center py-8">
          Aucune suggestion pour le moment. Vos habitudes de dépenses semblent équilibrées !
        </p>
      </div>
    );
  }

  function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Suggestions d'amélioration</h2>
      <p className="text-sm text-gray-600 mb-4">
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
                  <h3 className="font-semibold">{suggestion.category}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      suggestion.priority === 'high'
                        ? 'bg-red-200'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-200'
                        : 'bg-blue-200'
                    }`}
                  >
                    {suggestion.priority === 'high'
                      ? 'Priorité haute'
                      : suggestion.priority === 'medium'
                      ? 'Priorité moyenne'
                      : 'Priorité basse'}
                  </span>
                </div>
                <p className="text-sm mb-2">{suggestion.reason}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Actuel: <strong>{currency(suggestion.currentValue)}</strong>
                  </span>
                  <span>→</span>
                  <span>
                    Suggéré: <strong>{currency(suggestion.suggestedValue)}</strong>
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
                  className="ml-4 px-3 py-1 bg-white rounded hover:bg-gray-50 text-sm font-medium"
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

