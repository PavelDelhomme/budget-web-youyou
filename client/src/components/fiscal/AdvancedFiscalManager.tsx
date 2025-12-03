import { useState, useEffect } from 'react';
import { Modal } from '../layout/Modal';
import { currency, parseAmount } from '../../lib/utils';

interface AdvancedFiscalManagerProps {
  isOpen: boolean;
  onClose: () => void;
  annualIncome?: number;
}

interface FiscalDeclaration {
  year: number;
  status: 'draft' | 'prepared' | 'submitted' | 'validated' | 'paid';
  submission_date?: string;
  validation_date?: string;
  tax_amount: number;
  refund_amount: number;
  net_tax_amount: number;
  rfr: number;
  taxable_income: number;
  deductions: FiscalDeduction[];
  notes?: string;
  documents?: string[];
}

interface FiscalDeduction {
  id: string;
  name: string;
  type: 'deduction' | 'credit';
  amount: number;
  year: number;
  category: string;
  description?: string;
  status?: string;
}

interface FiscalCalendarDate {
  date: string;
  event: string;
  type: 'deadline' | 'payment' | 'information';
  important: boolean;
  description: string;
}

interface FiscalRegulation {
  id: string;
  title: string;
  description: string;
  category: string;
  effective_date: string;
  expiration_date?: string;
  source: string;
  impact: 'low' | 'medium' | 'high';
  url?: string;
}

interface AvailableDeduction {
  name: string;
  type: 'deduction' | 'credit';
  description: string;
  max_amount?: number;
  min_amount?: number;
  rate?: number;
  requires_receipts?: boolean;
}

export function AdvancedFiscalManager({ isOpen, onClose, annualIncome = 0 }: AdvancedFiscalManagerProps) {
  const [activeTab, setActiveTab] = useState<'declarations' | 'calendar' | 'regulations' | 'deductions'>('declarations');
  const [declarations, setDeclarations] = useState<FiscalDeclaration[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [calendar, setCalendar] = useState<FiscalCalendarDate[]>([]);
  const [nextDeadline, setNextDeadline] = useState<FiscalCalendarDate | null>(null);
  const [regulations, setRegulations] = useState<FiscalRegulation[]>([]);
  const [availableDeductions, setAvailableDeductions] = useState<AvailableDeduction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la préparation de déclaration
  const [preparingDeclaration, setPreparingDeclaration] = useState(false);
  const [fiscalSituation, setFiscalSituation] = useState({
    annual_income: annualIncome,
    parts: 1,
    children: 0,
    marital_status: 'single' as 'single' | 'married' | 'pacs',
    year: new Date().getFullYear(),
  });
  const [selectedDeductions, setSelectedDeductions] = useState<FiscalDeduction[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedYear, activeTab]);

  useEffect(() => {
    if (annualIncome > 0) {
      setFiscalSituation(prev => ({ ...prev, annual_income: annualIncome }));
    }
  }, [annualIncome]);

  // Calculer les parts automatiquement
  useEffect(() => {
    let parts = 1;
    if (fiscalSituation.marital_status === 'married' || fiscalSituation.marital_status === 'pacs') {
      parts = 2;
    }
    parts += fiscalSituation.children * 0.5;
    if (fiscalSituation.children > 2) {
      parts += (fiscalSituation.children - 2) * 1;
    }
    setFiscalSituation(prev => ({ ...prev, parts }));
  }, [fiscalSituation.marital_status, fiscalSituation.children]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'declarations') {
        await loadDeclarations();
      } else if (activeTab === 'calendar') {
        await loadCalendar();
      } else if (activeTab === 'regulations') {
        await loadRegulations();
      } else if (activeTab === 'deductions') {
        await loadAvailableDeductions();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeclarations = async () => {
    try {
      const response = await fetch('/api/fiscal/declarations', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeclarations(data.declarations || []);
      } else if (response.status === 401) {
        // Utilisateur non authentifié - c'est normal, ne pas afficher d'erreur
        setDeclarations([]);
      } else if (response.status === 404) {
        // Endpoint non disponible, utiliser données vides
        setDeclarations([]);
      }
    } catch (err: any) {
      // Erreur silencieuse si endpoint non disponible ou utilisateur non authentifié
      setDeclarations([]);
    }
  };

  const loadCalendar = async () => {
    try {
      const response = await fetch(`/api/fiscal/calendar/${selectedYear}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalendar(data.important_dates || []);
        setNextDeadline(data.next_deadline || null);
        
        // Afficher une notification si les données proviennent de sources en temps réel
        if (data.source === 'live_government_data') {
          console.log(`✅ Calendrier fiscal mis à jour depuis sources gouvernementales (${data.last_update})`);
        }
      } else if (response.status === 401) {
        // Utilisateur non authentifié - c'est normal, ne pas afficher d'erreur
        setCalendar([]);
        setNextDeadline(null);
      } else if (response.status === 404) {
        // Endpoint non disponible, utiliser données vides
        setCalendar([]);
        setNextDeadline(null);
      }
    } catch (err: any) {
      // Erreur silencieuse si endpoint non disponible
      setCalendar([]);
      setNextDeadline(null);
    }
  };

  const loadRegulations = async () => {
    try {
      const response = await fetch(`/api/fiscal/regulations?year=${selectedYear}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📜 Données réglementations reçues:', data);
        
        // Vérifier que les réglementations sont présentes
        if (data.regulations && Array.isArray(data.regulations) && data.regulations.length > 0) {
          setRegulations(data.regulations);
          console.log(`✅ ${data.regulations.length} réglementations chargées pour ${selectedYear}`);
        } else {
          console.warn(`⚠️ Aucune réglementation dans la réponse pour ${selectedYear}`);
          setRegulations([]);
        }
        
        // Afficher une notification si les données proviennent de sources en temps réel
        if (data.source === 'live_government_data') {
          console.log(`✅ Réglementations mises à jour depuis sources gouvernementales (${data.last_update})`);
        }
      } else if (response.status === 401) {
        // Utilisateur non authentifié - c'est normal, ne pas afficher d'erreur
        setRegulations([]);
      } else {
        // Afficher l'erreur pour le débogage seulement si ce n'est pas une erreur d'authentification
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`❌ Erreur lors du chargement des réglementations (${response.status}):`, errorData);
        setError(`Erreur ${response.status}: ${errorData.error || 'Impossible de charger les réglementations'}`);
        setRegulations([]);
      }
    } catch (err: any) {
      console.error('❌ Exception lors du chargement des réglementations:', err);
      setError(`Erreur: ${err.message || 'Impossible de charger les réglementations'}`);
      setRegulations([]);
    }
  };

  const loadAvailableDeductions = async () => {
    try {
      const response = await fetch('/api/fiscal/deductions/available', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableDeductions(data.deductions || []);
        
        // Afficher une notification si les données proviennent de sources en temps réel
        if (data.source === 'live_government_data') {
          console.log(`✅ Déductions mises à jour depuis sources gouvernementales (${data.last_update})`);
        }
      } else if (response.status === 401) {
        // Utilisateur non authentifié - c'est normal, ne pas afficher d'erreur
        setAvailableDeductions([]);
      } else if (response.status === 404) {
        // Endpoint non disponible, utiliser données vides
        setAvailableDeductions([]);
      }
    } catch (err: any) {
      // Erreur silencieuse si endpoint non disponible ou utilisateur non authentifié
      setAvailableDeductions([]);
    }
  };

  const prepareDeclaration = async () => {
    setPreparingDeclaration(true);
    setError(null);

    try {
      const response = await fetch('/api/fiscal/declaration/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          year: fiscalSituation.year,
          annual_income: fiscalSituation.annual_income,
          situation: {
            year: fiscalSituation.year,
            parts: fiscalSituation.parts,
            children: fiscalSituation.children,
            marital_status: fiscalSituation.marital_status,
          },
          deductions: selectedDeductions.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category,
            amount: d.amount,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la préparation');
      }

      // Recharger les déclarations
      await loadDeclarations();
      
      // Passer à l'onglet déclarations
      setActiveTab('declarations');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la préparation');
    } finally {
      setPreparingDeclaration(false);
    }
  };

  const exportDeclaration = async (year: number, format: 'text' | 'json' = 'text') => {
    try {
      const response = await fetch(`/api/fiscal/declaration/${year}/export?format=${format}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (format === 'text') {
          // Télécharger le fichier texte
          const blob = new Blob([data.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `declaration_fiscale_${year}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // Télécharger le JSON
          const blob = new Blob([JSON.stringify(data.declaration, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `declaration_fiscale_${year}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏛️ Gestion Fiscale Avancée" closeable>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {(['declarations', 'calendar', 'regulations', 'deductions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'declarations' && '📄 Déclarations'}
                {tab === 'calendar' && '📅 Calendrier'}
                {tab === 'regulations' && '📜 Réglementation'}
                {tab === 'deductions' && '💰 Déductions'}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-red-800 dark:text-red-200 font-semibold">Erreur :</div>
            <div className="text-red-700 dark:text-red-300 text-sm">{error}</div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
          </div>
        )}

        {/* Tab Content */}
        {!isLoading && (
          <>
            {/* Déclarations */}
            {activeTab === 'declarations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mes Déclarations Fiscales
                  </h3>
                  <button
                    onClick={() => setActiveTab('deductions')}
                    className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 text-sm"
                  >
                    ➕ Préparer une déclaration
                  </button>
                </div>

                {declarations.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    Aucune déclaration préparée. Cliquez sur "Préparer une déclaration" pour commencer.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {declarations.map((decl) => (
                      <div
                        key={decl.year}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Déclaration {decl.year}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Statut: <span className={`font-medium ${
                                decl.status === 'validated' ? 'text-green-600 dark:text-green-400' :
                                decl.status === 'submitted' ? 'text-blue-600 dark:text-blue-400' :
                                decl.status === 'prepared' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                {decl.status === 'draft' && 'Brouillon'}
                                {decl.status === 'prepared' && 'Préparée'}
                                {decl.status === 'submitted' && 'Soumise'}
                                {decl.status === 'validated' && 'Validée'}
                                {decl.status === 'paid' && 'Payée'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => exportDeclaration(decl.year, 'text')}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              📥 Export TXT
                            </button>
                            <button
                              onClick={() => exportDeclaration(decl.year, 'json')}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              📥 Export JSON
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Revenu imposable</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {currency(decl.taxable_income)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Impôt</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {currency(decl.tax_amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Net à payer</div>
                            <div className={`font-semibold ${
                              decl.net_tax_amount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {currency(decl.net_tax_amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Remboursement</div>
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {decl.refund_amount > 0 ? currency(decl.refund_amount) : '-'}
                            </div>
                          </div>
                        </div>

                        {decl.deductions && decl.deductions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Déductions et crédits d'impôt ({decl.deductions.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {decl.deductions.map((ded) => (
                                <span
                                  key={ded.id}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs"
                                >
                                  {ded.name}: {currency(ded.amount)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Calendrier Fiscal */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Calendrier Fiscal {selectedYear}
                  </h3>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {nextDeadline && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      ⏰ Prochaine échéance
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>{nextDeadline.event}</strong> - {nextDeadline.date}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      {nextDeadline.description}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {calendar.map((date, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        date.important
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            date.important
                              ? 'text-red-900 dark:text-red-200'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {date.event}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(date.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className={`text-xs mt-2 ${
                            date.important
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {date.description}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          date.type === 'deadline'
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                            : date.type === 'payment'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {date.type === 'deadline' && 'Échéance'}
                          {date.type === 'payment' && 'Paiement'}
                          {date.type === 'information' && 'Info'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Réglementations */}
            {activeTab === 'regulations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Réglementation Fiscale
                  </h3>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {regulations.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    Aucune réglementation disponible pour {selectedYear}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {regulations.map((reg) => (
                      <div
                        key={reg.id}
                        className={`border rounded-lg p-4 ${
                          reg.impact === 'high'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : reg.impact === 'medium'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {reg.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            reg.impact === 'high'
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                              : reg.impact === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {reg.impact === 'high' && 'Impact élevé'}
                            {reg.impact === 'medium' && 'Impact moyen'}
                            {reg.impact === 'low' && 'Impact faible'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {reg.description}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                          <div>
                            Entrée en vigueur: {new Date(reg.effective_date).toLocaleDateString('fr-FR')}
                            {reg.expiration_date && (
                              <> • Expire: {new Date(reg.expiration_date).toLocaleDateString('fr-FR')}</>
                            )}
                          </div>
                          {reg.url && (
                            <a
                              href={reg.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              📄 Source
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Déductions */}
            {activeTab === 'deductions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Préparer une Déclaration Fiscale
                </h3>

                {/* Situation fiscale */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Situation Fiscale
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Revenu annuel (€)
                      </label>
                      <input
                        type="text"
                        value={fiscalSituation.annual_income || ''}
                        onChange={(e) => {
                          const value = parseAmount(e.target.value);
                          setFiscalSituation(prev => ({ ...prev, annual_income: value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Année fiscale
                      </label>
                      <input
                        type="number"
                        value={fiscalSituation.year}
                        onChange={(e) => {
                          setFiscalSituation(prev => ({
                            ...prev,
                            year: parseInt(e.target.value) || new Date().getFullYear()
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Situation familiale
                      </label>
                      <select
                        value={fiscalSituation.marital_status}
                        onChange={(e) => {
                          setFiscalSituation(prev => ({
                            ...prev,
                            marital_status: e.target.value as 'single' | 'married' | 'pacs'
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="single">Célibataire</option>
                        <option value="married">Marié(e)</option>
                        <option value="pacs">Pacsé(e)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Nombre d'enfants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={fiscalSituation.children}
                        onChange={(e) => {
                          setFiscalSituation(prev => ({
                            ...prev,
                            children: parseInt(e.target.value) || 0
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Parts fiscales :</span>
                      <span className="font-semibold text-gray-900 dark:text-white ml-2">
                        {fiscalSituation.parts.toFixed(1)} part{fiscalSituation.parts > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Déductions disponibles */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Déductions et Crédits d'Impôt Disponibles
                  </h4>

                  {availableDeductions.length === 0 ? (
                    <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                      Chargement des déductions...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableDeductions.map((ded, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {ded.name}
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  ded.type === 'credit'
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                                }`}>
                                  {ded.type === 'credit' ? 'Crédit' : 'Déduction'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {ded.description}
                              </div>
                              {ded.requires_receipts && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  ⚠️ Justificatifs requis
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                // Ajouter la déduction (simplifié)
                                const newDed: FiscalDeduction = {
                                  id: crypto.randomUUID(),
                                  name: ded.name,
                                  type: ded.type,
                                  amount: 0,
                                  year: fiscalSituation.year,
                                  category: 'general',
                                  description: ded.description,
                                };
                                setSelectedDeductions([...selectedDeductions, newDed]);
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bouton préparer */}
                <button
                  onClick={prepareDeclaration}
                  disabled={preparingDeclaration || fiscalSituation.annual_income <= 0}
                  className="w-full px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold"
                >
                  {preparingDeclaration ? 'Préparation...' : '📄 Préparer la Déclaration'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

