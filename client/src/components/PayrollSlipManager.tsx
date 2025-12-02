import { useState, useEffect, useMemo } from 'react';
import { PayrollSlip, ContractType } from '../types';
import { currency, parseAmount, toISODate, today } from '../utils';

interface PayrollSlipManagerProps {
  isOpen: boolean;
  onClose: () => void;
  payrollSlips: PayrollSlip[];
  onUpdate: (slips: PayrollSlip[]) => Promise<void>;
  currentYear?: number;
  onUseForIncome?: (netSalary: number, contractType: ContractType, employer: string) => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function PayrollSlipManager({
  isOpen,
  onClose,
  payrollSlips,
  onUpdate,
  currentYear,
  onUseForIncome,
}: PayrollSlipManagerProps) {
  const [slips, setSlips] = useState<PayrollSlip[]>(payrollSlips || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear || today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  
  const [currentSlip, setCurrentSlip] = useState<Partial<PayrollSlip>>({
    year: selectedYear,
    month: selectedMonth,
    contractType: 'CDI',
    employer: '',
    grossSalary: 0,
    netSalary: 0,
    verified: false,
    extractedAutomatically: false,
  });

  useEffect(() => {
    setSlips(payrollSlips || []);
  }, [payrollSlips]);

  useEffect(() => {
    if (currentYear) {
      setSelectedYear(currentYear);
      setCurrentSlip(prev => ({ ...prev, year: currentYear }));
    }
  }, [currentYear]);

  // Filtrer les fiches de paie par année
  const slipsByYear = useMemo(() => {
    const grouped = new Map<number, PayrollSlip[]>();
    slips.forEach(slip => {
      if (!grouped.has(slip.year)) {
        grouped.set(slip.year, []);
      }
      grouped.get(slip.year)!.push(slip);
    });
    return grouped;
  }, [slips]);

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    slips.forEach(slip => yearsSet.add(slip.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [slips]);

  const handleAddOrEdit = async () => {
    if (!currentSlip.employer || !currentSlip.grossSalary || !currentSlip.netSalary) {
      alert('Veuillez remplir au moins l\'employeur, le salaire brut et le salaire net.');
      return;
    }

    const slip: PayrollSlip = {
      id: editingId || crypto.randomUUID(),
      year: currentSlip.year || selectedYear,
      month: currentSlip.month || selectedMonth,
      contractType: currentSlip.contractType || 'CDI',
      employer: currentSlip.employer,
      employeeName: currentSlip.employeeName,
      grossSalary: currentSlip.grossSalary || 0,
      netSalary: currentSlip.netSalary || 0,
      baseSalary: currentSlip.baseSalary,
      socialContributions: currentSlip.socialContributions,
      bonuses: currentSlip.bonuses,
      overtime: currentSlip.overtime,
      overtimeHours: currentSlip.overtimeHours,
      hoursWorked: currentSlip.hoursWorked,
      hourlyRate: currentSlip.hourlyRate,
      paidDays: currentSlip.paidDays,
      taxableIncome: currentSlip.taxableIncome,
      incomeTaxWithheld: currentSlip.incomeTaxWithheld,
      paymentDate: currentSlip.paymentDate,
      periodStart: currentSlip.periodStart,
      periodEnd: currentSlip.periodEnd,
      filePath: currentSlip.filePath,
      note: currentSlip.note,
      verified: currentSlip.verified ?? false,
      extractedAutomatically: currentSlip.extractedAutomatically ?? false,
    };

    let updatedSlips: PayrollSlip[];
    if (editingId) {
      updatedSlips = slips.map(s => s.id === editingId ? slip : s);
    } else {
      updatedSlips = [...slips, slip];
    }

    setSlips(updatedSlips);
    await onUpdate(updatedSlips);
    
    // Reset form
    setCurrentSlip({
      year: selectedYear,
      month: selectedMonth,
      contractType: 'CDI',
      employer: '',
      grossSalary: 0,
      netSalary: 0,
      verified: false,
      extractedAutomatically: false,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (slip: PayrollSlip) => {
    setCurrentSlip(slip);
    setEditingId(slip.id);
    setIsAdding(true);
    setSelectedYear(slip.year);
    setSelectedMonth(slip.month);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche de paie ?')) return;
    
    const updatedSlips = slips.filter(s => s.id !== id);
    setSlips(updatedSlips);
    await onUpdate(updatedSlips);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentSlip({
      year: selectedYear,
      month: selectedMonth,
      contractType: 'CDI',
      employer: '',
      grossSalary: 0,
      netSalary: 0,
      verified: false,
      extractedAutomatically: false,
    });
  };

  const handleUseForIncome = (slip: PayrollSlip) => {
    if (onUseForIncome) {
      onUseForIncome(slip.netSalary, slip.contractType, slip.employer);
      alert(`✅ Salaire net de ${currency(slip.netSalary)} utilisé pour les revenus mensuels !`);
    }
  };

  if (!isOpen) return null;

  const currentYearSlips = slipsByYear.get(selectedYear) || [];
  const currentYearSlipsSorted = [...currentYearSlips].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📄 Gestion des fiches de paie
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filtre par année */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Année :
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
                setCurrentSlip(prev => ({ ...prev, year }));
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {years.length > 0 ? (
                years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={selectedYear}>{selectedYear}</option>
              )}
            </select>
            <button
              onClick={() => setIsAdding(true)}
              className="ml-auto px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              + Ajouter une fiche de paie
            </button>
          </div>

          {/* Formulaire d'ajout/édition */}
          {isAdding && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-700/30 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Modifier la fiche de paie' : 'Ajouter une fiche de paie'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Année *
                  </label>
                  <input
                    type="number"
                    value={currentSlip.year || selectedYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      setSelectedYear(year);
                      setCurrentSlip(prev => ({ ...prev, year }));
                    }}
                    min={1900}
                    max={2100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mois *
                  </label>
                  <select
                    value={currentSlip.month || selectedMonth}
                    onChange={(e) => {
                      const month = parseInt(e.target.value);
                      setSelectedMonth(month);
                      setCurrentSlip(prev => ({ ...prev, month }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {MONTHS.map((month, idx) => (
                      <option key={idx + 1} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de contrat *
                  </label>
                  <select
                    value={currentSlip.contractType || 'CDI'}
                    onChange={(e) => setCurrentSlip(prev => ({ ...prev, contractType: e.target.value as ContractType }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="interim">Intérim</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Stage</option>
                    <option value="apprenticeship">Apprentissage</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employeur *
                  </label>
                  <input
                    type="text"
                    value={currentSlip.employer || ''}
                    onChange={(e) => setCurrentSlip(prev => ({ ...prev, employer: e.target.value }))}
                    placeholder="Nom de l'employeur"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salaire brut (€) *
                  </label>
                  <input
                    type="text"
                    value={currentSlip.grossSalary === 0 ? '' : (currentSlip.grossSalary || '').toString().replace('.', ',')}
                    onChange={(e) => {
                      const amount = parseAmount(e.target.value);
                      setCurrentSlip(prev => ({ ...prev, grossSalary: amount || 0 }));
                    }}
                    placeholder="Ex: 3000,00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salaire net (€) *
                  </label>
                  <input
                    type="text"
                    value={currentSlip.netSalary === 0 ? '' : (currentSlip.netSalary || '').toString().replace('.', ',')}
                    onChange={(e) => {
                      const amount = parseAmount(e.target.value);
                      setCurrentSlip(prev => ({ ...prev, netSalary: amount || 0 }));
                    }}
                    placeholder="Ex: 2400,00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleAddOrEdit}
                  className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des fiches de paie */}
          {currentYearSlipsSorted.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fiches de paie pour {selectedYear}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Mois</th>
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Employeur</th>
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Type</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Brut</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Net</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentYearSlipsSorted.map(slip => (
                      <tr key={slip.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{MONTHS[slip.month - 1]}</td>
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{slip.employer}</td>
                        <td className="py-2 px-3">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            {slip.contractType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-white">{currency(slip.grossSalary)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-green-600 dark:text-green-400">{currency(slip.netSalary)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onUseForIncome && (
                              <button
                                onClick={() => handleUseForIncome(slip)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                                title="Utiliser pour les revenus"
                              >
                                💰
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(slip)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(slip.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">Aucune fiche de paie pour {selectedYear}</p>
              <p className="text-sm">Cliquez sur "Ajouter une fiche de paie" pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

