import { useState, useEffect } from 'react';
import { currency, parseAmount, toISODate, today } from '../../lib/utils';
import { MonthlyIncomeSource } from '../../core/types';

interface MultipleMonthlyIncomesProps {
  incomeSources: MonthlyIncomeSource[];
  onUpdate: (sources: MonthlyIncomeSource[]) => void;
  currentYear: number;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MultipleMonthlyIncomes({
  incomeSources = [],
  onUpdate,
  currentYear,
}: MultipleMonthlyIncomesProps) {
  const [sources, setSources] = useState<MonthlyIncomeSource[]>(incomeSources || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState({
    name: '',
    amount: 0,
    amountInput: '',
    startDate: toISODate(today),
    endDate: '',
    type: 'salary' as 'salary' | 'interim' | 'allocation' | 'freelance' | 'other',
    note: '',
  });

  useEffect(() => {
    setSources(incomeSources || []);
  }, [incomeSources]);

  // Calculer les revenus actifs pour l'année courante
  const activeSourcesForYear = sources.filter(source => {
    const startDate = new Date(source.startDate);
    const endDate = source.endDate ? new Date(source.endDate) : null;
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    if (endDate) {
      return startDate <= yearEnd && endDate >= yearStart;
    }
    return startDate <= yearEnd;
  });

  // Calculer le revenu mensuel total pour chaque mois de l'année
  const getMonthlyIncomeForMonth = (monthIndex: number) => {
    const monthDate = new Date(currentYear, monthIndex, 1);
    const monthEnd = new Date(currentYear, monthIndex + 1, 0);

    return activeSourcesForYear.reduce((sum, source) => {
      const startDate = new Date(source.startDate);
      const endDate = source.endDate ? new Date(source.endDate) : null;

      // Vérifier si la source est active ce mois
      if (startDate > monthEnd) return sum;
      if (endDate && endDate < monthDate) return sum;

      return sum + source.amount;
    }, 0);
  };

  const totalMonthly = activeSourcesForYear.reduce((sum, s) => sum + s.amount, 0);
  const totalAnnual = Array.from({ length: 12 }, (_, i) => getMonthlyIncomeForMonth(i))
    .reduce((sum, monthly) => sum + monthly, 0);

  const handleAddOrEdit = () => {
    if (!currentSource.name || !currentSource.amountInput) return;

    const amount = parseAmount(currentSource.amountInput);
    if (amount <= 0) return;

    const source: MonthlyIncomeSource = {
      id: editingId || crypto.randomUUID(),
      name: currentSource.name,
      amount: amount,
      startDate: currentSource.startDate,
      endDate: currentSource.endDate || undefined,
      type: currentSource.type,
      note: currentSource.note || undefined,
    };

    if (editingId) {
      setSources(sources.map(s => s.id === editingId ? source : s));
      setEditingId(null);
    } else {
      setSources([...sources, source]);
      setIsAdding(false);
    }

    // Reset form
    setCurrentSource({
      name: '',
      amount: 0,
      amountInput: '',
      startDate: toISODate(today),
      endDate: '',
      type: 'salary',
      note: '',
    });

    onUpdate(sources);
  };

  const handleEdit = (source: MonthlyIncomeSource) => {
    setCurrentSource({
      name: source.name,
      amount: source.amount,
      amountInput: source.amount.toString().replace('.', ','),
      startDate: source.startDate,
      endDate: source.endDate || '',
      type: source.type,
      note: source.note || '',
    });
    setEditingId(source.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
    onUpdate(sources.filter(s => s.id !== id));
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentSource({
      name: '',
      amount: 0,
      amountInput: '',
      startDate: toISODate(today),
      endDate: '',
      type: 'salary',
      note: '',
    });
  };

  return (
    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            💼 Sources de revenus multiples
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Gérez plusieurs revenus mensuels (intérim, plusieurs emplois, allocations, etc.). Chaque source peut avoir une date de début et de fin.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            title="Ajouter une source de revenu"
            aria-label="Ajouter une source de revenu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la source *
            </label>
            <input
              type="text"
              value={currentSource.name}
              onChange={(e) => setCurrentSource({ ...currentSource, name: e.target.value })}
              placeholder="Ex: Intérim chez X, Salaire principal, Allocations CAF..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant mensuel (€) *
              </label>
              <input
                type="text"
                value={currentSource.amountInput}
                onChange={(e) => setCurrentSource({ ...currentSource, amountInput: e.target.value })}
                placeholder="1500,00"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={currentSource.type}
                onChange={(e) => setCurrentSource({ ...currentSource, type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="salary">Salaire</option>
                <option value="interim">Intérim</option>
                <option value="allocation">Allocation</option>
                <option value="freelance">Freelance</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début *
              </label>
              <input
                type="date"
                value={currentSource.startDate}
                onChange={(e) => setCurrentSource({ ...currentSource, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin (optionnel)
              </label>
              <input
                type="date"
                value={currentSource.endDate}
                onChange={(e) => setCurrentSource({ ...currentSource, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Laissez vide pour permanent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optionnel)
            </label>
            <input
              type="text"
              value={currentSource.note}
              onChange={(e) => setCurrentSource({ ...currentSource, note: e.target.value })}
              placeholder="Informations supplémentaires..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-purple-200 dark:border-purple-700">
            <button
              onClick={handleAddOrEdit}
              className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors text-sm"
            >
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {activeSourcesForYear.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Revenu mensuel total :</strong> {currency(totalMonthly)}/mois
            <br />
            <strong>Revenu annuel estimé :</strong> {currency(totalAnnual)}
          </div>

          <div className="space-y-2">
            {activeSourcesForYear.map((source) => {
              const isPermanent = !source.endDate;
              const startDate = new Date(source.startDate);
              const endDate = source.endDate ? new Date(source.endDate) : null;

              return (
                <div
                  key={source.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                          {source.type}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {currency(source.amount)}/mois
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Du {startDate.toLocaleDateString('fr-FR')}
                        {isPermanent ? ' (permanent)' : ` au ${endDate!.toLocaleDateString('fr-FR')}`}
                      </div>
                      {source.note && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 italic">
                          {source.note}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(source)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue mensuelle */}
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Revenus par mois ({currentYear})
            </h5>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {MONTH_NAMES.map((monthName, index) => {
                const monthlyIncome = getMonthlyIncomeForMonth(index);
                return (
                  <div
                    key={index}
                    className="p-2 rounded bg-gray-100 dark:bg-gray-700/50"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{monthName}</div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      {currency(monthlyIncome)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Aucune source de revenu configurée pour {currentYear}. Cliquez sur "Ajouter" pour en créer une.
        </p>
      )}
    </div>
  );
}

