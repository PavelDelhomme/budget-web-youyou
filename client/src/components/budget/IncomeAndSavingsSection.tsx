import React, { useState, useEffect, useMemo } from 'react';
import { currency, parseAmount, today } from '../../lib/utils';
import { SavingsTransaction, SavingsProject, TemporaryIncome, MonthlyAdditionalIncome, MonthlyIncomeSource } from '../../core/types';
import { VariableMonthlyIncomes } from '../income/VariableMonthlyIncomes';
import { AdditionalMonthlyIncomes } from '../income/AdditionalMonthlyIncomes';
import { MultipleMonthlyIncomes } from '../income/MultipleMonthlyIncomes';

interface IncomeAndSavingsSectionProps {
  monthlySalary: number;
  currentSavings: number;
  savingsTransactions: SavingsTransaction[];
  onSalaryChange: (salary: number) => void;
  onSavingsChange: (savings: number) => void;
  onAddTransaction: (amount: number, note: string) => void;
  onRemoveTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, amount: number, note: string) => void;
  annualIncome: number;
  projectedSavings: number;
  temporaryIncomes?: TemporaryIncome[]; // Revenus supplémentaires
  savingsProjects?: SavingsProject[]; // Projets d'épargne
  variableMonthlyIncomes?: number[]; // Revenus variables par mois
  onVariableMonthlyIncomesChange?: (incomes: number[] | undefined) => void;
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[]; // Revenus supplémentaires par mois (primes, cadeaux, etc.)
  onAdditionalMonthlyIncomesChange?: (incomes: MonthlyAdditionalIncome[]) => void;
  monthlyIncomeSources?: MonthlyIncomeSource[]; // Sources de revenus mensuels multiples (intérim, plusieurs emplois)
  onMonthlyIncomeSourcesChange?: (sources: MonthlyIncomeSource[]) => void;
  currentYear?: number; // Pour calculer les revenus actifs
  onOpenTaxManager?: () => void; // Ouvrir le gestionnaire fiscal
  onOpenAdvancedFiscal?: () => void; // Ouvrir le gestionnaire fiscal avancé
  globalMonthlySalary?: number; // Revenu mensuel global pour indication de la source
  yearSpecificSalary?: number; // Revenu mensuel spécifique à l'année (undefined si utilise le global)
  isFromSalaryHistory?: boolean; // Indique si le revenu vient de l'historique des salaires
}

export function IncomeAndSavingsSection({
  monthlySalary,
  currentSavings,
  savingsTransactions,
  onSalaryChange,
  onSavingsChange,
  onAddTransaction,
  onRemoveTransaction,
  onUpdateTransaction,
  annualIncome,
  projectedSavings,
  temporaryIncomes = [],
  savingsProjects = [],
  variableMonthlyIncomes,
  onVariableMonthlyIncomesChange,
  additionalMonthlyIncomes = [],
  onAdditionalMonthlyIncomesChange,
  monthlyIncomeSources = [],
  onMonthlyIncomeSourcesChange,
  currentYear,
  onOpenTaxManager,
  globalMonthlySalary,
  yearSpecificSalary,
  isFromSalaryHistory,
}: IncomeAndSavingsSectionProps) {
  // Calculer les revenus supplémentaires actifs pour l'année
  const activeTemporaryIncomes = useMemo(() => {
    if (!currentYear) return [];
    
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    return temporaryIncomes.filter(income => {
      const startDate = new Date(income.startDate);
      const endDate = income.endDate ? new Date(income.endDate) : null;
      
      // Pour les revenus permanents, vérifier si l'année est après la date de début
      if (income.duration === 'permanent') {
        return startDate <= yearEnd;
      }
      
      // Pour les revenus temporaires, vérifier si l'année chevauche la période
      if (income.duration === 'months' || income.duration === 'once') {
        if (endDate) {
          return startDate <= yearEnd && endDate >= yearStart;
        }
        return startDate <= yearEnd;
      }
      
      return false;
    });
  }, [temporaryIncomes, currentYear]);

  // Calculer le revenu mensuel total (revenu principal + revenus permanents)
  const totalMonthlyIncome = useMemo(() => {
    const permanentMonthly = activeTemporaryIncomes
      .filter(inc => inc.duration === 'permanent')
      .reduce((sum, inc) => sum + inc.amount, 0);
    return monthlySalary + permanentMonthly;
  }, [monthlySalary, activeTemporaryIncomes]);

  // Calculer les revenus ponctuels de l'année
  const oneTimeIncomes = useMemo(() => {
    return activeTemporaryIncomes
      .filter(inc => inc.duration === 'once')
      .reduce((sum, inc) => sum + inc.amount, 0);
  }, [activeTemporaryIncomes]);

  // Calculer les revenus temporaires sur plusieurs mois (uniquement les mois actifs dans l'année)
  // Prend en compte les ajustements mensuels si disponibles
  const temporaryMultiMonthIncomes = useMemo(() => {
    if (!currentYear) return 0;
    
    return activeTemporaryIncomes
      .filter(inc => inc.duration === 'months')
      .reduce((sum, inc) => {
        const startDate = new Date(inc.startDate);
        const endDate = inc.endDate ? new Date(inc.endDate) : null;
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);
        
        if (!endDate) return sum;
        
        // Calculer les mois actifs dans l'année
        const effectiveStart = startDate < yearStart ? yearStart : startDate;
        const effectiveEnd = endDate > yearEnd ? yearEnd : endDate;
        
        if (effectiveStart > effectiveEnd) return sum;
        
        // Calculer le revenu pour chaque mois actif dans l'année
        let totalForYear = 0;
        const current = new Date(effectiveStart);
        
        while (current <= effectiveEnd) {
          const month = current.getMonth() + 1; // 1-12
          
          // Vérifier s'il y a un ajustement mensuel pour ce mois
          const adjustment = inc.monthlyAdjustments?.find(
            adj => adj.year === currentYear && adj.month === month
          );
          
          if (adjustment) {
            totalForYear += adjustment.amount;
          } else {
            totalForYear += inc.amount;
          }
          
          // Passer au mois suivant
          current.setMonth(current.getMonth() + 1);
        }
        
        return sum + totalForYear;
      }, 0);
  }, [activeTemporaryIncomes, currentYear]);

  // Calculer l'épargne mensuelle moyenne
  // projectedSavings = épargne actuelle + (revenus annuels - dépenses annuelles)
  // L'épargne mensuelle moyenne = épargne projetée totale en fin d'année / 12 mois
  // Exemple : si projectedSavings = 6000€, alors monthlyProjectedSavings = 500€/mois
  // Cela représente la moyenne mensuelle sur toute l'année pour atteindre l'épargne projetée
  // Note: Le calcul prend en compte l'état actuel car projectedSavings inclut déjà currentSavings
  // et la différence (annualIncome - annualExpenses) représente ce qui sera épargné d'ici fin d'année
  const monthlyProjectedSavings = useMemo(() => {
    if (projectedSavings === 0) return 0;
    // L'épargne mensuelle moyenne est l'épargne totale projetée divisée par 12
    // Cela donne la moyenne mensuelle nécessaire sur toute l'année
    // Exemple : 6000€ en fin d'année = 500€/mois en moyenne
    return projectedSavings / 12;
  }, [projectedSavings]);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [salaryInput, setSalaryInput] = useState(monthlySalary.toString());
  const [savingsInput, setSavingsInput] = useState(currentSavings.toString());

  // Update inputs when props change (when year changes)
  useEffect(() => {
    if (!isEditingSalary) {
      setSalaryInput(monthlySalary.toString());
    }
  }, [monthlySalary, isEditingSalary]);

  useEffect(() => {
    if (!isEditingSavings) {
      setSavingsInput(currentSavings.toString());
    }
  }, [currentSavings, isEditingSavings]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [salaryEditMode, setSalaryEditMode] = useState<'keep' | 'change' | 'revaluation' | null>(null);

  // Vérifier si c'est une année future
  const isFutureYear = currentYear ? currentYear > today.getFullYear() : false;
  // Vérifier si le salaire de cette année n'est pas encore défini (utilise le salaire global/historique)
  const isSalaryNotDefined = yearSpecificSalary === undefined && !isFromSalaryHistory;

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseAmount(salaryInput);
    if (salary >= 0) {
      onSalaryChange(salary);
      setIsEditingSalary(false);
      setSalaryEditMode(null);
    }
  };

  const handleKeepSameSalary = () => {
    // Reprendre le même salaire que l'année actuelle
    const currentSalary = monthlySalary;
    if (currentSalary >= 0) {
      onSalaryChange(currentSalary);
      setIsEditingSalary(false);
      setSalaryEditMode(null);
    }
  };

  const handleStartEditSalary = () => {
    if (isFutureYear && isSalaryNotDefined) {
      // Pour les années futures sans salaire défini, proposer les options
      setSalaryEditMode('change');
    } else {
      // Pour les années actuelles/passées ou avec salaire défini, mode édition directe
      setIsEditingSalary(true);
    }
  };

  const handleRevaluationMode = () => {
    setSalaryEditMode('revaluation');
    setIsEditingSalary(true);
    // Pré-remplir avec le salaire actuel pour faciliter la modification
    setSalaryInput(monthlySalary.toString());
  };

  const handleSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savings = parseAmount(savingsInput);
    onSavingsChange(savings);
    setIsEditingSavings(false);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(transactionAmount);
    if (amount !== 0 && transactionNote.trim()) {
      if (editingTransactionId && onUpdateTransaction) {
        // Modification d'une transaction existante
        onUpdateTransaction(editingTransactionId, amount, transactionNote.trim());
        setEditingTransactionId(null);
      } else {
        // Ajout d'une nouvelle transaction
        onAddTransaction(amount, transactionNote.trim());
      }
      setTransactionAmount('');
      setTransactionNote('');
      setShowTransactionForm(false);
    }
  };

  const handleEditTransaction = (transaction: SavingsTransaction) => {
    setEditingTransactionId(transaction.id);
    setTransactionAmount(transaction.amount.toString().replace('.', ','));
    setTransactionNote(transaction.note);
    setShowTransactionForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditTransaction = () => {
    setEditingTransactionId(null);
    setTransactionAmount('');
    setTransactionNote('');
    setShowTransactionForm(false);
  };

  const totalWithdrawn = savingsTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalAdded = savingsTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revenus & Épargne</h2>
        {onOpenTaxManager && (
          <button
            onClick={onOpenTaxManager}
            className="px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
            title="Calculer vos impôts et optimiser votre fiscalité"
          >
            💰 Impôts
          </button>
        )}
      </div>

      {/* Income Section */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenu mensuel principal</label>
              {yearSpecificSalary !== undefined ? (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  Spécifique à {currentYear}
                </span>
              ) : isFromSalaryHistory ? (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  Depuis historique salaires
                </span>
              ) : globalMonthlySalary !== undefined && globalMonthlySalary > 0 ? (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                  Depuis données globales
                </span>
              ) : null}
            </div>
            {!isEditingSalary && salaryEditMode === null ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{currency(monthlySalary)}</span>
                <button
                  onClick={handleStartEditSalary}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Modifier le revenu mensuel"
                >
                  ✏️
                </button>
              </div>
            ) : isFutureYear && isSalaryNotDefined && salaryEditMode === null ? (
              // Menu de sélection pour années futures sans salaire défini
              <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                  💡 Définir le revenu pour {currentYear} :
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleKeepSameSalary}
                    className="px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    title="Reprendre le même salaire"
                  >
                    ✓ Reprendre {currency(monthlySalary)}/mois
                  </button>
                  <button
                    onClick={() => {
                      setSalaryEditMode('change');
                      setIsEditingSalary(true);
                      setSalaryInput(monthlySalary.toString());
                    }}
                    className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    title="Changer le salaire"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={handleRevaluationMode}
                    className="px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                    title="Revalorisation"
                  >
                    📈 Revalorisation
                  </button>
                  <button
                    onClick={() => {
                      setSalaryEditMode(null);
                    }}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Annuler"
                  >
                    ✕ Annuler
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSalarySubmit} className="flex items-center gap-2 relative">
                {salaryEditMode === 'revaluation' && (
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 absolute -top-6 left-0">
                    💰 Saisissez le nouveau salaire après revalorisation
                  </div>
                )}
                <input
                  type="text"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder={salaryEditMode === 'revaluation' ? `Ex: ${Math.round(monthlySalary * 1.05)}` : "Ex: 2000,00"}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-black dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                  title="Valider"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingSalary(false);
                    setSalaryEditMode(null);
                    setSalaryInput(monthlySalary.toString());
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title="Annuler"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
          {yearSpecificSalary === undefined && globalMonthlySalary !== undefined && globalMonthlySalary > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Ce revenu provient de vos données globales ({currency(globalMonthlySalary)}/mois). 
              Vous pouvez le modifier ici pour cette année spécifique, ou modifier le revenu global dans "Mes données".
            </p>
          )}
        </div>

        {/* Revenus mensuels variables */}
        {onVariableMonthlyIncomesChange && currentYear && (
          <VariableMonthlyIncomes
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={variableMonthlyIncomes}
            onUpdate={onVariableMonthlyIncomesChange}
          />
        )}

        {/* Revenus supplémentaires par mois (primes, cadeaux, etc.) */}
        {onAdditionalMonthlyIncomesChange && currentYear && (
          <AdditionalMonthlyIncomes
            additionalMonthlyIncomes={additionalMonthlyIncomes}
            onUpdate={onAdditionalMonthlyIncomesChange}
          />
        )}

        {/* Sources de revenus multiples (intérim, plusieurs emplois) */}
        {onMonthlyIncomeSourcesChange && currentYear && (
          <MultipleMonthlyIncomes
            incomeSources={monthlyIncomeSources}
            onUpdate={onMonthlyIncomeSourcesChange}
            currentYear={currentYear}
          />
        )}

        {/* Revenus supplémentaires permanents */}
        {activeTemporaryIncomes.filter(inc => inc.duration === 'permanent').length > 0 && (
          <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-700 space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Revenus permanents (mensuels) :</p>
            {activeTemporaryIncomes
              .filter(inc => inc.duration === 'permanent')
              .map(inc => (
                <div key={inc.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{inc.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{currency(inc.amount)}/mois</span>
                </div>
              ))}
          </div>
        )}

        {/* Revenu mensuel total */}
        {activeTemporaryIncomes.filter(inc => inc.duration === 'permanent').length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Revenu mensuel total :</span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-300">{currency(totalMonthlyIncome)}/mois</span>
            </div>
          </div>
        )}

        {/* Revenus ponctuels */}
        {oneTimeIncomes > 0 && (
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-900 dark:text-green-300">Revenus ponctuels cette année :</span>
              <span className="text-lg font-bold text-green-900 dark:text-green-300">+{currency(oneTimeIncomes)}</span>
            </div>
            <div className="text-xs text-green-700 dark:text-green-400 mt-1">
              {activeTemporaryIncomes
                .filter(inc => inc.duration === 'once')
                .map(inc => inc.name)
                .join(', ')}
            </div>
          </div>
        )}

        {/* Revenus temporaires multi-mois */}
        {temporaryMultiMonthIncomes > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Revenus temporaires :</span>
              <span className="text-lg font-bold text-purple-900 dark:text-purple-300">{currency(temporaryMultiMonthIncomes)}</span>
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-400 mt-1 space-y-1">
              {activeTemporaryIncomes
                .filter(inc => inc.duration === 'months')
                .map(inc => {
                  const startDate = new Date(inc.startDate);
                  const endDate = inc.endDate ? new Date(inc.endDate) : null;
                  const yearStart = currentYear ? new Date(currentYear, 0, 1) : null;
                  const yearEnd = currentYear ? new Date(currentYear, 11, 31) : null;
                  
                  let monthsInYear = inc.numberOfMonths || 1;
                  if (yearStart && yearEnd && endDate) {
                    const effectiveStart = startDate < yearStart ? yearStart : startDate;
                    const effectiveEnd = endDate > yearEnd ? yearEnd : endDate;
                    if (effectiveStart <= effectiveEnd) {
                      monthsInYear = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 +
                                     (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1;
                    } else {
                      monthsInYear = 0;
                    }
                  }
                  
                  const typeLabel = inc.type === 'allocation' ? '🎯 Allocation' :
                                   inc.type === 'government_aid' ? '🏛️ Aide' :
                                   inc.type === 'bonus' ? '💰 Prime' :
                                   inc.type === 'gift' ? '🎁 Cadeau' : '📝 Autre';
                  
                  return (
                    <div key={inc.id} className="flex justify-between items-center">
                      <span>{typeLabel} {inc.name}</span>
                      <span className="font-medium">
                        {monthsInYear > 0 ? `${monthsInYear} mois × ${currency(inc.amount)}` : currency(0)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
          <strong className="text-gray-900 dark:text-white">Revenu annuel total :</strong> <span className="font-medium text-gray-900 dark:text-white">{currency(annualIncome)}</span>
          {annualIncome > monthlySalary * 12 && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              (salaire: {currency(monthlySalary * 12)} + autres: {currency(annualIncome - (monthlySalary * 12))})
            </span>
          )}
        </p>
      </div>

      {/* Current Savings Section */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Épargne actuelle</label>
          {!isEditingSavings ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{currency(currentSavings)}</span>
              <button
                onClick={() => setIsEditingSavings(true)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✏️
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavingsSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Ex: 5000,00"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingSavings(false);
                  setSavingsInput(currentSavings.toString());
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </form>
          )}
        </div>

        {/* Savings Help */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 space-y-2 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Épargne projetée en fin d'année :</strong>
            </p>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-300">{currency(projectedSavings)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-blue-200 dark:border-blue-700 pt-2">
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>Épargne mensuelle moyenne :</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 italic mt-0.5">
                ({currency(projectedSavings)} projetés en fin d'année ÷ 12 = moyenne mensuelle)
              </p>
            </div>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">{currency(monthlyProjectedSavings)}/mois</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            {projectedSavings > currentSavings
              ? `Vous pourriez épargner ${currency(projectedSavings - currentSavings)} de plus cette année.`
              : projectedSavings < currentSavings
              ? `Attention : vous pourriez dépenser ${currency(currentSavings - projectedSavings)} de votre épargne.`
              : 'Votre épargne devrait rester stable.'}
          </p>
        </div>
      </div>

      {/* Savings Transactions */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mouvements d'épargne</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ajoutez un montant positif pour épargner, négatif pour retirer (ex: -50,00 pour un imprévu)
            </p>
          </div>
          <button
            onClick={() => {
              if (showTransactionForm) {
                handleCancelEditTransaction();
              } else {
                setShowTransactionForm(true);
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          >
            {showTransactionForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {showTransactionForm && (
          <form onSubmit={handleAddTransaction} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            {editingTransactionId && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                ✏️ Modification d'une transaction
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Montant</label>
              <input
                type="text"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Ex: 100,00 ou -50,00 (positif pour ajouter, négatif pour retirer)"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Note</label>
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                placeholder="Ex: Retrait pour vacances"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-3 py-2 bg-black dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
            >
              {editingTransactionId ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        )}

        {savingsTransactions.length > 0 && (
          <div className="space-y-2">
            {savingsTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}{currency(t.amount)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{t.note}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{t.date}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTransaction(t)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onRemoveTransaction(t.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total ajouté: {currency(totalAdded)}</span>
              <span>Total retiré: {currency(totalWithdrawn)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Savings Projects */}
      {savingsProjects.length > 0 && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">🎯 Mes projets d'épargne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savingsProjects.map((project) => {
              const targetDate = new Date(project.targetDate);
              const now = new Date();
              const monthsRemaining = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + 
                (targetDate.getMonth() - now.getMonth()));
              const progress = project.targetAmount > 0 ? (project.currentAmount / project.targetAmount) * 100 : 0;
              const neededPerMonth = monthsRemaining > 0 ? 
                (project.targetAmount - project.currentAmount) / monthsRemaining : 0;
              
              return (
                <div key={project.id} className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{project.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Objectif: {currency(project.targetAmount)} • {targetDate.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {currency(project.currentAmount)} / {currency(project.targetAmount)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                    </div>
                    {monthsRemaining > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {monthsRemaining} mois restants • {currency(neededPerMonth)}/mois nécessaires
                      </div>
                    )}
                    {project.monthlyContribution > 0 && (
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        Contribution: {currency(project.monthlyContribution)}/mois
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

