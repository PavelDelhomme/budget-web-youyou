import { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Expense, Category, BankAccount } from '../../core/types';
import { toISODate, parseAmount, currency, today } from '../../lib/utils';

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  bankAccounts?: BankAccount[];
  currentYear: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export function QuickAddExpenseModal({
  isOpen,
  onClose,
  categories,
  bankAccounts = [],
  currentYear,
  onAddExpense,
}: QuickAddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toISODate(today));
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseAmount(amount);
    if (!totalAmount || totalAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (!categoryId) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }
    if (bankAccounts.length > 0 && !accountId) {
      alert('Veuillez sélectionner un compte bancaire');
      return;
    }

    onAddExpense({
      date,
      amount: totalAmount,
      categoryId,
      note: note.trim(),
      accountId: bankAccounts.length > 0 ? accountId : undefined,
    });

    // Reset form
    setAmount('');
    setNote('');
    setDate(toISODate(today));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Ajouter une dépense rapide">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Montant */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Montant (€) *
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg"
            autoFocus
            required
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Catégorie *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Compte bancaire */}
        {bankAccounts.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Compte bancaire *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Note (optionnel)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Courses, Restaurants..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            Ajouter
          </button>
        </div>
      </form>
    </Modal>
  );
}
