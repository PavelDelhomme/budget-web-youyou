import { useState, useEffect } from 'react';
import { Modal } from '../layout/Modal';
import { BankAccount, Investment, SavingsGoal, TemporaryIncome } from '../../core/types';
import { currency, toISODate, today, parseAmount } from '../../lib/utils';

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: (data: {
    bankAccounts: BankAccount[];
    investments: Investment[];
    savingsGoals: SavingsGoal[];
    monthlySalary: number;
    monthlySalaryStartDate?: string;
    temporaryIncomes: TemporaryIncome[];
  }) => void;
  canSkip?: boolean; // Si false, bloque l'accès jusqu'à complétion
  initialData?: {
    bankAccounts?: BankAccount[];
    investments?: Investment[];
    savingsGoals?: SavingsGoal[];
    monthlySalary?: number;
    monthlySalaryStartDate?: string;
    temporaryIncomes?: TemporaryIncome[];
  }; // Données existantes pour pré-remplir le formulaire
}

export function InitializationModal({ isOpen, onComplete, canSkip = false, initialData }: InitializationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialData?.bankAccounts || []);
  const [investments, setInvestments] = useState<Investment[]>(initialData?.investments || []);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialData?.savingsGoals || []);
  const [monthlySalary, setMonthlySalary] = useState<number>(initialData?.monthlySalary || 0);
  const [monthlySalaryInput, setMonthlySalaryInput] = useState<string>(initialData?.monthlySalary?.toString() || '');
  const [monthlySalaryStartDate, setMonthlySalaryStartDate] = useState<string>(initialData?.monthlySalaryStartDate || toISODate(today));
  const [monthlySalaryIsTemporary, setMonthlySalaryIsTemporary] = useState<boolean>(false);
  const [monthlySalaryEndDate, setMonthlySalaryEndDate] = useState<string>('');
  const [temporaryIncomes, setTemporaryIncomes] = useState<TemporaryIncome[]>(initialData?.temporaryIncomes || []);

  // Reset and load data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setBankAccounts(initialData.bankAccounts || []);
      setInvestments(initialData.investments || []);
      setSavingsGoals(initialData.savingsGoals || []);
      setMonthlySalary(initialData.monthlySalary || 0);
      setMonthlySalaryInput((initialData.monthlySalary || 0).toString());
      setTemporaryIncomes(initialData.temporaryIncomes || []);
    }
  }, [isOpen, initialData]);

  const [currentAccount, setCurrentAccount] = useState({
    name: '',
    currentBalance: 0,
    accountType: 'checking' as 'checking' | 'savings' | 'pocket',
  });
  const [currentAccountBalanceInput, setCurrentAccountBalanceInput] = useState('');

  const [currentInvestment, setCurrentInvestment] = useState({
    type: 'stocks' as 'stocks' | 'crypto' | 'other',
    name: '',
    platform: '',
    currentValue: 0,
    monthlyContribution: 0,
    initialAmount: 0,
    startDate: toISODate(today),
  });
  const [currentInvestmentValueInput, setCurrentInvestmentValueInput] = useState('');
  const [currentInvestmentInitialInput, setCurrentInvestmentInitialInput] = useState('');

  const [currentGoal, setCurrentGoal] = useState({
    name: '',
    type: 'minimum' as 'minimum' | 'precaution' | 'project',
    targetAmount: 0,
    currentAmount: 0,
    priority: 1,
  });
  const [currentGoalTargetInput, setCurrentGoalTargetInput] = useState('');
  const [currentGoalCurrentInput, setCurrentGoalCurrentInput] = useState('');

  const [currentTemporaryIncome, setCurrentTemporaryIncome] = useState({
    name: '',
    type: 'allocation' as 'gift' | 'government_aid' | 'allocation' | 'bonus' | 'other',
    amount: 0,
    duration: 'permanent' as 'once' | 'months' | 'permanent',
    startDate: toISODate(today),
    endDate: '',
    numberOfMonths: 1,
    note: '',
  });
  const [currentTemporaryIncomeAmountInput, setCurrentTemporaryIncomeAmountInput] = useState('');

  function addAccount() {
    const balance = parseAmount(currentAccountBalanceInput);
    if (!currentAccount.name) return;
    setBankAccounts([
      ...bankAccounts,
      {
        id: crypto.randomUUID(),
        name: currentAccount.name,
        currentBalance: balance,
        accountType: currentAccount.accountType,
      },
    ]);
    setCurrentAccount({ name: '', currentBalance: 0, accountType: 'checking' });
    setCurrentAccountBalanceInput('');
  }

  function addInvestment() {
    if (!currentInvestment.name || !currentInvestment.platform) return;
    setInvestments([
      ...investments,
      {
        id: crypto.randomUUID(),
        ...currentInvestment,
      },
    ]);
    setCurrentInvestment({
      type: 'stocks',
      name: '',
      platform: '',
      currentValue: 0,
      monthlyContribution: 0,
      initialAmount: 0,
      startDate: toISODate(today),
    });
    setCurrentInvestmentValueInput('');
    setCurrentInvestmentInitialInput('');
  }

  function addGoal() {
    if (!currentGoal.name) return;
    setSavingsGoals([
      ...savingsGoals,
      {
        id: crypto.randomUUID(),
        ...currentGoal,
      },
    ]);
    setCurrentGoal({
      name: '',
      type: 'minimum',
      targetAmount: 0,
      currentAmount: 0,
      priority: 1,
    });
    setCurrentGoalTargetInput('');
    setCurrentGoalCurrentInput('');
  }

  function addTemporaryIncome() {
    if (!currentTemporaryIncome.name) return;
    
    const income: TemporaryIncome = {
      id: crypto.randomUUID(),
      name: currentTemporaryIncome.name,
      type: currentTemporaryIncome.type,
      amount: currentTemporaryIncome.amount,
      duration: currentTemporaryIncome.duration,
      startDate: currentTemporaryIncome.startDate,
      numberOfMonths: currentTemporaryIncome.duration === 'months' ? currentTemporaryIncome.numberOfMonths : undefined,
      endDate: currentTemporaryIncome.duration === 'months' ? (currentTemporaryIncome.endDate || calculateEndDate(currentTemporaryIncome.startDate, currentTemporaryIncome.numberOfMonths || 1)) : undefined,
      note: currentTemporaryIncome.note || undefined,
    };
    
    setTemporaryIncomes([...temporaryIncomes, income]);
    setCurrentTemporaryIncome({
      name: '',
      type: 'allocation',
      amount: 0,
      duration: 'permanent',
      startDate: toISODate(today),
      endDate: '',
      numberOfMonths: 1,
      note: '',
    });
    setCurrentTemporaryIncomeAmountInput('');
  }

  function removeTemporaryIncome(id: string) {
    setTemporaryIncomes(temporaryIncomes.filter((ti) => ti.id !== id));
  }

  function handleComplete() {
    // Validation obligatoire : au moins un compte bancaire doit être défini
    if (bankAccounts.length === 0) {
      alert('⚠️ Vous devez définir au moins un compte bancaire pour continuer. Veuillez retourner à l\'étape 1 pour ajouter un compte.');
      setStep(1); // Retourner à l'étape des comptes bancaires
      return;
    }
    
    onComplete({ 
      bankAccounts, 
      investments, 
      savingsGoals, 
      monthlySalary, 
      monthlySalaryStartDate: monthlySalary > 0 ? monthlySalaryStartDate : undefined,
      temporaryIncomes 
    });
  }

  if (!isOpen) return null;

  const totalAccounts = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  // Calculer la date de fin automatiquement si nombre de mois défini
  const calculateEndDate = (startDate: string, months: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return toISODate(end);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={canSkip ? () => {} : undefined} 
      title="📈 Configuration initiale de votre budget"
      closeable={canSkip}
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              ← Précédent
            </button>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Étape {step} / {totalSteps}
            </div>
            <button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={step === totalSteps}
              className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              Suivant →
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Guide d'aide */}
        {step === 1 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📝 Guide - Comptes bancaires</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Définissez tous vos comptes bancaires avec leur solde actuel. Cela permet de suivre votre situation financière globale.
              <br />
              <strong>Exemples :</strong> Compte principal, Revolut, Livret A, etc.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">💼 Guide - Investissements</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Indiquez vos investissements en bourse, crypto, etc. avec leur valeur actuelle et votre contribution mensuelle.
              <br />
              <strong>Exemples :</strong> ETF World (Revolut), Bitcoin (Binance) - 20€/mois, etc.
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">🎯 Guide - Objectifs d'épargne</h4>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Définissez vos objectifs d'épargne : épargne minimale, de précaution, ou pour des projets spécifiques.
              <br />
              Cela vous aidera à planifier et suivre vos économies.
            </p>
          </div>
        )}
        {step === 4 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">💼 Guide - Revenu mensuel principal</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Qu'est-ce que le revenu mensuel principal ?</strong><br />
              C'est votre source de revenu mensuelle principale <strong>actuelle</strong>, que vous recevez régulièrement chaque mois.
              <br /><br />
              <strong>Important :</strong> Même si votre revenu principal est temporaire (allocation chômage, pension temporaire, etc.), 
              indiquez-le ici. C'est votre revenu mensuel actuel sur lequel vous comptez pour vivre.
              <br /><br />
              <strong>Exemples :</strong> Salaire 2500€/mois, Allocation chômage 1200€/mois, Pension 800€/mois, Allocation 500€/mois, etc.
              <br /><br />
              <strong>Note :</strong> Si vous avez d'autres revenus qui s'ajoutent (cadeaux, bonus, aides ponctuelles), 
              vous pourrez les ajouter à l'étape suivante. Si vous n'en avez pas, vous pourrez simplement passer à l'étape suivante.
            </p>
          </div>
        )}
        {step === 5 && (
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">💰 Guide - Revenus supplémentaires</h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Cette étape est optionnelle !</strong> Si vous n'avez que votre revenu principal de l'étape précédente 
              et aucun revenu supplémentaire, vous pouvez simplement cliquer sur "Suivant" pour terminer.
              <br /><br />
              <strong>Qu'est-ce qu'un revenu supplémentaire ?</strong><br />
              Ce sont des revenus qui <strong>s'ajoutent</strong> à votre revenu mensuel principal. 
              Ce n'est <strong>PAS</strong> votre revenu principal (même temporaire), mais des revenus en plus.
              <br /><br />
              <strong>Exemples :</strong>
            </p>
            <ul className="list-disc list-inside ml-4 mt-1 text-sm text-orange-800 dark:text-orange-200">
              <li>Cadeaux d'argent (anniversaire, Noël, etc.)</li>
              <li>Bonus ponctuels</li>
              <li>Aides exceptionnelles de l'État</li>
              <li>Revenus de location temporaires</li>
              <li>Remboursements exceptionnels</li>
            </ul>
            <p className="text-sm text-orange-800 dark:text-orange-200 mt-2">
              <strong>Types :</strong> Une seule fois, sur plusieurs mois, ou permanents. Vous pouvez en ajouter plusieurs ou aucun.
            </p>
          </div>
        )}

        {/* Step 1: Comptes bancaires */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Vos comptes bancaires</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Définissez vos différents comptes (Revolut, compte principal, etc.)
            </p>

            <div className="space-y-2 border border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom du compte</label>
              <input
                type="text"
                value={currentAccount.name}
                onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
                placeholder="Ex: Revolut, Compte principal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Solde actuel (€)</label>
              <input
                type="text"
                value={currentAccountBalanceInput}
                onChange={(e) => {
                  setCurrentAccountBalanceInput(e.target.value);
                  const balance = parseAmount(e.target.value);
                  setCurrentAccount({ ...currentAccount, currentBalance: balance });
                }}
                placeholder="Ex: 1234,56 ou 1234.56"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type de compte</label>
              <select
                value={currentAccount.accountType}
                onChange={(e) =>
                  setCurrentAccount({ ...currentAccount, accountType: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="checking">Compte courant</option>
                <option value="savings">Épargne</option>
                <option value="pocket">Poche (Revolut)</option>
              </select>

              <button
                onClick={addAccount}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Ajouter
              </button>
            </div>

            {bankAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Comptes ajoutés :</h4>
                {bankAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{acc.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({acc.accountType})</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{currency(acc.currentBalance)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white">Total : {currency(totalAccounts)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Investissements */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Vos investissements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Définissez vos investissements (bourse, crypto, etc.)
            </p>

            <div className="space-y-2 border border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
              <select
                value={currentInvestment.type}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="stocks">Bourse</option>
                <option value="crypto">Crypto</option>
                <option value="other">Autre</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom</label>
              <input
                type="text"
                value={currentInvestment.name}
                onChange={(e) => setCurrentInvestment({ ...currentInvestment, name: e.target.value })}
                placeholder="Ex: ETF World, Bitcoin"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Plateforme</label>
              <input
                type="text"
                value={currentInvestment.platform}
                onChange={(e) =>
                  setCurrentInvestment({ ...currentInvestment, platform: e.target.value })
                }
                placeholder="Ex: Revolut, Binance"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Valeur actuelle totale de vos actifs (€)</label>
              <input
                type="text"
                value={currentInvestmentValueInput}
                onChange={(e) => {
                  setCurrentInvestmentValueInput(e.target.value);
                  const value = parseAmount(e.target.value);
                  setCurrentInvestment({
                    ...currentInvestment,
                    currentValue: value,
                  });
                }}
                placeholder="Ex: 1234,56 ou 1234.56 ou 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Contribution mensuelle (€) <span className="text-gray-500 dark:text-gray-400 text-xs">(optionnel)</span></label>
              <input
                type="text"
                value={currentInvestment.monthlyContribution === 0 ? '' : currentInvestment.monthlyContribution.toString().replace('.', ',')}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    monthlyContribution: parseAmount(e.target.value),
                  })
                }
                placeholder="Ex: 20,00 ou laissez vide si aucun versement régulier"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant initial investi (€)</label>
              <input
                type="text"
                value={currentInvestmentInitialInput}
                onChange={(e) => {
                  setCurrentInvestmentInitialInput(e.target.value);
                  const initial = parseAmount(e.target.value);
                  setCurrentInvestment({
                    ...currentInvestment,
                    initialAmount: initial,
                  });
                }}
                placeholder="Ex: 500,00 ou 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début d'investissement</label>
              <input
                type="date"
                value={currentInvestment.startDate}
                onChange={(e) =>
                  setCurrentInvestment({
                    ...currentInvestment,
                    startDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <button
                onClick={addInvestment}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Ajouter
              </button>
            </div>

            {investments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Investissements ajoutés :</h4>
                {investments.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{inv.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({inv.platform})</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{currency(inv.currentValue)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white">Total : {currency(totalInvestments)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Objectifs d'épargne */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Objectifs d'épargne</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Définissez vos objectifs d'épargne (minimum, précaution, projets)
            </p>

            <div className="space-y-2 border border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom</label>
              <input
                type="text"
                value={currentGoal.name}
                onChange={(e) => setCurrentGoal({ ...currentGoal, name: e.target.value })}
                placeholder="Ex: Épargne de précaution"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
              <select
                value={currentGoal.type}
                onChange={(e) => setCurrentGoal({ ...currentGoal, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="minimum">Épargne minimale</option>
                <option value="precaution">Épargne de précaution</option>
                <option value="project">Projet</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant cible (€)</label>
              <input
                type="text"
                value={currentGoalTargetInput}
                onChange={(e) => {
                  setCurrentGoalTargetInput(e.target.value);
                  const target = parseAmount(e.target.value);
                  setCurrentGoal({ ...currentGoal, targetAmount: target });
                }}
                placeholder="Ex: 5000,00 ou 5000.00 ou 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant actuel (€)</label>
              <input
                type="text"
                value={currentGoalCurrentInput}
                onChange={(e) => {
                  setCurrentGoalCurrentInput(e.target.value);
                  const current = parseAmount(e.target.value);
                  setCurrentGoal({ ...currentGoal, currentAmount: current });
                }}
                placeholder="Ex: 1000,00 ou 1000.00 ou 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Priorité (1 = plus important)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentGoal.priority}
                onChange={(e) =>
                  setCurrentGoal({ ...currentGoal, priority: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <button
                onClick={addGoal}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Ajouter
              </button>
            </div>

            {savingsGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Objectifs ajoutés :</h4>
                {savingsGoals.map((goal) => (
                  <div key={goal.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{goal.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{goal.type}</span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Revenu mensuel principal */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Votre revenu mensuel principal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Indiquez votre revenu mensuel principal actuel (votre source de revenu mensuelle principale en ce moment)
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-2">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>💡 Important :</strong> Même si votre revenu principal est temporaire (ex: allocation chômage, pension temporaire), 
                indiquez-le ici. C'est votre revenu mensuel actuel que vous recevez régulièrement chaque mois.
              </p>
            </div>

            <div className="space-y-2 border border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Revenu mensuel principal net (€)</label>
              <input
                type="text"
                value={monthlySalaryInput}
                onChange={(e) => {
                  setMonthlySalaryInput(e.target.value);
                  setMonthlySalary(parseAmount(e.target.value) || 0);
                }}
                placeholder="Ex: 2500,00 ou 2500.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <strong>Exemples :</strong> Salaire 2500€/mois, Allocation chômage 1200€/mois (même si temporaire), 
                Pension 800€/mois, Allocation 500€/mois, ou 0€ si aucun revenu principal
              </p>
              {monthlySalary > 0 && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <strong>Revenu annuel estimé (si permanent) :</strong> {currency(monthlySalary * 12)}
                  </p>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début du revenu</label>
                    <input
                      type="date"
                      value={monthlySalaryStartDate}
                      onChange={(e) => setMonthlySalaryStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Quand avez-vous commencé à recevoir ce revenu ? (ex: début de l'allocation chômage)
                    </p>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isTemporary"
                      checked={monthlySalaryIsTemporary}
                      onChange={(e) => {
                        setMonthlySalaryIsTemporary(e.target.checked);
                        if (!e.target.checked) {
                          setMonthlySalaryEndDate('');
                        }
                      }}
                      className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    <label htmlFor="isTemporary" className="text-sm font-medium text-gray-900 dark:text-white">
                      Ce revenu est temporaire (aura une date de fin)
                    </label>
                  </div>
                  {monthlySalaryIsTemporary && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de fin prévue (optionnel)</label>
                      <input
                        type="date"
                        value={monthlySalaryEndDate}
                        onChange={(e) => setMonthlySalaryEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Quand ce revenu devrait se terminer ? (ex: fin de l'allocation chômage). Laissez vide si vous ne savez pas encore.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {monthlySalary === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Pas de revenu principal défini.</strong> Vous pourrez ajouter des revenus supplémentaires à l'étape suivante.
                  <br />
                  Si vous avez un revenu mensuel (même temporaire comme une allocation chômage), il est recommandé de le définir ici plutôt qu'en revenu supplémentaire.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Revenus temporaires */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Revenus supplémentaires / ponctuels</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ajoutez les revenus supplémentaires qui s'ajoutent à votre revenu principal mensuel
            </p>
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-2">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>💡 À savoir :</strong> Cette étape est pour les revenus <strong>supplémentaires</strong> qui s'ajoutent 
                à votre revenu principal de l'étape 4. Si vous n'avez que votre allocation chômage et rien d'autre, 
                vous pouvez passer cette étape (cliquer sur "Suivant").
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                <strong>Exemples de revenus supplémentaires :</strong> Cadeaux, bonus ponctuels, aides exceptionnelles, 
                revenus de location temporaires, etc.
              </p>
            </div>

            <div className="space-y-2 border border-gray-300 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom / Description</label>
              <input
                type="text"
                value={currentTemporaryIncome.name}
                onChange={(e) => setCurrentTemporaryIncome({ ...currentTemporaryIncome, name: e.target.value })}
                placeholder="Ex: Aide de l'État, Cadeau d'anniversaire, Prime"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
              <select
                value={currentTemporaryIncome.type}
                onChange={(e) => setCurrentTemporaryIncome({ ...currentTemporaryIncome, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="allocation">Allocation (APL, RSA, etc.)</option>
                <option value="government_aid">Aide de l'État</option>
                <option value="gift">Cadeau</option>
                <option value="bonus">Prime / Bonus</option>
                <option value="other">Autre</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant (€)</label>
              <input
                type="text"
                value={currentTemporaryIncomeAmountInput}
                onChange={(e) => {
                  setCurrentTemporaryIncomeAmountInput(e.target.value);
                  const amount = parseAmount(e.target.value);
                  setCurrentTemporaryIncome({
                    ...currentTemporaryIncome,
                    amount: amount,
                  });
                }}
                placeholder="Ex: 500,00 ou 500.00 ou 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Durée</label>
              <select
                value={currentTemporaryIncome.duration}
                onChange={(e) =>
                  setCurrentTemporaryIncome({
                    ...currentTemporaryIncome,
                    duration: e.target.value as any,
                    endDate: e.target.value === 'once' || e.target.value === 'permanent' ? '' : calculateEndDate(currentTemporaryIncome.startDate, currentTemporaryIncome.numberOfMonths || 1),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="permanent">Permanent (mensuel récurrent)</option>
                <option value="once">Une seule fois</option>
                <option value="months">Sur plusieurs mois</option>
              </select>

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début</label>
              <input
                type="date"
                value={currentTemporaryIncome.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setCurrentTemporaryIncome({
                    ...currentTemporaryIncome,
                    startDate: newStartDate,
                    endDate: currentTemporaryIncome.duration === 'months' 
                      ? calculateEndDate(newStartDate, currentTemporaryIncome.numberOfMonths || 1)
                      : currentTemporaryIncome.endDate,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              {currentTemporaryIncome.duration === 'permanent' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded border border-blue-200 dark:border-blue-700">
                  💡 Ce revenu sera comptabilisé chaque mois à partir de la date de début.
                </p>
              )}
              {currentTemporaryIncome.duration === 'months' && (
                <>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">Nombre de mois</label>
                  <input
                    type="number"
                    min="1"
                    value={currentTemporaryIncome.numberOfMonths || 1}
                    onChange={(e) => {
                      const months = parseInt(e.target.value) || 1;
                      setCurrentTemporaryIncome({
                        ...currentTemporaryIncome,
                        numberOfMonths: months,
                        endDate: calculateEndDate(currentTemporaryIncome.startDate, months),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {currentTemporaryIncome.endDate && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Date de fin calculée : {new Date(currentTemporaryIncome.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </>
              )}

              <label className="block text-sm font-medium text-gray-900 dark:text-white">Note (optionnel)</label>
              <input
                type="text"
                value={currentTemporaryIncome.note}
                onChange={(e) => setCurrentTemporaryIncome({ ...currentTemporaryIncome, note: e.target.value })}
                placeholder="Informations complémentaires"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />

              <button
                onClick={addTemporaryIncome}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Ajouter
              </button>
            </div>

            {temporaryIncomes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Revenus temporaires ajoutés :</h4>
                {temporaryIncomes.map((ti) => (
                  <div key={ti.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{ti.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {ti.type === 'gift' ? 'Cadeau' : 
                         ti.type === 'government_aid' ? 'Aide de l\'État' : 
                         ti.type === 'allocation' ? 'Allocation' :
                         ti.type === 'bonus' ? 'Prime' : 'Autre'} • 
                        {ti.duration === 'permanent' ? ' Permanent' :
                         ti.duration === 'once' ? ' Une fois' : ` ${ti.numberOfMonths} mois`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Du {new Date(ti.startDate).toLocaleDateString('fr-FR')}
                        {ti.endDate && ` au ${new Date(ti.endDate).toLocaleDateString('fr-FR')}`}
                        {ti.duration === 'permanent' && ' (récurrent)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">{currency(ti.amount)}</span>
                        {ti.duration === 'permanent' && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 block">/mois</span>
                        )}
                        {ti.duration === 'months' && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 block">
                            /mois = {currency((ti.amount * (ti.numberOfMonths || 1)))} total
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeTemporaryIncome(ti.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Total mensuel récurrent :</strong> {currency(
                      temporaryIncomes
                        .filter(ti => ti.duration === 'permanent' || ti.duration === 'months')
                        .reduce((sum, ti) => sum + ti.amount, 0)
                    )}/mois
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Total ponctuel :</strong> {currency(
                      temporaryIncomes
                        .filter(ti => ti.duration === 'once')
                        .reduce((sum, ti) => sum + ti.amount, 0)
                    )}
                  </p>
                </div>
              </div>
            )}

            {temporaryIncomes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                Aucun revenu temporaire ajouté. Vous pouvez passer cette étape si vous n'en avez pas.
              </p>
            )}
          </div>
        )}

        {/* Final step: Summary and complete */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {step === totalSteps && (
            <>
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">📊 Récapitulatif</h4>
                <div className="text-sm space-y-1 text-gray-900 dark:text-white">
                  <p>✅ Comptes bancaires : {bankAccounts.length} (Total: {currency(totalAccounts)})</p>
                  <p>✅ Investissements : {investments.length} (Total: {currency(totalInvestments)})</p>
                  <p>✅ Objectifs d'épargne : {savingsGoals.length}</p>
                  <p>✅ Revenu mensuel principal : {currency(monthlySalary)}</p>
                  <p>✅ Revenus temporaires : {temporaryIncomes.length}</p>
                </div>
              </div>
              <button
                onClick={handleComplete}
                disabled={bankAccounts.length === 0}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-lg transition-colors ${
                  bankAccounts.length === 0
                    ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                }`}
                title={bankAccounts.length === 0 ? 'Vous devez définir au moins un compte bancaire pour continuer' : ''}
              >
                {bankAccounts.length === 0 
                  ? '⚠️ Ajoutez au moins un compte bancaire pour continuer'
                  : '✅ Terminer la configuration et accéder à l\'interface'
                }
              </button>
              {bankAccounts.length === 0 && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                  ⚠️ Un compte bancaire est obligatoire. Veuillez retourner à l'étape 1 pour en ajouter un.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}