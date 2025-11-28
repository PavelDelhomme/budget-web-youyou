import { useState } from 'react';
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

  // Note: toggleMonthlyTargets available for future use but not currently called in UI
  // const toggleMonthlyTargets = (categoryId: string) => {
  //   const category = categories.find(c => c.id === categoryId);
  //   if (!category) return;
  //   
  //   if (category.monthlyTargets) {
  //     // Désactiver les budgets mensuels -> revenir au budget annuel simple
  //     const annualTotal = category.monthlyTargets.reduce((sum, val) => sum + val, 0);
  //     onUpsertCategory(categoryId, { 
  //       monthlyTargets: undefined,
  //       target: annualTotal || category.target 
  //     });
  //   } else {
  //     // Activer les budgets mensuels avec le budget annuel divisé par 12
  //     const monthlyAmount = category.target > 0 ? category.target / 12 : 0;
  //     onUpsertCategory(categoryId, { 
  //       monthlyTargets: Array(12).fill(monthlyAmount),
  //       target: category.target || (monthlyAmount * 12)
  //     });
  //   }
  // };
  
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
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Catégories variables & cibles</h2>
        <button
          className="px-4 py-2 rounded-xl bg-black dark:bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          onClick={onAddCategory}
        >
          + Ajouter une catégorie
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {categories.map((c) => {
          // Par défaut, on affiche en mode mensuel
          // On est en mode annuel simple SEULEMENT si monthlyTargets est explicitement undefined
          // Sinon, on est toujours en mode mensuel
          const isAnnualSimpleMode = c.monthlyTargets === undefined && c.target > 0;
          const isExpanded = expandedCategory === c.id;
          
          // Pour l'affichage, utiliser les monthlyTargets existants ou créer virtuellement depuis le target annuel
          const effectiveMonthlyTargets = c.monthlyTargets || Array(12).fill(c.target > 0 ? c.target / 12 : 0);
          
          return (
            <div
              key={c.id}
              className="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <input
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={c.name}
                  onChange={(e) => onUpsertCategory(c.id, { name: e.target.value })}
                  placeholder="Nom de la catégorie"
                />
                {!defaultCategories.some((d) => d.id === c.id) && (
                  <button
                    className="ml-2 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
              <div className="text-xs text-slate-600 dark:text-gray-400 mb-3">
                Dépensé: <span className="font-medium text-gray-900 dark:text-white">{currency(variableSpentByCat[c.id] || 0)}</span> · 
                Reste: <span className="font-medium text-gray-900 dark:text-white">{currency(variableRemainingByCat[c.id] || 0)}</span>
              </div>

              {/* Budget Configuration */}
              <div className="space-y-2">
                {!isAnnualSimpleMode ? (
                  // Budgets mensuels (par défaut maintenant)
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-gray-300">Budgets mensuels:</label>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => setExpandedCategory(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? 'Masquer' : 'Voir'} détails
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          onClick={() => {
                            // Passer au mode annuel simple
                            const annualTotal = effectiveMonthlyTargets.reduce((sum, val) => sum + val, 0);
                            onUpsertCategory(c.id, {
                              monthlyTargets: undefined,
                              target: annualTotal || c.target
                            });
                          }}
                          title="Passer au budget annuel simple"
                        >
                          Annuel simple
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="grid grid-cols-3 gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {monthNames.map((month, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="text-xs text-slate-600 dark:text-gray-400">{month}</label>
                            <input
                              type="text"
                              className="w-full bg-slate-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              value={(effectiveMonthlyTargets[idx] === 0 ? '' : effectiveMonthlyTargets[idx].toString().replace('.', ','))}
                              onChange={(e) => {
                                // Si on modifie, s'assurer que monthlyTargets existe vraiment dans la catégorie
                                if (!c.monthlyTargets) {
                                  // Initialiser avec les valeurs actuelles (virtuelles ou existantes)
                                  const newMonthlyTargets = [...effectiveMonthlyTargets];
                                  newMonthlyTargets[idx] = parseAmount(e.target.value) || 0;
                                  const annualTotal = newMonthlyTargets.reduce((sum, val) => sum + val, 0);
                                  onUpsertCategory(c.id, {
                                    monthlyTargets: newMonthlyTargets,
                                    target: annualTotal
                                  });
                                } else {
                                  updateMonthlyTarget(c.id, idx, e.target.value);
                                }
                              }}
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-700 dark:text-gray-300">Total annuel:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-300">
                        {currency(effectiveMonthlyTargets.reduce((sum, val) => sum + val, 0))}€
                      </span>
                    </div>
                  </div>
                ) : (
                  // Budget annuel simple (optionnel maintenant)
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 dark:text-gray-400 whitespace-nowrap">Budget annuel:</label>
                    <input
                      type="text"
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      value={c.target === 0 ? '' : c.target.toString().replace('.', ',')}
                      onChange={(e) =>
                        onUpsertCategory(c.id, { target: parseAmount(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-500 dark:text-gray-500">€/an</span>
                    <button
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      onClick={() => {
                        // Activer le mode mensuel avec le budget annuel divisé par 12
                        const monthlyAmount = c.target > 0 ? c.target / 12 : 0;
                        onUpsertCategory(c.id, {
                          monthlyTargets: Array(12).fill(monthlyAmount),
                          target: c.target || (monthlyAmount * 12)
                        });
                      }}
                      title="Définir des budgets mensuels (recommandé)"
                    >
                      📅 Par mois
                    </button>
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

