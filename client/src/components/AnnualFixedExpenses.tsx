import { useState } from 'react';
import { AnnualFixedExpense, BankAccount, ExpenseShare } from '../types';
import { currency, parseAmount } from '../utils';
import { ExpenseShareInput } from './ExpenseShareInput';

interface AnnualFixedExpensesProps {
  expenses: AnnualFixedExpense[];
  bankAccounts?: BankAccount[];
  onAdd: (expense: Omit<AnnualFixedExpense, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, expense: Partial<AnnualFixedExpense>) => void;
}

export function AnnualFixedExpenses({
  expenses,
  bankAccounts = [],
  onAdd,
  onRemove,
  onUpdate,
}: AnnualFixedExpensesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: 0, // Montant total de la charge
    month: 1,
    note: '',
    accountId: '' as string | undefined,
    share: undefined as ExpenseShare | undefined,
  });

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  function handleAdd() {
    if (!newExpense.name || newExpense.amount <= 0) return;
    
    // Calculer le montant réellement payé (avec partage si applicable)
    const actualAmount = newExpense.share?.yourAmount || newExpense.amount;
    
    if (editingExpenseId) {
      // Modification d'une dépense existante
      onUpdate(editingExpenseId, {
        name: newExpense.name,
        amount: actualAmount, // Montant réellement payé
        month: newExpense.month,
        note: newExpense.note,
        accountId: newExpense.accountId || undefined,
        share: newExpense.share,
      });
      setEditingExpenseId(null);
    } else {
      // Ajout d'une nouvelle dépense
      onAdd({
        name: newExpense.name,
        amount: actualAmount, // Montant réellement payé
        month: newExpense.month,
        note: newExpense.note,
        accountId: newExpense.accountId || undefined,
        share: newExpense.share,
      });
    }
    
    setNewExpense({ name: '', amount: 0, month: 1, note: '', accountId: '', share: undefined });
    setIsAdding(false);
  }

  function handleEdit(expense: AnnualFixedExpense) {
    setEditingExpenseId(expense.id);
    // Si la dépense est partagée, utiliser le montant total, sinon le montant payé
    const totalAmount = expense.share?.totalAmount || expense.amount;
    setNewExpense({
      name: expense.name,
      amount: totalAmount,
      month: expense.month,
      note: expense.note || '',
      accountId: expense.accountId || '',
      share: expense.share,
    });
    setIsAdding(true);
    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);
    setNewExpense({ name: '', amount: 0, month: 1, note: '', accountId: '', share: undefined });
    setIsAdding(false);
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {editingExpenseId ? 'Modifier une dépense fixe annuelle' : 'Dépenses fixes annuelles'}
        </h2>
        <button
          onClick={() => {
            if (isAdding) {
              handleCancelEdit();
            } else {
              setIsAdding(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          {isAdding ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Nom</label>
              <input
                type="text"
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                placeholder="Ex: Assurance habitation"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Montant total (€)
                {newExpense.share && newExpense.share.yourAmount !== newExpense.amount && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (Vous payez: {currency(newExpense.share.yourAmount)})
                  </span>
                )}
              </label>
              <input
                type="text"
                value={newExpense.amount === 0 ? '' : newExpense.amount.toString().replace('.', ',')}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1200,00 ou 1200.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {newExpense.share ? 'Montant total de la charge partagée' : 'Montant total de la charge'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mois</label>
              <select
                value={newExpense.month}
                onChange={(e) => setNewExpense({ ...newExpense, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {months.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Compte bancaire</label>
              <select
                value={newExpense.accountId || ''}
                onChange={(e) => setNewExpense({ ...newExpense, accountId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">— Non spécifié —</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <ExpenseShareInput
              totalAmount={newExpense.amount || 0}
              onShareChange={(share) => setNewExpense({ ...newExpense, share })}
              initialShare={newExpense.share}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Note (optionnel)</label>
            <input
              type="text"
              value={newExpense.note}
              onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
              placeholder="Informations complémentaires"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            {editingExpenseId ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Aucune dépense fixe annuelle. Cliquez sur "Ajouter" pour en créer une.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Nom</th>
                  <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Mois</th>
                  <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Compte</th>
                  <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Montant</th>
                  <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Note</th>
                  <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .sort((a, b) => a.month - b.month)
                  .map((exp) => {
                    const account = bankAccounts.find(a => a.id === exp.accountId);
                    return (
                    <tr key={exp.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{exp.name}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{months[exp.month - 1]}</td>
                      <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                        {account ? account.name : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-white">
                        {currency(exp.amount)}
                        {exp.share && exp.share.totalAmount !== exp.amount && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">
                            (Total: {currency(exp.share.totalAmount)}, {exp.share.yourParts}/{exp.share.totalParts} part{exp.share.yourParts > 1 ? 's' : ''})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">{exp.note || '-'}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mr-2"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onRemove(exp.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total annuel :</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{currency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

