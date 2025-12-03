import { useState, useEffect } from 'react';
import { Expense, Subscription, AnnualFixedExpense, Category, BankAccount, SavingsProject, ExpenseShare } from '../../core/types';
import { toISODate, parseAmount, currency, today } from '../../lib/utils';
import { ExpenseShareInput } from '../ui/ExpenseShareInput';

interface UnifiedExpensesManagerProps {
  expenses: Expense[];
  subs: Subscription[];
  annualFixedExpenses: AnnualFixedExpense[];
  categories: Category[];
  bankAccounts?: BankAccount[];
  savingsProjects?: SavingsProject[];
  monthNow: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, expense: Partial<Expense>) => void;
  onAddSub: (sub: Omit<Subscription, 'id'>) => void;
  onRemoveSub: (id: string) => void;
  onUpdateSub: (id: string, sub: Partial<Subscription>) => void;
  onAddAnnualFixed: (expense: Omit<AnnualFixedExpense, 'id'>) => void;
  onRemoveAnnualFixed: (id: string) => void;
  onUpdateAnnualFixed: (id: string, expense: Partial<AnnualFixedExpense>) => void;
  triggerAddExpense?: boolean; // Prop pour déclencher l'ouverture du formulaire
  onTriggerAddExpenseComplete?: () => void; // Callback quand le trigger est traité
}

type ExpenseType = 'variable' | 'fixed';
type FixedFrequency = 'monthly' | 'annual';
type FixedExpenseType = 'subscription' | 'insurance' | 'rent' | 'tax' | 'other';

export function UnifiedExpensesManager({
  expenses,
  subs,
  annualFixedExpenses,
  categories,
  bankAccounts = [],
  savingsProjects = [],
  monthNow,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  onAddSub,
  onRemoveSub,
  onUpdateSub,
  onAddAnnualFixed,
  onRemoveAnnualFixed,
  onUpdateAnnualFixed,
  triggerAddExpense = false,
  onTriggerAddExpenseComplete,
}: UnifiedExpensesManagerProps) {
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [isAdding, setIsAdding] = useState(false);
  
  // Écouter le trigger pour ouvrir le formulaire
  useEffect(() => {
    if (triggerAddExpense && !isAdding) {
      setIsAdding(true);
      setExpenseType('variable'); // Par défaut, dépense variable
      if (onTriggerAddExpenseComplete) {
        onTriggerAddExpenseComplete();
      }
      // Scroller vers le formulaire
      setTimeout(() => {
        const formElement = document.querySelector('[data-expense-form]');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [triggerAddExpense, isAdding, onTriggerAddExpenseComplete]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);

  // Champs communs
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [share, setShare] = useState<ExpenseShare | undefined>(undefined);

  // Champs spécifiques aux dépenses variables
  const [date, setDate] = useState(toISODate(today));

  // Champs spécifiques aux dépenses fixes
  const [fixedFrequency, setFixedFrequency] = useState<FixedFrequency>('monthly');
  const [fixedExpenseType, setFixedExpenseType] = useState<FixedExpenseType>('subscription');
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [ongoing, setOngoing] = useState(false);
  const [month, setMonth] = useState(1);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  function resetForm() {
    setName('');
    setAmount('');
    setCategoryId(categories[0]?.id || '');
    setNote('');
    setAccountId('');
    setProjectId('');
    setShare(undefined);
    setDate(toISODate(today));
    setFixedFrequency('monthly');
    setFixedExpenseType('subscription');
    setStartMonth(1);
    setEndMonth(12);
    setOngoing(false);
    setMonth(1);
    setEditingId(null);
    setEditingType(null);
    setIsAdding(false);
  }

  function handleAdd() {
    const totalAmount = parseAmount(amount);
    if (!totalAmount || totalAmount <= 0) return;

    const actualAmount = share?.yourAmount || totalAmount;

    if (editingId && editingType) {
      // Modification
      if (editingType === 'variable') {
        onUpdateExpense(editingId, {
          date: date || toISODate(today),
          amount: actualAmount,
          categoryId,
          note,
          accountId: accountId || undefined,
          projectId: projectId || undefined,
          share,
        });
      } else if (editingType === 'fixed') {
        // Dépense fixe : déterminer si c'est mensuelle ou annuelle
        if (fixedFrequency === 'monthly') {
          // C'est un abonnement (mensuel)
          onUpdateSub(editingId, {
            name: name || 'Dépense fixe',
            monthly: actualAmount,
            startMonth: startMonth,
            endMonth: ongoing ? 12 : endMonth,
            ongoing,
            accountId: accountId || undefined,
            share,
          });
        } else {
          // C'est une dépense fixe annuelle
          onUpdateAnnualFixed(editingId, {
            name: name || 'Dépense fixe',
            amount: actualAmount,
            month: month,
            note,
            accountId: accountId || undefined,
            share,
          });
        }
      }
    } else {
      // Ajout
      if (expenseType === 'variable') {
        onAddExpense({
          date: date || toISODate(today),
          amount: actualAmount,
          categoryId,
          note,
          accountId: accountId || undefined,
          projectId: projectId || undefined,
          share,
        });
      } else if (expenseType === 'fixed') {
        // Dépense fixe : déterminer si c'est mensuelle ou annuelle
        if (fixedFrequency === 'monthly') {
          // C'est un abonnement (mensuel)
          onAddSub({
            name: name || 'Dépense fixe',
            monthly: actualAmount,
            startMonth: startMonth,
            endMonth: ongoing ? 12 : endMonth,
            ongoing,
            accountId: accountId || undefined,
            share,
          });
        } else {
          // C'est une dépense fixe annuelle
          onAddAnnualFixed({
            name: name || 'Dépense fixe',
            amount: actualAmount,
            month: month,
            note,
            accountId: accountId || undefined,
            share,
          });
        }
      }
    }

    resetForm();
  }

  function handleEdit(type: ExpenseType | 'subscription' | 'annual_fixed', item: Expense | Subscription | AnnualFixedExpense) {
    // Convertir les anciens types en nouveaux types
    let newType: ExpenseType = 'variable';
    if (type === 'variable') {
      newType = 'variable';
    } else if (type === 'subscription' || type === 'annual_fixed') {
      newType = 'fixed';
    }
    
    setEditingType(newType);
    setEditingId(item.id);
    setIsAdding(true);

    if (type === 'variable') {
      const exp = item as Expense;
      setName(exp.note || '');
      const totalAmount = exp.share?.totalAmount || exp.amount;
      setAmount(totalAmount.toString().replace('.', ','));
      setCategoryId(exp.categoryId);
      setNote(exp.note);
      setAccountId(exp.accountId || '');
      setProjectId(exp.projectId || '');
      setDate(exp.date);
      setShare(exp.share);
      setExpenseType('variable');
    } else if (type === 'subscription') {
      const sub = item as Subscription;
      setName(sub.name);
      const totalMonthly = sub.share?.totalAmount || sub.monthly;
      setAmount(totalMonthly.toString().replace('.', ','));
      setFixedFrequency('monthly');
      setStartMonth(sub.startMonth);
      setEndMonth(sub.endMonth);
      setOngoing(sub.ongoing);
      setAccountId(sub.accountId || '');
      setShare(sub.share);
      setExpenseType('fixed');
    } else if (type === 'annual_fixed') {
      const exp = item as AnnualFixedExpense;
      setName(exp.name);
      const totalAmount = exp.share?.totalAmount || exp.amount;
      setAmount(totalAmount.toString().replace('.', ','));
      setFixedFrequency('annual');
      setMonth(exp.month);
      setNote(exp.note || '');
      setAccountId(exp.accountId || '');
      setShare(exp.share);
      setExpenseType('fixed');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    resetForm();
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
          {editingId ? 'Modifier une dépense' : 'Gérer mes dépenses'}
        </h2>
        <button
          onClick={() => {
            if (isAdding) {
              handleCancel();
            } else {
              setIsAdding(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          {isAdding ? 'Annuler' : '+ Ajouter une dépense'}
        </button>
      </div>

      {isAdding && (
        <div data-expense-form className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          {/* Type de dépense */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Type de dépense
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setExpenseType('variable')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  expenseType === 'variable'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                💰 Variable
              </button>
              <button
                type="button"
                onClick={() => setExpenseType('fixed')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  expenseType === 'fixed'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📅 Fixe
              </button>
            </div>
            
            {/* Fréquence et type pour les dépenses fixes */}
            {expenseType === 'fixed' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Fréquence
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFixedFrequency('monthly')}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        fixedFrequency === 'monthly'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Mensuelle
                    </button>
                    <button
                      type="button"
                      onClick={() => setFixedFrequency('annual')}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        fixedFrequency === 'annual'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Annuelle
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Type (optionnel)
                  </label>
                  <select
                    value={fixedExpenseType}
                    onChange={(e) => setFixedExpenseType(e.target.value as FixedExpenseType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="subscription">Abonnement</option>
                    <option value="insurance">Assurance</option>
                    <option value="rent">Loyer</option>
                    <option value="tax">Impôt/Taxe</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nom (pour dépenses fixes) */}
            {expenseType === 'fixed' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Nom {fixedExpenseType === 'subscription' ? "(ex: Netflix, Spotify)" : fixedExpenseType === 'insurance' ? "(ex: Assurance habitation)" : "(ex: Loyer, Taxe...)"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={fixedExpenseType === 'subscription' ? 'Netflix' : fixedExpenseType === 'insurance' ? 'Assurance habitation' : 'Nom de la dépense'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            )}

            {/* Date (pour dépenses variables) */}
            {expenseType === 'variable' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Montant {expenseType === 'fixed' ? (fixedFrequency === 'monthly' ? 'mensuel' : 'annuel') : ''} (€)
                {share && share.yourAmount !== parseAmount(amount) && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (Vous payez: {currency(share.yourAmount)})
                  </span>
                )}
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 50,00 ou 50.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Catégorie (pour dépenses variables) */}
            {expenseType === 'variable' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Catégorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mois de début/fin (pour dépenses fixes mensuelles) */}
            {expenseType === 'fixed' && fixedFrequency === 'monthly' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mois de début</label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {months.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                {!ongoing && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mois de fin</label>
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {months.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ongoing}
                      onChange={(e) => setOngoing(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">En cours (sans fin)</span>
                  </label>
                </div>
              </>
            )}

            {/* Mois (pour dépenses fixes annuelles) */}
            {expenseType === 'fixed' && fixedFrequency === 'annual' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mois de paiement</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {months.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Compte bancaire */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Compte bancaire</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
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

            {/* Projet d'épargne (pour dépenses variables) */}
            {expenseType === 'variable' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Projet d'épargne</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">— Non spécifié —</option>
                  {savingsProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Note (optionnel)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Informations complémentaires"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Partage de dépense */}
          <div className="mt-4">
            <ExpenseShareInput
              totalAmount={parseAmount(amount) || 0}
              onShareChange={(share) => setShare(share)}
              initialShare={share}
            />
          </div>

          {/* Bouton d'ajout/modification */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des dépenses */}
      <div className="space-y-4">
        {/* Dépenses variables */}
        {expenses.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Dépenses variables ({expenses.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Catégorie</th>
                    <th className="py-2 pr-4">Note</th>
                    <th className="py-2 pr-4">Montant</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{toISODate(e.date)}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        {categories.find((c) => c.id === e.categoryId)?.name || '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{e.note || '—'}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(e.amount)}</td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          onClick={() => handleEdit('variable', e)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mr-2"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onRemoveExpense(e.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dépenses fixes (mensuelles et annuelles) */}
        {(subs.length > 0 || annualFixedExpenses.length > 0) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📅 Dépenses fixes ({(subs.length + annualFixedExpenses.length)})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Nom</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Fréquence</th>
                    <th className="py-2 pr-4">Période/Mois</th>
                    <th className="py-2 pr-4">Montant</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Abonnements (mensuels) */}
                  {subs.map((s) => (
                    <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{s.name}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-xs">Abonnement</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-xs">Mensuelle</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white text-xs">
                        {months[s.startMonth - 1]} - {s.ongoing ? 'En cours' : months[s.endMonth - 1]}
                      </td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(s.monthly)}/mois</td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          onClick={() => handleEdit('subscription', s)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mr-2"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onRemoveSub(s.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Dépenses fixes annuelles */}
                  {annualFixedExpenses
                    .sort((a, b) => a.month - b.month)
                    .map((e) => (
                      <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">{e.name}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-xs">Autre</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-xs">Annuelle</td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white text-xs">{months[e.month - 1]}</td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(e.amount)}/an</td>
                        <td className="py-2 pr-2 text-right">
                          <button
                            onClick={() => handleEdit('annual_fixed', e)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mr-2"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onRemoveAnnualFixed(e.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message si aucune dépense */}
        {expenses.length === 0 && subs.length === 0 && annualFixedExpenses.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Aucune dépense enregistrée. Cliquez sur "Ajouter une dépense" pour commencer.
          </p>
        )}
      </div>
    </section>
  );
}

