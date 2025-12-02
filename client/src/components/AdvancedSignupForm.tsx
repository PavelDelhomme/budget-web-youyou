import { useState } from 'react';
import { Modal } from './Modal';
import { Api } from '../api';
import { GeographicSelector, GeographicLocation } from './GeographicSelector';
import { UserProfile } from '../types';

interface AdvancedSignupFormProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile, generatedBudget?: any) => void;
  onSkip: () => void;
}

export interface UserProfile {
  // Catégorie socio-professionnelle
  csp: string;
  profession?: string;
  secteur_activite?: string;
  statut_professionnel?: string;
  
  // Situation personnelle
  situation_familiale: string;
  nombre_enfants: number;
  geographic_location?: GeographicLocation; // Zone géographique détaillée
  age?: number;
  
  // Revenus
  monthly_income?: number;
  type_revenu?: string;
  
  // Parcours professionnel
  annees_experience?: number;
  niveau_etude?: string;
  situation_actuelle?: string;
  
  // Logement
  type_logement?: string;
  loyer_mensuel?: number;
  
  // Autres
  objectifs_budget?: string[];
  preferences?: string[];
}

const CSP_OPTIONS = [
  { value: 'agriculteur', label: 'Agriculteur exploitant' },
  { value: 'artisan', label: 'Artisan' },
  { value: 'commercant', label: 'Commerçant' },
  { value: 'chef_entreprise', label: 'Chef d\'entreprise' },
  { value: 'profession_liberale', label: 'Profession libérale' },
  { value: 'cadre_sup', label: 'Cadre supérieur' },
  { value: 'cadre', label: 'Cadre' },
  { value: 'prof_intermediaire', label: 'Profession intermédiaire' },
  { value: 'employe', label: 'Employé' },
  { value: 'ouvrier', label: 'Ouvrier' },
  { value: 'retraite', label: 'Retraité' },
  { value: 'chomeur', label: 'Chômeur' },
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'autre', label: 'Autre' },
];

const SITUATION_FAMILIALE = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'couple', label: 'En couple' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacs', label: 'Pacsé(e)' },
  { value: 'parent_solo', label: 'Parent solo' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf(ve)' },
];

// Zone géographique now uses GeographicSelector component

export function AdvancedSignupForm({ isOpen, onComplete, onSkip }: AdvancedSignupFormProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    csp: '',
    situation_familiale: 'celibataire',
    nombre_enfants: 0,
  });
  const [geographicLocation, setGeographicLocation] = useState<GeographicLocation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBudget, setGeneratedBudget] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  const handleNext = async () => {
    if (step === totalSteps) {
      // Generate budget before completing
      await generateBudget();
    } else {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
    setError(null);
  };

  const generateBudget = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const data = await Api.generateStatisticalBudget({
        ...profile,
        geographic_location: geographicLocation,
      });
      
      setGeneratedBudget(data.budget);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du budget');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    const profileWithLocation: UserProfile = {
      ...profile as UserProfile,
      geographic_location: geographicLocation || undefined,
    };
    onComplete(profileWithLocation, generatedBudget);
  };

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onSkip}
      title="📋 Profil détaillé pour votre budget"
      closeable={true}
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              ← Précédent
            </button>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Étape {step} / {totalSteps}
            </div>
            <button
              onClick={handleNext}
              disabled={step === totalSteps && isGenerating}
              className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-gray-100 dark:enabled:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              {step === totalSteps ? (isGenerating ? 'Génération...' : 'Générer') : 'Suivant →'}
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: Catégorie socio-professionnelle */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Catégorie socio-professionnelle
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette information nous permet d'estimer vos revenus et dépenses typiques basés sur les statistiques gouvernementales.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Catégorie socio-professionnelle *
              </label>
              <select
                value={profile.csp || ''}
                onChange={(e) => updateProfile('csp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionnez votre CSP</option>
                {CSP_OPTIONS.map(csp => (
                  <option key={csp.value} value={csp.value}>{csp.label}</option>
                ))}
              </select>
            </div>

            {profile.csp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Profession (optionnel)
                  </label>
                  <input
                    type="text"
                    value={profile.profession || ''}
                    onChange={(e) => updateProfile('profession', e.target.value)}
                    placeholder="Ex: Développeur, Enseignant, Commercial..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Secteur d'activité (optionnel)
                  </label>
                  <input
                    type="text"
                    value={profile.secteur_activite || ''}
                    onChange={(e) => updateProfile('secteur_activite', e.target.value)}
                    placeholder="Ex: Informatique, Éducation, Commerce..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Situation personnelle */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Situation personnelle
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Situation familiale *
              </label>
              <select
                value={profile.situation_familiale || 'celibataire'}
                onChange={(e) => updateProfile('situation_familiale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {SITUATION_FAMILIALE.map(sit => (
                  <option key={sit.value} value={sit.value}>{sit.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nombre d'enfants
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={profile.nombre_enfants || 0}
                onChange={(e) => updateProfile('nombre_enfants', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <GeographicSelector
              value={geographicLocation || null}
              onChange={(loc) => {
                setGeographicLocation(loc);
                updateProfile('geographic_location', loc);
              }}
              label="Zone géographique"
              required={true}
            />

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Âge (optionnel)
              </label>
              <input
                type="number"
                min="16"
                max="100"
                value={profile.age || ''}
                onChange={(e) => updateProfile('age', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Step 3: Revenus */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Revenus
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Si vous connaissez votre revenu mensuel net, indiquez-le. Sinon, nous l'estimerons à partir de votre CSP.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Revenu mensuel net (€) - optionnel
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={profile.monthly_income || ''}
                onChange={(e) => updateProfile('monthly_income', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 2500.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Si non renseigné, nous estimerons à partir de votre CSP et situation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Type de revenu principal (optionnel)
              </label>
              <select
                value={profile.type_revenu || ''}
                onChange={(e) => updateProfile('type_revenu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionnez</option>
                <option value="salaire">Salaire</option>
                <option value="allocation_chomage">Allocation chômage</option>
                <option value="retraite">Retraite</option>
                <option value="etudiant">Bourse / Aide étudiante</option>
                <option value="rsa">RSA</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Parcours professionnel */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Parcours professionnel
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Années d'expérience (optionnel)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.annees_experience || ''}
                onChange={(e) => updateProfile('annees_experience', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Niveau d'études (optionnel)
              </label>
              <select
                value={profile.niveau_etude || ''}
                onChange={(e) => updateProfile('niveau_etude', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionnez</option>
                <option value="aucun">Aucun diplôme</option>
                <option value="cap_bep">CAP / BEP</option>
                <option value="bac">Baccalauréat</option>
                <option value="bac_2">Bac +2</option>
                <option value="bac_3">Bac +3</option>
                <option value="bac_5">Bac +5</option>
                <option value="bac_8">Bac +8</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 5: Logement */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Logement
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Type de logement (optionnel)
              </label>
              <select
                value={profile.type_logement || ''}
                onChange={(e) => updateProfile('type_logement', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionnez</option>
                <option value="proprietaire">Propriétaire</option>
                <option value="locataire">Locataire</option>
                <option value="colocataire">Colocataire</option>
                <option value="loge_gratuit">Logé(e) gratuitement</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Loyer / Charges mensuelles (€) - optionnel
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={profile.loyer_mensuel || ''}
                onChange={(e) => updateProfile('loyer_mensuel', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 800.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Step 6: Génération et confirmation */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Génération de votre budget initial
            </h3>
            
            {isGenerating && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⏳ Génération de votre budget basé sur les statistiques gouvernementales...
                </p>
              </div>
            )}

            {generatedBudget && !isGenerating && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    ✅ Budget généré avec succès !
                  </h4>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p>💰 Revenu mensuel estimé : <strong>{generatedBudget.monthlySalary?.toFixed(2)} €</strong></p>
                    <p>📊 {generatedBudget.categories?.length || 0} catégories de dépenses pré-remplies</p>
                    <p>📈 Épargne annuelle estimée : <strong>{generatedBudget.estimated_annual_savings?.toFixed(2)} €</strong></p>
                    <p className="text-xs mt-2">
                      Ce budget est une estimation basée sur les statistiques de votre catégorie socio-professionnelle.
                      Vous pourrez le modifier après.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!generatedBudget && !isGenerating && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Cliquez sur "Générer" pour créer un budget initial basé sur votre profil.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Final actions */}
        {step === totalSteps && generatedBudget && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleComplete}
              className="w-full px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-semibold text-lg transition-colors"
            >
              ✅ Continuer avec ce budget
            </button>
            <button
              onClick={onSkip}
              className="w-full mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Ignorer et créer un budget manuellement
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

