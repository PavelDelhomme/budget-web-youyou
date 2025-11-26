import React, { useState, useMemo } from 'react';
import { BankAccount, Investment } from '../types';
import { currency, parseAmount, toISODate, today } from '../utils';

interface AssetsTrackingProps {
  bankAccounts: BankAccount[];
  investments: Investment[];
  onUpdateAccounts: (accounts: BankAccount[]) => void;
  onUpdateInvestments: (investments: Investment[]) => void;
}

export function AssetsTracking({
  bankAccounts,
  investments,
  onUpdateAccounts,
  onUpdateInvestments,
}: AssetsTrackingProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'investments'>('accounts');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);

  const [newAccount, setNewAccount] = useState({
    name: '',
    currentBalance: 0,
    accountType: 'checking' as 'checking' | 'savings' | 'pocket',
  });

  const [newInvestment, setNewInvestment] = useState({
    type: 'stocks' as 'stocks' | 'crypto' | 'other',
    name: '',
    platform: '',
    currentValue: 0,
    monthlyContribution: 0,
    initialAmount: 0,
    startDate: toISODate(today),
  });

  function addAccount() {
    if (!newAccount.name) return;
    const account: BankAccount = {
      id: crypto.randomUUID(),
      ...newAccount,
    };
    onUpdateAccounts([...bankAccounts, account]);
    setNewAccount({ name: '', currentBalance: 0, accountType: 'checking' });
    setIsAddingAccount(false);
  }

  function removeAccount(id: string) {
    onUpdateAccounts(bankAccounts.filter((acc) => acc.id !== id));
  }

  function updateAccount(id: string, updates: Partial<BankAccount>) {
    onUpdateAccounts(
      bankAccounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  }

  // Fonction pour calculer le total investi (initial + contributions mensuelles)
  const calculateTotalInvested = (investment: Investment): number => {
    if (!investment.startDate) {
      return investment.initialAmount;
    }
    
    const startDate = new Date(investment.startDate);
    const now = today;
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                      (now.getMonth() - startDate.getMonth());
    const monthsActive = Math.max(0, monthsDiff);
    
    return investment.initialAmount + (investment.monthlyContribution * monthsActive);
  };

  // Fonction pour calculer le bénéfice/rendement
  const calculateInvestmentReturn = (investment: Investment) => {
    const totalInvested = calculateTotalInvested(investment);
    const profit = investment.currentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    return { totalInvested, profit, returnPercentage };
  };

  function addInvestment() {
    if (!newInvestment.name || !newInvestment.platform) return;
    const investment: Investment = {
      id: crypto.randomUUID(),
      ...newInvestment,
    };
    onUpdateInvestments([...investments, investment]);
    setNewInvestment({
      type: 'stocks',
      name: '',
      platform: '',
      currentValue: 0,
      monthlyContribution: 0,
      initialAmount: 0,
      startDate: toISODate(today),
    });
    setIsAddingInvestment(false);
  }

  function removeInvestment(id: string) {
    onUpdateInvestments(investments.filter((inv) => inv.id !== id));
  }

  function updateInvestment(id: string, updates: Partial<Investment>) {
    onUpdateInvestments(
      investments.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  }

  const totalAccounts = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalMonthlyContributions = investments.reduce(
    (sum, inv) => sum + inv.monthlyContribution,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Suivi des actifs</h2>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'accounts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Comptes bancaires ({bankAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'investments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Investissements ({investments.length})
        </button>
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total comptes : <strong className="text-lg">{currency(totalAccounts)}</strong>
            </p>
            <button
              onClick={() => setIsAddingAccount(!isAddingAccount)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingAccount ? 'Annuler' : '+ Ajouter un compte'}
            </button>
          </div>

          {isAddingAccount && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="Ex: Revolut"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Solde actuel (€)</label>
                  <input
                    type="text"
                    value={newAccount.currentBalance === 0 ? '' : newAccount.currentBalance.toString().replace('.', ',')}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        currentBalance: parseAmount(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 1500,50 ou 1500.50"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newAccount.accountType}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="checking">Compte courant</option>
                    <option value="savings">Épargne</option>
                    <option value="pocket">Poche</option>
                  </select>
                </div>
              </div>
              <button
                onClick={addAccount}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          )}

          <div className="space-y-2">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{acc.accountType}</div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={acc.currentBalance === 0 ? '' : acc.currentBalance.toString().replace('.', ',')}
                      onChange={(e) =>
                        updateAccount(acc.id, {
                          currentBalance: parseAmount(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="w-32 px-3 py-1 border rounded text-right"
                    />
                  <button
                    onClick={() => removeAccount(acc.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investments Tab */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total investissements : <strong className="text-lg">{currency(totalInvestments)}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Contribution mensuelle totale : {currency(totalMonthlyContributions)}
              </p>
            </div>
            <button
              onClick={() => setIsAddingInvestment(!isAddingInvestment)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingInvestment ? 'Annuler' : '+ Ajouter un investissement'}
            </button>
          </div>

          {isAddingInvestment && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newInvestment.type}
                    onChange={(e) =>
                      setNewInvestment({ ...newInvestment, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="stocks">Bourse</option>
                    <option value="crypto">Crypto</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newInvestment.name}
                    onChange={(e) =>
                      setNewInvestment({ ...newInvestment, name: e.target.value })
                    }
                    placeholder="Ex: ETF World"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plateforme</label>
                  <input
                    type="text"
                    value={newInvestment.platform}
                    onChange={(e) =>
                      setNewInvestment({ ...newInvestment, platform: e.target.value })
                    }
                    placeholder="Ex: Revolut"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valeur actuelle (€)</label>
                  <input
                    type="text"
                    value={newInvestment.currentValue === 0 ? '' : newInvestment.currentValue.toString().replace('.', ',')}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        currentValue: parseAmount(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 1234,56 ou 1234.56"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contribution mensuelle (€) <span className="text-gray-500 text-xs">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={newInvestment.monthlyContribution === 0 ? '' : newInvestment.monthlyContribution.toString().replace('.', ',')}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        monthlyContribution: parseAmount(e.target.value),
                      })
                    }
                    placeholder="Ex: 20,00 ou laissez vide si aucun versement régulier"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant initial (€)</label>
                  <input
                    type="text"
                    value={newInvestment.initialAmount || ''}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        initialAmount: parseAmount(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 500,00 ou 500.00"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début d'investissement</label>
                  <input
                    type="date"
                    value={newInvestment.startDate}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <button
                onClick={addInvestment}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          )}

          <div className="space-y-3">
            {investments.map((inv) => {
              const { totalInvested, profit, returnPercentage } = calculateInvestmentReturn(inv);
              const startDate = inv.startDate ? new Date(inv.startDate) : null;
              const monthsActive = startDate ? 
                Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + 
                           (today.getMonth() - startDate.getMonth())) : 0;
              
              return (
                <div
                  key={inv.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-lg">{inv.name}</div>
                      <div className="text-sm text-gray-600">
                        {inv.platform} • {inv.type === 'stocks' ? 'Bourse' : inv.type === 'crypto' ? 'Crypto' : 'Autre'}
                        {startDate && ` • Début: ${startDate.toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    <button
                      onClick={() => removeInvestment(inv.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valeur actuelle (€)</label>
                      <input
                        type="text"
                        value={inv.currentValue === 0 ? '' : inv.currentValue.toString().replace('.', ',')}
                        onChange={(e) =>
                          updateInvestment(inv.id, {
                            currentValue: parseAmount(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Contribution mensuelle (€)</label>
                      <input
                        type="text"
                        value={inv.monthlyContribution === 0 ? '' : inv.monthlyContribution.toString().replace('.', ',')}
                        onChange={(e) =>
                          updateInvestment(inv.id, {
                            monthlyContribution: parseAmount(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Montant initial (€)</label>
                      <input
                        type="text"
                        value={inv.initialAmount === 0 ? '' : inv.initialAmount.toString().replace('.', ',')}
                        onChange={(e) =>
                          updateInvestment(inv.id, {
                            initialAmount: parseAmount(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date de début</label>
                      <input
                        type="date"
                        value={inv.startDate || toISODate(today)}
                        onChange={(e) =>
                          updateInvestment(inv.id, {
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Statistiques de rendement */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 text-xs">Total investi:</span>
                        <div className="font-semibold">{currency(totalInvested)}</div>
                        <div className="text-xs text-gray-500">
                          {startDate && `${monthsActive} mois`}
                        </div>
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
                      <div>
                        <span className="text-gray-600 text-xs">Valeur actuelle:</span>
                        <div className="font-semibold text-blue-600">{currency(inv.currentValue)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Actifs totaux :</span>
          <span className="text-2xl font-bold text-green-600">
            {currency(totalAccounts + totalInvestments)}
          </span>
        </div>
      </div>
    </div>
  );
}

