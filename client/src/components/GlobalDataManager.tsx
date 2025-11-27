import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { BankAccount, Investment, SavingsGoal, SavingsProject, SalaryHistory, UserGlobalData } from '../types';
import { currency, parseAmount, toISODate, today } from '../utils';

interface GlobalDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  globalData: UserGlobalData;
  onUpdate: (data: Partial<UserGlobalData>) => Promise<void>;
}

export function GlobalDataManager({ isOpen, onClose, globalData, onUpdate }: GlobalDataManagerProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'investments' | 'goals' | 'projects' | 'salaryHistory'>('accounts');
  
  // Bank Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>(globalData.bankAccounts || []);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState({
    name: '',
    currentBalance: 0,
    accountType: 'checking' as 'checking' | 'savings' | 'pocket',
  });
  
  // Investments state
  const [investments, setInvestments] = useState<Investment[]>(globalData.investments || []);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [currentInvestment, setCurrentInvestment] = useState({
    type: 'stocks' as 'stocks' | 'crypto' | 'other',
    name: '',
    platform: '',
    currentValue: 0,
    monthlyContribution: 0,
    initialAmount: 0,
    startDate: toISODate(today),
  });
  
  // Savings Goals state
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(globalData.savingsGoals || []);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [currentGoal, setCurrentGoal] = useState({
    name: '',
    type: 'minimum' as 'minimum' | 'precaution' | 'project',
    targetAmount: 0,
    currentAmount: 0,
    priority: 1,
  });

  // Savings Projects state
  const [savingsProjects, setSavingsProjects] = useState<SavingsProject[]>(globalData.savingsProjects || []);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    monthlyContribution: 0,
  });

  // Salary History state
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>(globalData.salaryHistory || []);
  const [editingSalaryHistoryId, setEditingSalaryHistoryId] = useState<string | null>(null);
  const [currentSalaryHistory, setCurrentSalaryHistory] = useState({
    amount: 0,
    startDate: toISODate(today),
    endDate: '',
    type: 'salary' as 'salary' | 'unemployment' | 'freelance' | 'other',
    note: '',
  });

  // Update local state when globalData changes
  React.useEffect(() => {
    setAccounts(globalData.bankAccounts || []);
    setInvestments(globalData.investments || []);
    setSavingsGoals(globalData.savingsGoals || []);
    setSavingsProjects(globalData.savingsProjects || []);
    setSalaryHistory(globalData.salaryHistory || []);
  }, [globalData]);

  function addAccount() {
    if (!currentAccount.name) return;
    if (editingAccountId) {
      // Modifier le compte existant
      setAccounts(accounts.map(acc => 
        acc.id === editingAccountId 
          ? { ...acc, ...currentAccount }
          : acc
      ));
      setEditingAccountId(null);
    } else {
      // Ajouter un nouveau compte
      setAccounts([
        ...accounts,
        {
          id: crypto.randomUUID(),
          ...currentAccount,
        },
      ]);
    }
    setCurrentAccount({ name: '', currentBalance: 0, accountType: 'checking' });
  }

  function editAccount(account: BankAccount) {
    setCurrentAccount({
      name: account.name,
      currentBalance: account.currentBalance,
      accountType: account.accountType,
    });
    setEditingAccountId(account.id);
  }

  function cancelEditAccount() {
    setCurrentAccount({ name: '', currentBalance: 0, accountType: 'checking' });
    setEditingAccountId(null);
  }

  function removeAccount(id: string) {
    setAccounts(accounts.filter(acc => acc.id !== id));
    if (editingAccountId === id) {
      cancelEditAccount();
    }
  }

  function addInvestment() {
    if (!currentInvestment.name || !currentInvestment.platform) return;
    if (editingInvestmentId) {
      // Modifier l'investissement existant
      setInvestments(investments.map(inv => 
        inv.id === editingInvestmentId 
          ? { ...inv, ...currentInvestment }
          : inv
      ));
      setEditingInvestmentId(null);
    } else {
      // Ajouter un nouvel investissement
      setInvestments([
        ...investments,
        {
          id: crypto.randomUUID(),
          ...currentInvestment,
        },
      ]);
    }
    setCurrentInvestment({
      type: 'stocks',
      name: '',
      platform: '',
      currentValue: 0,
      monthlyContribution: 0,
      initialAmount: 0,
      startDate: toISODate(today),
    });
  }

  function editInvestment(investment: Investment) {
    setCurrentInvestment({
      type: investment.type,
      name: investment.name,
      platform: investment.platform,
      currentValue: investment.currentValue,
      monthlyContribution: investment.monthlyContribution,
      initialAmount: investment.initialAmount,
      startDate: investment.startDate,
    });
    setEditingInvestmentId(investment.id);
  }

  function cancelEditInvestment() {
    setCurrentInvestment({
      type: 'stocks',
      name: '',
      platform: '',
      currentValue: 0,
      monthlyContribution: 0,
      initialAmount: 0,
      startDate: toISODate(today),
    });
    setEditingInvestmentId(null);
  }

  function removeInvestment(id: string) {
    setInvestments(investments.filter(inv => inv.id !== id));
    if (editingInvestmentId === id) {
      cancelEditInvestment();
    }
  }

  function addGoal() {
    if (!currentGoal.name || currentGoal.targetAmount === 0) return;
    if (editingGoalId) {
      // Modifier l'objectif existant
      setSavingsGoals(savingsGoals.map(goal => 
        goal.id === editingGoalId 
          ? { ...goal, ...currentGoal }
          : goal
      ));
      setEditingGoalId(null);
    } else {
      // Ajouter un nouvel objectif
      setSavingsGoals([
        ...savingsGoals,
        {
          id: crypto.randomUUID(),
          ...currentGoal,
        },
      ]);
    }
    setCurrentGoal({
      name: '',
      type: 'minimum',
      targetAmount: 0,
      currentAmount: 0,
      priority: 1,
    });
  }

  function editGoal(goal: SavingsGoal) {
    setCurrentGoal({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      priority: goal.priority,
    });
    setEditingGoalId(goal.id);
  }

  function cancelEditGoal() {
    setCurrentGoal({
      name: '',
      type: 'minimum',
      targetAmount: 0,
      currentAmount: 0,
      priority: 1,
    });
    setEditingGoalId(null);
  }

  function removeGoal(id: string) {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
    if (editingGoalId === id) {
      cancelEditGoal();
    }
  }

  function addProject() {
    if (!currentProject.name || !currentProject.targetDate || currentProject.targetAmount === 0) return;
    if (editingProjectId) {
      // Modifier le projet existant
      setSavingsProjects(savingsProjects.map(project => 
        project.id === editingProjectId 
          ? { ...project, ...currentProject }
          : project
      ));
      setEditingProjectId(null);
    } else {
      // Ajouter un nouveau projet
      setSavingsProjects([
        ...savingsProjects,
        {
          id: crypto.randomUUID(),
          ...currentProject,
        },
      ]);
    }
    setCurrentProject({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      monthlyContribution: 0,
    });
  }

  function editProject(project: SavingsProject) {
    setCurrentProject({
      name: project.name,
      targetAmount: project.targetAmount,
      currentAmount: project.currentAmount,
      targetDate: project.targetDate,
      monthlyContribution: project.monthlyContribution,
    });
    setEditingProjectId(project.id);
  }

  function cancelEditProject() {
    setCurrentProject({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      monthlyContribution: 0,
    });
    setEditingProjectId(null);
  }

  function removeProject(id: string) {
    setSavingsProjects(savingsProjects.filter(project => project.id !== id));
    if (editingProjectId === id) {
      cancelEditProject();
    }
  }

  function addSalaryHistory() {
    if (!currentSalaryHistory.amount || !currentSalaryHistory.startDate) return;
    if (editingSalaryHistoryId) {
      // Modifier l'entrée existante
      setSalaryHistory(salaryHistory.map(sh => 
        sh.id === editingSalaryHistoryId 
          ? { ...sh, ...currentSalaryHistory }
          : sh
      ));
      setEditingSalaryHistoryId(null);
    } else {
      // Ajouter une nouvelle entrée
      setSalaryHistory([
        ...salaryHistory,
        {
          id: crypto.randomUUID(),
          ...currentSalaryHistory,
          endDate: currentSalaryHistory.endDate || undefined,
          note: currentSalaryHistory.note || undefined,
        },
      ]);
    }
    setCurrentSalaryHistory({
      amount: 0,
      startDate: toISODate(today),
      endDate: '',
      type: 'salary',
      note: '',
    });
  }

  function editSalaryHistory(history: SalaryHistory) {
    setCurrentSalaryHistory({
      amount: history.amount,
      startDate: history.startDate,
      endDate: history.endDate || '',
      type: history.type,
      note: history.note || '',
    });
    setEditingSalaryHistoryId(history.id);
  }

  function cancelEditSalaryHistory() {
    setCurrentSalaryHistory({
      amount: 0,
      startDate: toISODate(today),
      endDate: '',
      type: 'salary',
      note: '',
    });
    setEditingSalaryHistoryId(null);
  }

  function removeSalaryHistory(id: string) {
    setSalaryHistory(salaryHistory.filter(sh => sh.id !== id));
    if (editingSalaryHistoryId === id) {
      cancelEditSalaryHistory();
    }
  }

  async function handleSave() {
    await onUpdate({
      bankAccounts: accounts,
      investments: investments,
      savingsGoals: savingsGoals,
      savingsProjects: savingsProjects,
      salaryHistory: salaryHistory,
    });
    onClose();
  }

  if (!isOpen) return null;

  const totalAccounts = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Gérer mes données globales" closeable>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            💳 Comptes ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'investments'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📈 Investissements ({investments.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'goals'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🎯 Objectifs ({savingsGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🚀 Projets ({savingsProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('salaryHistory')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'salaryHistory'
                ? 'border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            💼 Historique salaires ({salaryHistory.length})
          </button>
        </div>

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-700/30">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom du compte</label>
              <input
                type="text"
                value={currentAccount.name}
                onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
                placeholder="Ex: Revolut, Compte principal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Solde actuel (€)</label>
              <input
                type="text"
                value={currentAccount.currentBalance || ''}
                onChange={(e) =>
                  setCurrentAccount({ ...currentAccount, currentBalance: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1234,56 ou 1234.56"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type de compte</label>
              <select
                value={currentAccount.accountType}
                onChange={(e) =>
                  setCurrentAccount({ ...currentAccount, accountType: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="checking">Compte courant</option>
                <option value="savings">Épargne</option>
                <option value="pocket">Poche (Revolut)</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={addAccount}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingAccountId ? 'Modifier' : 'Ajouter'}
                </button>
                {editingAccountId && (
                  <button
                    onClick={cancelEditAccount}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Comptes :</h4>
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{acc.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({acc.accountType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{currency(acc.currentBalance)}</span>
                      <button
                        onClick={() => editAccount(acc)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeAccount(acc.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white">Total : {currency(totalAccounts)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-700/30">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
              <select
                value={currentInvestment.type}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="stocks">Bourse</option>
                <option value="crypto">Crypto</option>
                <option value="other">Autre</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom</label>
              <input
                type="text"
                value={currentInvestment.name}
                onChange={(e) => setCurrentInvestment({ ...currentInvestment, name: e.target.value })}
                placeholder="Ex: ETF World, Bitcoin"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Plateforme</label>
              <input
                type="text"
                value={currentInvestment.platform}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, platform: e.target.value })
                }
                placeholder="Ex: Revolut, Binance"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Valeur actuelle totale de vos actifs (€)</label>
              <input
                type="text"
                value={currentInvestment.currentValue || ''}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    currentValue: parseAmount(e.target.value) || 0,
                  })
                }
                placeholder="Ex: 1234,56 ou 1234.56"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Contribution mensuelle (€) <span className="text-gray-500 dark:text-gray-400 text-xs">(optionnel)</span></label>
              <input
                type="text"
                value={currentInvestment.monthlyContribution === 0 ? '' : currentInvestment.monthlyContribution.toString().replace('.', ',')}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    monthlyContribution: parseAmount(e.target.value),
                  })
                }
                placeholder="Ex: 20,00 ou laissez vide si aucun versement régulier"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant initial investi (€)</label>
              <input
                type="text"
                value={currentInvestment.initialAmount || ''}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    initialAmount: parseAmount(e.target.value) || 0,
                  })
                }
                placeholder="Ex: 500,00 ou 500.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début d'investissement</label>
              <input
                type="date"
                value={currentInvestment.startDate}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    startDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

              <div className="flex gap-2">
                <button
                  onClick={addInvestment}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingInvestmentId ? 'Modifier' : 'Ajouter'}
                </button>
                {editingInvestmentId && (
                  <button
                    onClick={cancelEditInvestment}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {investments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Investissements :</h4>
                {investments.map((inv) => {
                  // Calculer les statistiques d'investissement
                  const startDate = inv.startDate ? new Date(inv.startDate) : null;
                  const monthsActive = startDate ? 
                    Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + 
                               (today.getMonth() - startDate.getMonth())) : 0;
                  const totalInvested = inv.initialAmount + (inv.monthlyContribution * monthsActive);
                  const profit = inv.currentValue - totalInvested;
                  const returnPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
                  
                  return (
                    <div key={inv.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{inv.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({inv.platform})</span>
                          {startDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Début: {startDate.toLocaleDateString('fr-FR')} • {monthsActive} mois actifs
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editInvestment(inv)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeInvestment(inv.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Valeur actuelle:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">{currency(inv.currentValue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Total investi:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">{currency(totalInvested)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Bénéfice/Perte:</span>
                          <div className={`font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}{currency(profit)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Rendement:</span>
                          <div className={`font-semibold ${returnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white">Total valeur actuelle : {currency(totalInvestments)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-700/30">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom</label>
              <input
                type="text"
                value={currentGoal.name}
                onChange={(e) => setCurrentGoal({ ...currentGoal, name: e.target.value })}
                placeholder="Ex: Épargne de précaution"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
              <select
                value={currentGoal.type}
                onChange={(e) => setCurrentGoal({ ...currentGoal, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="minimum">Épargne minimale</option>
                <option value="precaution">Épargne de précaution</option>
                <option value="project">Projet</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant cible (€)</label>
              <input
                type="text"
                value={currentGoal.targetAmount || ''}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, targetAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 5000,00 ou 5000.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant actuel (€)</label>
              <input
                type="text"
                value={currentGoal.currentAmount || ''}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, currentAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1000,00 ou 1000.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Priorité (1 = plus important)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentGoal.priority}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, priority: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

              <div className="flex gap-2">
                <button
                  onClick={addGoal}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingGoalId ? 'Modifier' : 'Ajouter'}
                </button>
                {editingGoalId && (
                  <button
                    onClick={cancelEditGoal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {savingsGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Objectifs :</h4>
                {savingsGoals.map((goal) => (
                  <div key={goal.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{goal.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{goal.type}</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editGoal(goal)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-700/30">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom du projet</label>
              <input
                type="text"
                value={currentProject.name}
                onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                placeholder="Ex: Vacances, Voiture, Maison"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant cible (€)</label>
              <input
                type="text"
                value={currentProject.targetAmount || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, targetAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 5000,00 ou 5000.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant actuel (€)</label>
              <input
                type="text"
                value={currentProject.currentAmount || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, currentAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1000,00 ou 1000.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date cible</label>
              <input
                type="date"
                value={currentProject.targetDate}
                onChange={(e) => setCurrentProject({ ...currentProject, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Contribution mensuelle (€) <span className="text-gray-500 text-xs">(optionnel)</span></label>
              <input
                type="text"
                value={currentProject.monthlyContribution || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, monthlyContribution: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 200,00 ou 200.00 ou laissez vide"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <div className="flex gap-2">
                <button
                  onClick={addProject}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingProjectId ? 'Modifier' : 'Ajouter'}
                </button>
                {editingProjectId && (
                  <button
                    onClick={cancelEditProject}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {savingsProjects.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Projets :</h4>
                {savingsProjects.map((project) => {
                  const targetDate = new Date(project.targetDate);
                  const now = new Date();
                  const monthsRemaining = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + 
                    (targetDate.getMonth() - now.getMonth()));
                  const progress = project.targetAmount > 0 ? (project.currentAmount / project.targetAmount) * 100 : 0;
                  
                  return (
                    <div key={project.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Objectif: {currency(project.targetAmount)} • Date: {targetDate.toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {currency(project.currentAmount)} / {currency(project.targetAmount)} ({progress.toFixed(1)}%)
                          </div>
                          {project.monthlyContribution > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Contribution: {currency(project.monthlyContribution)}/mois • {monthsRemaining} mois restants
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editProject(project)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeProject(project.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Salary History Tab */}
        {activeTab === 'salaryHistory' && (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-700/30">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Enregistrez vos changements de salaire (changement de travail, promotion, etc.) pour un suivi dans le temps.
              </p>
              
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type de revenu</label>
              <select
                value={currentSalaryHistory.type}
                onChange={(e) => setCurrentSalaryHistory({ ...currentSalaryHistory, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="salary">Salaire</option>
                <option value="unemployment">Allocation chômage</option>
                <option value="freelance">Freelance</option>
                <option value="other">Autre</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant mensuel (€)</label>
              <input
                type="text"
                value={currentSalaryHistory.amount || ''}
                onChange={(e) =>
                  setCurrentSalaryHistory({ ...currentSalaryHistory, amount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 2500,00 ou 2500.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début</label>
              <input
                type="date"
                value={currentSalaryHistory.startDate}
                onChange={(e) => setCurrentSalaryHistory({ ...currentSalaryHistory, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de fin <span className="text-gray-500 text-xs">(optionnel - laissez vide si toujours actif)</span></label>
              <input
                type="date"
                value={currentSalaryHistory.endDate}
                onChange={(e) => setCurrentSalaryHistory({ ...currentSalaryHistory, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Note <span className="text-gray-500 text-xs">(optionnel)</span></label>
              <input
                type="text"
                value={currentSalaryHistory.note}
                onChange={(e) => setCurrentSalaryHistory({ ...currentSalaryHistory, note: e.target.value })}
                placeholder="Ex: Nouveau travail chez X, Promotion, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <div className="flex gap-2">
                <button
                  onClick={addSalaryHistory}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  {editingSalaryHistoryId ? 'Modifier' : 'Ajouter'}
                </button>
                {editingSalaryHistoryId && (
                  <button
                    onClick={cancelEditSalaryHistory}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {salaryHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Historique :</h4>
                {salaryHistory
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map((history) => {
                    const startDate = new Date(history.startDate);
                    const endDate = history.endDate ? new Date(history.endDate) : null;
                    const isActive = !endDate || endDate >= today;
                    
                    return (
                      <div key={history.id} className={`p-3 rounded border ${
                        isActive 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {currency(history.amount)}/mois
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                history.type === 'salary' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                history.type === 'unemployment' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                history.type === 'freelance' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {history.type === 'salary' ? 'Salaire' :
                                 history.type === 'unemployment' ? 'Chômage' :
                                 history.type === 'freelance' ? 'Freelance' : 'Autre'}
                              </span>
                              {isActive && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  Actif
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Du {startDate.toLocaleDateString('fr-FR')} 
                              {endDate ? ` au ${endDate.toLocaleDateString('fr-FR')}` : ' (toujours actif)'}
                            </div>
                            {history.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {history.note}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editSalaryHistory(history)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removeSalaryHistory(history.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            ✅ Enregistrer les modifications
          </button>
        </div>
      </div>
    </Modal>
  );
}

