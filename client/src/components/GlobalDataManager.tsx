import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { BankAccount, Investment, SavingsGoal, UserGlobalData } from '../types';
import { currency, parseAmount, toISODate, today } from '../utils';

interface GlobalDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  globalData: UserGlobalData;
  onUpdate: (data: Partial<UserGlobalData>) => Promise<void>;
}

export function GlobalDataManager({ isOpen, onClose, globalData, onUpdate }: GlobalDataManagerProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'investments' | 'goals'>('accounts');
  
  // Bank Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>(globalData.bankAccounts || []);
  const [currentAccount, setCurrentAccount] = useState({
    name: '',
    currentBalance: 0,
    accountType: 'checking' as 'checking' | 'savings' | 'pocket',
  });
  
  // Investments state
  const [investments, setInvestments] = useState<Investment[]>(globalData.investments || []);
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
  const [currentGoal, setCurrentGoal] = useState({
    name: '',
    type: 'minimum' as 'minimum' | 'precaution' | 'project',
    targetAmount: 0,
    currentAmount: 0,
    priority: 1,
  });

  // Update local state when globalData changes
  React.useEffect(() => {
    setAccounts(globalData.bankAccounts || []);
    setInvestments(globalData.investments || []);
    setSavingsGoals(globalData.savingsGoals || []);
  }, [globalData]);

  function addAccount() {
    if (!currentAccount.name) return;
    setAccounts([
      ...accounts,
      {
        id: crypto.randomUUID(),
        ...currentAccount,
      },
    ]);
    setCurrentAccount({ name: '', currentBalance: 0, accountType: 'checking' });
  }

  function removeAccount(id: string) {
    setAccounts(accounts.filter(acc => acc.id !== id));
  }

  function addInvestment() {
    if (!currentInvestment.name || !currentInvestment.platform) return;
    setInvestments([
      ...investments,
      {
        id: crypto.randomUUID(),
        ...currentInvestment,
      },
    ]);
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

  function removeInvestment(id: string) {
    setInvestments(investments.filter(inv => inv.id !== id));
  }

  function addGoal() {
    if (!currentGoal.name || currentGoal.targetAmount === 0) return;
    setSavingsGoals([
      ...savingsGoals,
      {
        id: crypto.randomUUID(),
        ...currentGoal,
      },
    ]);
    setCurrentGoal({
      name: '',
      type: 'minimum',
      targetAmount: 0,
      currentAmount: 0,
      priority: 1,
    });
  }

  function removeGoal(id: string) {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
  }

  async function handleSave() {
    await onUpdate({
      bankAccounts: accounts,
      investments: investments,
      savingsGoals: savingsGoals,
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
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💳 Comptes ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'investments'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Investissements ({investments.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'goals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Objectifs ({savingsGoals.length})
          </button>
        </div>

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="border p-4 rounded-lg space-y-2">
              <label className="block text-sm font-medium">Nom du compte</label>
              <input
                type="text"
                value={currentAccount.name}
                onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
                placeholder="Ex: Revolut, Compte principal"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Solde actuel (€)</label>
              <input
                type="text"
                value={currentAccount.currentBalance || ''}
                onChange={(e) =>
                  setCurrentAccount({ ...currentAccount, currentBalance: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1234,56 ou 1234.56"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Type de compte</label>
              <select
                value={currentAccount.accountType}
                onChange={(e) =>
                  setCurrentAccount({ ...currentAccount, accountType: e.target.value as any })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="checking">Compte courant</option>
                <option value="savings">Épargne</option>
                <option value="pocket">Poche (Revolut)</option>
              </select>

              <button
                onClick={addAccount}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Comptes :</h4>
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{acc.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({acc.accountType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{currency(acc.currentBalance)}</span>
                      <button
                        onClick={() => removeAccount(acc.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <strong>Total : {currency(totalAccounts)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div className="space-y-4">
            <div className="border p-4 rounded-lg space-y-2">
              <label className="block text-sm font-medium">Type</label>
              <select
                value={currentInvestment.type}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="stocks">Bourse</option>
                <option value="crypto">Crypto</option>
                <option value="other">Autre</option>
              </select>

              <label className="block text-sm font-medium">Nom</label>
              <input
                type="text"
                value={currentInvestment.name}
                onChange={(e) => setCurrentInvestment({ ...currentInvestment, name: e.target.value })}
                placeholder="Ex: ETF World, Bitcoin"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Plateforme</label>
              <input
                type="text"
                value={currentInvestment.platform}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, platform: e.target.value })
                }
                placeholder="Ex: Revolut, Binance"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Valeur actuelle totale de vos actifs (€)</label>
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
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Contribution mensuelle (€) <span className="text-gray-500 text-xs">(optionnel)</span></label>
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
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Montant initial investi (€)</label>
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
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Date de début d'investissement</label>
              <input
                type="date"
                value={currentInvestment.startDate}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    startDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded"
              />

              <button
                onClick={addInvestment}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>

            {investments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Investissements :</h4>
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
                    <div key={inv.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{inv.name}</span>
                          <span className="text-sm text-gray-600 ml-2">({inv.platform})</span>
                          {startDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Début: {startDate.toLocaleDateString('fr-FR')} • {monthsActive} mois actifs
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeInvestment(inv.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 text-xs">Valeur actuelle:</span>
                          <div className="font-semibold">{currency(inv.currentValue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Total investi:</span>
                          <div className="font-semibold">{currency(totalInvested)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Bénéfice/Perte:</span>
                          <div className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{currency(profit)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Rendement:</span>
                          <div className={`font-semibold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <strong>Total valeur actuelle : {currency(totalInvestments)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="border p-4 rounded-lg space-y-2">
              <label className="block text-sm font-medium">Nom</label>
              <input
                type="text"
                value={currentGoal.name}
                onChange={(e) => setCurrentGoal({ ...currentGoal, name: e.target.value })}
                placeholder="Ex: Épargne de précaution"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Type</label>
              <select
                value={currentGoal.type}
                onChange={(e) => setCurrentGoal({ ...currentGoal, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="minimum">Épargne minimale</option>
                <option value="precaution">Épargne de précaution</option>
                <option value="project">Projet</option>
              </select>

              <label className="block text-sm font-medium">Montant cible (€)</label>
              <input
                type="text"
                value={currentGoal.targetAmount || ''}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, targetAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 5000,00 ou 5000.00"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Montant actuel (€)</label>
              <input
                type="text"
                value={currentGoal.currentAmount || ''}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, currentAmount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1000,00 ou 1000.00"
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block text-sm font-medium">Priorité (1 = plus important)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentGoal.priority}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, priority: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border rounded"
              />

              <button
                onClick={addGoal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>

            {savingsGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Objectifs :</h4>
                {savingsGoals.map((goal) => (
                  <div key={goal.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-sm text-gray-600">{goal.type}</div>
                        <div className="text-sm">
                          {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✅ Enregistrer les modifications
          </button>
        </div>
      </div>
    </Modal>
  );
}

