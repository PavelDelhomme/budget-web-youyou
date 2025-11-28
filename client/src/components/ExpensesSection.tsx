import { useState } from 'react';
import { Expense, Category, BankAccount, SavingsProject } from '../types';
import { toISODate, parseAmount, currency, today } from '../utils';

interface ExpensesSectionProps {
  expenses: Expense[];
  categories: Category[];
  bankAccounts?: BankAccount[];
  savingsProjects?: SavingsProject[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, expense: Partial<Expense>) => void;
}

export function ExpensesSection({
  expenses,
  categories,
  bankAccounts = [],
  savingsProjects = [],
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
}: ExpensesSectionProps) {
  const [date, setDate] = useState(toISODate(today));
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories[0]?.id || ''
  );
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const handleAdd = () => {
    const amt = parseAmount(amount);
    if (!amt) return;
    
    if (editingExpenseId) {
      // Modification d'une dépense existante
      onUpdateExpense(editingExpenseId, {
        date: date || toISODate(today),
        amount: amt,
        categoryId,
        note,
        accountId: accountId || undefined,
        projectId: projectId || undefined,
      });
      setEditingExpenseId(null);
    } else {
      // Ajout d'une nouvelle dépense
      onAddExpense({
        date: date || toISODate(today),
        amount: amt,
        categoryId,
        note,
        accountId: accountId || undefined,
        projectId: projectId || undefined,
      });
    }
    
    setAmount('');
    setNote('');
    setDate(toISODate(today));
    setCategoryId(categories[0]?.id || '');
    setAccountId('');
    setProjectId('');
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setDate(expense.date);
    setAmount(expense.amount.toString().replace('.', ','));
    setCategoryId(expense.categoryId);
    setNote(expense.note);
    setAccountId(expense.accountId || '');
    setProjectId(expense.projectId || '');
    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setAmount('');
    setNote('');
    setDate(toISODate(today));
    setCategoryId(categories[0]?.id || '');
    setAccountId('');
    setProjectId('');
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
        {editingExpenseId ? 'Modifier une dépense variable' : 'Ajouter une dépense variable'}
      </h2>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Montant (€)</label>
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Ex: 50,00 ou 50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Catégorie</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Compte bancaire</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— Non spécifié —</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.accountType})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-gray-400">Projet d'épargne</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">— Non spécifié —</option>
            {savingsProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <label className="text-sm text-slate-600 dark:text-gray-400">Note</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ex: courses, concert, achat..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {editingExpenseId && (
          <button
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            onClick={handleCancelEdit}
          >
            Annuler
          </button>
        )}
        <button
          className="px-4 py-2 rounded-xl bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          onClick={handleAdd}
        >
          {editingExpenseId ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
      {expenses.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Catégorie</th>
                <th className="py-2 pr-4">Compte</th>
                <th className="py-2 pr-4">Projet</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2 pr-4">Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const account = bankAccounts.find(a => a.id === e.accountId);
                const project = savingsProjects.find(p => p.id === e.projectId);
                return (
                <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{toISODate(e.date)}</td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">
                    {categories.find((c) => c.id === e.categoryId)?.name || '—'}
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-sm">
                    {account ? `${account.name}` : '—'}
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-sm">
                    {project ? project.name : '—'}
                  </td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-gray-900 dark:text-white" title={e.note}>
                    {e.note}
                  </td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(e.amount)}</td>
                  <td className="py-2 pr-2 text-right">
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mr-2"
                      onClick={() => handleEdit(e)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      onClick={() => onRemoveExpense(e.id)}
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
      )}
    </section>
  );
}

