import { useState } from 'react';
import { Subscription, BankAccount, ExpenseShare } from '../../core/types';
import { parseAmount, currency } from '../../lib/utils';
import { ExpenseShareInput } from '../ui/ExpenseShareInput';

interface SubscriptionsSectionProps {
  subs: Subscription[];
  monthNow: number;
  bankAccounts?: BankAccount[];
  onAddSub: (sub: Omit<Subscription, 'id'>) => void;
  onRemoveSub: (id: string) => void;
  onUpdateSub: (id: string, sub: Partial<Subscription>) => void;
  monthsOverlapFullYear: (s: Subscription) => number;
  monthsOverlapInYear: (s: Subscription, upToMonth: number) => number;
}

export function SubscriptionsSection({
  subs,
  monthNow,
  bankAccounts = [],
  onAddSub,
  onRemoveSub,
  onUpdateSub,
  monthsOverlapFullYear,
  monthsOverlapInYear,
}: SubscriptionsSectionProps) {
  const [name, setName] = useState('');
  const [monthly, setMonthly] = useState(''); // Montant total mensuel
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [ongoing, setOngoing] = useState(false);
  const [accountId, setAccountId] = useState<string>('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [share, setShare] = useState<ExpenseShare | undefined>(undefined);

  const handleAdd = () => {
    const totalMonthly = parseAmount(monthly);
    if (!totalMonthly) return;
    
    // Calculer le montant réellement payé (avec partage si applicable)
    const actualMonthly = share?.yourAmount || totalMonthly;
    
    const sm = Number(startMonth) || 1;
    const em = ongoing ? 12 : Number(endMonth) || 12;
    
    if (editingSubId) {
      // Modification d'un abonnement existant
      onUpdateSub(editingSubId, {
        name: name || 'Abonnement',
        monthly: actualMonthly, // Montant réellement payé par mois
        startMonth: sm,
        endMonth: em,
        ongoing,
        accountId: accountId || undefined,
        share: share,
      });
      setEditingSubId(null);
    } else {
      // Ajout d'un nouvel abonnement
      onAddSub({
        name: name || 'Abonnement',
        monthly: actualMonthly, // Montant réellement payé par mois
        startMonth: sm,
        endMonth: em,
        ongoing,
        accountId: accountId || undefined,
        share: share,
      });
    }
    
    setName('');
    setMonthly('');
    setStartMonth(1);
    setEndMonth(12);
    setOngoing(false);
    setAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
    setShare(undefined);
    setIsAdding(false);
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSubId(sub.id);
    setName(sub.name);
    // Si l'abonnement est partagé, utiliser le montant total, sinon le montant payé
    const totalMonthly = sub.share?.totalAmount || sub.monthly;
    setMonthly(totalMonthly.toString().replace('.', ','));
    setStartMonth(sub.startMonth);
    setEndMonth(sub.endMonth);
    setOngoing(sub.ongoing);
    // Si pas de compte, utiliser le premier disponible, sinon utiliser celui de l'abonnement
    setAccountId(sub.accountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''));
    setShare(sub.share);
    setIsAdding(false);
    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSubId(null);
    setName('');
    setMonthly('');
    setStartMonth(1);
    setEndMonth(12);
    setOngoing(false);
    setAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
    setShare(undefined);
    setIsAdding(false);
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {editingSubId ? 'Modifier un abonnement' : 'Abonnements (dépenses fixes mensuelles)'}
        </h2>
        <button
          onClick={() => {
            if (isAdding || editingSubId) {
              handleCancelEdit();
            } else {
              setIsAdding(true);
              // Initialiser avec le premier compte disponible
              setAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
            }
          }}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
{(isAdding || editingSubId) ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>

      {(isAdding || editingSubId) && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="grid md:grid-cols-7 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600 dark:text-gray-400">Nom</label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="ex: Spotify, Assurance, Téléphone"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-400">
                Mensuel total (€)
                {share && share.yourAmount !== parseAmount(monthly) && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (Vous payez: {currency(share.yourAmount)})
                  </span>
                )}
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Ex: 15,99 ou 15.99"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-400">Compte bancaire</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={accountId || (bankAccounts.length > 0 ? bankAccounts[0].id : '')}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {bankAccounts.length === 0 && (
                  <option value="">— Aucun compte disponible —</option>
                )}
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-400">Débute (mois)</label>
              <input
                type="number"
                min={1}
                max={12}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-400">Se termine (mois)</label>
              <input
                type="number"
                min={1}
                max={12}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600"
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
                disabled={ongoing}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ongoing"
                type="checkbox"
                checked={ongoing}
                onChange={(e) => setOngoing(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="ongoing" className="text-sm text-slate-700 dark:text-gray-300">
                En cours toute l'année
              </label>
            </div>
          </div>
          <div className="mt-3">
            <ExpenseShareInput
              totalAmount={parseAmount(monthly) || 0}
              onShareChange={(share) => setShare(share)}
              initialShare={share}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              onClick={handleAdd}
            >
              {editingSubId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {subs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Aucun abonnement. Cliquez sur "Ajouter" pour en créer un.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Mensuel</th>
                <th className="py-2 pr-4">Compte</th>
                <th className="py-2 pr-4">Mois actifs</th>
                <th className="py-2 pr-4">Total annuel</th>
                <th className="py-2 pr-4" title="Montant total payé depuis le début de l'année jusqu'à maintenant">Payé à date</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const monthsFull = monthsOverlapFullYear(s);
                const monthsToDate = monthsOverlapInYear(s, monthNow);
                const account = bankAccounts.find(a => a.id === s.accountId);
                return (
                  <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{s.name}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">
                      {currency(s.monthly)}
                      {s.share && s.share.totalAmount !== s.monthly && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">
                          (Total: {currency(s.share.totalAmount)}, {s.share.yourParts}/{s.share.totalParts} part{s.share.yourParts > 1 ? 's' : ''})
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 text-sm">
                      {account ? account.name : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{monthsFull}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{currency(s.monthly * monthsFull)}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium" title={`Montant payé depuis le début de l'année jusqu'au mois ${monthNow}`}>
                      {currency(s.monthly * monthsToDate)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleEdit(s)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

