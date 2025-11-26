import React, { useState } from 'react';
import { AnnualFixedExpense } from '../types';
import { currency, parseAmount } from '../utils';

interface AnnualFixedExpensesProps {
  expenses: AnnualFixedExpense[];
  onAdd: (expense: Omit<AnnualFixedExpense, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, expense: Partial<AnnualFixedExpense>) => void;
}

export function AnnualFixedExpenses({
  expenses,
  onAdd,
  onRemove,
  onUpdate,
}: AnnualFixedExpensesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: 0,
    month: 1,
    note: '',
  });

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  function handleAdd() {
    if (!newExpense.name || newExpense.amount <= 0) return;
    onAdd(newExpense);
    setNewExpense({ name: '', amount: 0, month: 1, note: '' });
    setIsAdding(false);
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Dépenses fixes annuelles</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isAdding ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                placeholder="Ex: Assurance habitation"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Montant (€)</label>
              <input
                type="text"
                value={newExpense.amount === 0 ? '' : newExpense.amount.toString().replace('.', ',')}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: parseAmount(e.target.value) || 0 })
                }
                placeholder="Ex: 1200,00 ou 1200.00"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mois</label>
              <select
                value={newExpense.month}
                onChange={(e) => setNewExpense({ ...newExpense, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              >
                {months.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
            <input
              type="text"
              value={newExpense.note}
              onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
              placeholder="Informations complémentaires"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Aucune dépense fixe annuelle. Cliquez sur "Ajouter" pour en créer une.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Nom</th>
                  <th className="text-left py-2 px-3">Mois</th>
                  <th className="text-right py-2 px-3">Montant</th>
                  <th className="text-left py-2 px-3">Note</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .sort((a, b) => a.month - b.month)
                  .map((exp) => (
                    <tr key={exp.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{exp.name}</td>
                      <td className="py-2 px-3">{months[exp.month - 1]}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {currency(exp.amount)}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600">{exp.note || '-'}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onRemove(exp.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total annuel :</span>
              <span className="text-xl font-bold">{currency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

