import React, { useState } from 'react';
import { Category } from '../types';
import { currency, defaultCategories, parseAmount } from '../utils';

interface CategoriesSectionProps {
  categories: Category[];
  variableSpentByCat: Record<string, number>;
  variableRemainingByCat: Record<string, number>;
  onUpsertCategory: (id: string, patch: Partial<Category>) => void;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
  hasExpensesInCategory: (categoryId: string) => boolean;
}

export function CategoriesSection({
  categories,
  variableSpentByCat,
  variableRemainingByCat,
  onUpsertCategory,
  onAddCategory,
  onRemoveCategory,
  hasExpensesInCategory,
}: CategoriesSectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const toggleMonthlyTargets = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (category.monthlyTargets) {
      // Désactiver les budgets mensuels
      const annualTotal = category.monthlyTargets.reduce((sum, val) => sum + val, 0);
      onUpsertCategory(categoryId, { 
        monthlyTargets: undefined,
        target: annualTotal || category.target 
      });
    } else {
      // Activer les budgets mensuels avec le budget annuel divisé par 12
      const monthlyAmount = category.target / 12;
      onUpsertCategory(categoryId, { 
        monthlyTargets: Array(12).fill(monthlyAmount) 
      });
    }
  };

  const updateMonthlyTarget = (categoryId: string, monthIndex: number, value: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.monthlyTargets) return;
    
    const newMonthlyTargets = [...category.monthlyTargets];
    newMonthlyTargets[monthIndex] = parseAmount(value) || 0;
    
    // Recalculer le target annuel total
    const annualTotal = newMonthlyTargets.reduce((sum, val) => sum + val, 0);
    
    onUpsertCategory(categoryId, { 
      monthlyTargets: newMonthlyTargets,
      target: annualTotal 
    });
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Catégories variables & cibles</h2>
        <button
          className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={onAddCategory}
        >
          + Ajouter une catégorie
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {categories.map((c) => {
          const hasMonthlyTargets = !!c.monthlyTargets;
          const isExpanded = expandedCategory === c.id;
          
          return (
            <div
              key={c.id}
              className="border rounded-2xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <input
                  className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-medium"
                  value={c.name}
                  onChange={(e) => onUpsertCategory(c.id, { name: e.target.value })}
                  placeholder="Nom de la catégorie"
                />
                {!defaultCategories.some((d) => d.id === c.id) && (
                  <button
                    className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    onClick={() => {
                      if (hasExpensesInCategory(c.id)) {
                        alert("Supprimez ou réaffectez d'abord les dépenses de cette catégorie.");
                        return;
                      }
                      onRemoveCategory(c.id);
                    }}
                    title="Supprimer cette catégorie"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="text-xs text-slate-600 mb-3">
                Dépensé: <span className="font-medium">{currency(variableSpentByCat[c.id] || 0)}</span> · 
                Reste: <span className="font-medium">{currency(variableRemainingByCat[c.id] || 0)}</span>
              </div>

              {/* Budget Configuration */}
              <div className="space-y-2">
                {!hasMonthlyTargets ? (
                  // Budget annuel simple
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 whitespace-nowrap">Budget annuel:</label>
                    <input
                      type="text"
                      className="flex-1 bg-white border rounded-lg px-2 py-1.5 text-sm"
                      value={c.target === 0 ? '' : c.target.toString().replace('.', ',')}
                      onChange={(e) =>
                        onUpsertCategory(c.id, { target: parseAmount(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-500">€/an</span>
                    <button
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => toggleMonthlyTargets(c.id)}
                      title="Définir des budgets mensuels différents"
                    >
                      📅 Par mois
                    </button>
                  </div>
                ) : (
                  // Budgets mensuels
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700">Budgets mensuels:</label>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          onClick={() => setExpandedCategory(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? 'Masquer' : 'Voir'} détails
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          onClick={() => toggleMonthlyTargets(c.id)}
                          title="Revenir au budget annuel simple"
                        >
                          Annuel simple
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-lg border">
                        {monthNames.map((month, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="text-xs text-slate-600">{month}</label>
                            <input
                              type="text"
                              className="w-full bg-slate-50 border rounded px-1.5 py-1 text-xs"
                              value={c.monthlyTargets?.[idx] === 0 ? '' : (c.monthlyTargets?.[idx] || 0).toString().replace('.', ',')}
                              onChange={(e) => updateMonthlyTarget(c.id, idx, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs bg-blue-50 rounded-lg p-2">
                      <span className="text-slate-700">Total annuel:</span>
                      <span className="font-semibold text-blue-900">
                        {currency(c.monthlyTargets?.reduce((sum, val) => sum + val, 0) || c.target)}€
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

