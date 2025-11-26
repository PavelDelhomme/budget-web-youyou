import React, { useState, useEffect, useMemo } from 'react';
import { currency, parseAmount } from '../utils';
import { SavingsTransaction, TemporaryIncome } from '../types';

interface IncomeAndSavingsSectionProps {
  monthlySalary: number;
  currentSavings: number;
  savingsTransactions: SavingsTransaction[];
  onSalaryChange: (salary: number) => void;
  onSavingsChange: (savings: number) => void;
  onAddTransaction: (amount: number, note: string) => void;
  onRemoveTransaction: (id: string) => void;
  annualIncome: number;
  projectedSavings: number;
  temporaryIncomes?: TemporaryIncome[]; // Revenus supplémentaires
  currentYear?: number; // Pour calculer les revenus actifs
}

export function IncomeAndSavingsSection({
  monthlySalary,
  currentSavings,
  savingsTransactions,
  onSalaryChange,
  onSavingsChange,
  onAddTransaction,
  onRemoveTransaction,
  annualIncome,
  projectedSavings,
  temporaryIncomes = [],
  currentYear,
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

  // Calculer les revenus temporaires sur plusieurs mois
  const temporaryMultiMonthIncomes = useMemo(() => {
    return activeTemporaryIncomes
      .filter(inc => inc.duration === 'months')
      .reduce((sum, inc) => sum + (inc.amount * (inc.numberOfMonths || 1)), 0);
  }, [activeTemporaryIncomes]);

  // Calculer l'épargne projetée par mois
  const monthlyProjectedSavings = useMemo(() => {
    const monthlyExpenses = annualIncome > 0 ? (annualIncome - projectedSavings) / 12 : 0;
    return totalMonthlyIncome - monthlyExpenses;
  }, [annualIncome, projectedSavings, totalMonthlyIncome]);
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

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseAmount(salaryInput);
    if (salary >= 0) {
      onSalaryChange(salary);
      setIsEditingSalary(false);
    }
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
      onAddTransaction(amount, transactionNote.trim());
      setTransactionAmount('');
      setTransactionNote('');
      setShowTransactionForm(false);
    }
  };

  const totalWithdrawn = savingsTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalAdded = savingsTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
      <h2 className="text-xl font-semibold">Revenus & Épargne</h2>

      {/* Income Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Revenu mensuel principal</label>
          {!isEditingSalary ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currency(monthlySalary)}</span>
              <button
                onClick={() => setIsEditingSalary(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✏️
              </button>
            </div>
          ) : (
            <form onSubmit={handleSalarySubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="border rounded-lg px-3 py-1 w-32"
                placeholder="Ex: 2000,00"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black text-white rounded-lg text-sm"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingSalary(false);
                  setSalaryInput(monthlySalary.toString());
                }}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                ✕
              </button>
            </form>
          )}
        </div>

        {/* Revenus supplémentaires permanents */}
        {activeTemporaryIncomes.filter(inc => inc.duration === 'permanent').length > 0 && (
          <div className="pl-4 border-l-2 border-blue-200 space-y-2">
            <p className="text-xs font-medium text-gray-600">Revenus permanents (mensuels) :</p>
            {activeTemporaryIncomes
              .filter(inc => inc.duration === 'permanent')
              .map(inc => (
                <div key={inc.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{inc.name}</span>
                  <span className="font-medium">{currency(inc.amount)}/mois</span>
                </div>
              ))}
          </div>
        )}

        {/* Revenu mensuel total */}
        {activeTemporaryIncomes.filter(inc => inc.duration === 'permanent').length > 0 && (
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Revenu mensuel total :</span>
              <span className="text-lg font-bold text-blue-900">{currency(totalMonthlyIncome)}/mois</span>
            </div>
          </div>
        )}

        {/* Revenus ponctuels */}
        {oneTimeIncomes > 0 && (
          <div className="bg-green-50 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-900">Revenus ponctuels cette année :</span>
              <span className="text-lg font-bold text-green-900">+{currency(oneTimeIncomes)}</span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              {activeTemporaryIncomes
                .filter(inc => inc.duration === 'once')
                .map(inc => inc.name)
                .join(', ')}
            </div>
          </div>
        )}

        {/* Revenus temporaires multi-mois */}
        {temporaryMultiMonthIncomes > 0 && (
          <div className="bg-purple-50 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-900">Revenus temporaires :</span>
              <span className="text-lg font-bold text-purple-900">{currency(temporaryMultiMonthIncomes)}</span>
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {activeTemporaryIncomes
                .filter(inc => inc.duration === 'months')
                .map(inc => `${inc.name} (${inc.numberOfMonths} mois × ${currency(inc.amount)})`)
                .join(', ')}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 border-t pt-2">
          <strong>Revenu annuel total :</strong> <span className="font-medium">{currency(annualIncome)}</span>
          {annualIncome > monthlySalary * 12 && (
            <span className="text-green-600 ml-2">
              (salaire: {currency(monthlySalary * 12)} + autres: {currency(annualIncome - (monthlySalary * 12))})
            </span>
          )}
        </p>
      </div>

      {/* Current Savings Section */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Épargne actuelle</label>
          {!isEditingSavings ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currency(currentSavings)}</span>
              <button
                onClick={() => setIsEditingSavings(true)}
                className="text-gray-400 hover:text-gray-600"
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
                className="border rounded-lg px-3 py-1 w-32"
                placeholder="Ex: 5000,00"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black text-white rounded-lg text-sm"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingSavings(false);
                  setSavingsInput(currentSavings.toString());
                }}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                ✕
              </button>
            </form>
          )}
        </div>

        {/* Savings Help */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-blue-900">
              <strong>Épargne projetée en fin d'année :</strong>
            </p>
            <span className="text-lg font-bold text-blue-900">{currency(projectedSavings)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-blue-200 pt-2">
            <p className="text-xs text-blue-700">
              <strong>Épargne mensuelle moyenne :</strong>
            </p>
            <span className="text-sm font-semibold text-blue-900">{currency(monthlyProjectedSavings)}/mois</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {projectedSavings > currentSavings
              ? `Vous pourriez épargner ${currency(projectedSavings - currentSavings)} de plus cette année.`
              : projectedSavings < currentSavings
              ? `Attention : vous pourriez dépenser ${currency(currentSavings - projectedSavings)} de votre épargne.`
              : 'Votre épargne devrait rester stable.'}
          </p>
        </div>
      </div>

      {/* Savings Transactions */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Mouvements d'épargne</h3>
          <button
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
          >
            {showTransactionForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {showTransactionForm && (
          <form onSubmit={handleAddTransaction} className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Montant</label>
              <input
                type="text"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Ex: 100,00 ou -50,00 (positif pour ajouter, négatif pour retirer)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Note</label>
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                placeholder="Ex: Retrait pour vacances"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-3 py-2 bg-black text-white rounded-lg text-sm"
            >
              Ajouter
            </button>
          </form>
        )}

        {savingsTransactions.length > 0 && (
          <div className="space-y-2">
            {savingsTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        t.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}{currency(t.amount)}
                    </span>
                    <span className="text-gray-600">{t.note}</span>
                  </div>
                  <span className="text-xs text-gray-500">{t.date}</span>
                </div>
                <button
                  onClick={() => onRemoveTransaction(t.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex justify-between text-xs text-gray-600 pt-2 border-t">
              <span>Total ajouté: {currency(totalAdded)}</span>
              <span>Total retiré: {currency(totalWithdrawn)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

