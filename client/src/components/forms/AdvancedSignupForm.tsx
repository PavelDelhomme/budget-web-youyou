import { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Api } from '../../core/api';
import { GeographicSelector, GeographicLocation } from '../ui/GeographicSelector';
import { ScrollableSelect } from '../ui/ScrollableSelect';
import { AutocompleteSelect } from '../ui/AutocompleteSelect';
import { UserProfile } from '../../core/types';
import { CSP_OPTIONS } from '../../core/cspOptions';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const totalSteps = 6;

  // Validation des champs avec gestion des erreurs par champ
  const validateFields = (currentStep: number): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let isValid = true;

    switch (currentStep) {
      case 1: // Catégorie socio-professionnelle
        if (!profile.csp || profile.csp.trim() === '') {
          errors.csp = 'Ce champ est obligatoire';
          isValid = false;
        }
        break;
      
      case 2: // Situation personnelle
        if (!profile.situation_familiale || profile.situation_familiale.trim() === '') {
          errors.situation_familiale = 'Ce champ est obligatoire';
          isValid = false;
        }
        if (profile.nombre_enfants === undefined || profile.nombre_enfants < 0) {
          errors.nombre_enfants = 'Ce champ est obligatoire';
          isValid = false;
        }
        if (!geographicLocation || !geographicLocation.country) {
          errors.geographicLocation = 'Ce champ est obligatoire';
          isValid = false;
        }
        break;
      
      default:
        break;
    }

    return { isValid, errors };
  };

  // Validation silencieuse (sans afficher d'erreur) - pour le bouton disabled
  const isValidStep = (currentStep: number): boolean => {
    return validateFields(currentStep).isValid;
  };

  // Validation avec message d'erreur - pour handleNext
  const validateStep = (currentStep: number): boolean => {
    const { isValid, errors } = validateFields(currentStep);
    
    if (!isValid) {
      setFieldErrors(errors);
      setTouchedFields(new Set(Object.keys(errors)));
      
      // Afficher un message d'erreur global avec la liste des champs manquants
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const fieldNames = errorFields.map(field => {
          switch(field) {
            case 'csp': return 'Catégorie socio-professionnelle';
            case 'situation_familiale': return 'Situation familiale';
            case 'nombre_enfants': return 'Nombre d\'enfants';
            case 'geographicLocation': return 'Zone géographique';
            default: return field;
          }
        });
        setError(`Veuillez remplir ${errorFields.length > 1 ? 'les champs obligatoires suivants' : 'le champ obligatoire suivant'} : ${fieldNames.join(', ')}`);
      } else {
        setError('Veuillez remplir tous les champs obligatoires marqués d\'un *');
      }
      return false;
    }
    
    // Effacer les erreurs si tout est valide
    setFieldErrors({});
    setError(null);
    return true;
  };

  const handleNext = async (e?: React.MouseEvent) => {
    // Toujours valider l'étape actuelle avant de continuer
    const { isValid, errors } = validateFields(step);
    
    if (!isValid) {
      // Marquer tous les champs en erreur comme "touchés" pour afficher les erreurs
      const allErrorFields = new Set(Object.keys(errors));
      setTouchedFields(allErrorFields);
      setFieldErrors(errors);
      
      // Afficher un message d'erreur global avec les noms des champs
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const fieldNames = errorFields.map(field => {
          switch(field) {
            case 'csp': return 'Catégorie socio-professionnelle';
            case 'situation_familiale': return 'Situation familiale';
            case 'nombre_enfants': return 'Nombre d\'enfants';
            case 'geographicLocation': return 'Zone géographique';
            default: return field;
          }
        });
        setError(`Veuillez remplir ${errorFields.length > 1 ? 'les champs obligatoires suivants' : 'le champ obligatoire suivant'} : ${fieldNames.join(', ')}`);
      } else {
        setError('Veuillez remplir tous les champs obligatoires marqués d\'un *');
      }
      
      // Faire défiler vers le premier champ en erreur
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(`[data-field-error="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus sur le champ en erreur si c'est un input/select
          const inputElement = errorElement.querySelector('input, select, button');
          if (inputElement) {
            (inputElement as HTMLElement).focus();
          }
        }
      }, 100);
      
      return;
    }
    
    // Si validation OK, continuer
    if (step === totalSteps) {
      // Generate budget before completing
      await generateBudget();
    } else {
      setStep(step + 1);
      setError(null);
      setFieldErrors({});
      setTouchedFields(new Set());
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
    // Marquer le champ comme touché
    setTouchedFields(prev => new Set(prev).add(key));
    // Effacer l'erreur du champ s'il est maintenant valide
    if (fieldErrors[key as string]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key as string];
        return newErrors;
      });
      setError(null);
    }
  };

  const hasFieldError = (fieldName: string): boolean => {
    // Afficher l'erreur si le champ est en erreur ET (touché OU si on a des erreurs de validation)
    return !!(fieldErrors[fieldName] && (touchedFields.has(fieldName) || Object.keys(fieldErrors).length > 0));
  };

  const getFieldError = (fieldName: string): string | undefined => {
    if (hasFieldError(fieldName)) {
      // Message d'erreur personnalisé ou message par défaut
      return fieldErrors[fieldName] || 'Ce champ est obligatoire';
    }
    return undefined;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onSkip}
      title="📋 Profil détaillé pour votre budget"
      closeable={false}
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
              type="button"
              onClick={handleNext}
              disabled={step === totalSteps && isGenerating}
              className={`px-3 py-1 text-sm rounded text-gray-700 dark:text-gray-300 font-medium transition-all ${
                !isValidStep(step)
                  ? 'opacity-60 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
              }`}
              title={!isValidStep(step) ? 'Cliquez pour voir les champs obligatoires manquants' : ''}
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
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg shadow-md animate-pulse">
            <div className="flex items-start gap-2">
              <span className="text-red-500 text-xl font-bold flex-shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Champs obligatoires manquants
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
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
            
            <div data-field-error="csp">
              <label className={`block text-sm font-medium mb-2 ${
                hasFieldError('csp')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                Catégorie socio-professionnelle <span className="text-red-500 font-bold">*</span>
              </label>
              <AutocompleteSelect
                value={profile.csp || ''}
                onChange={(value) => {
                  updateProfile('csp', value);
                }}
                options={CSP_OPTIONS}
                placeholder="Rechercher votre catégorie socio-professionnelle..."
                required
                error={hasFieldError('csp')}
              />
              {hasFieldError('csp') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {getFieldError('csp') || 'Ce champ est obligatoire'}
                </p>
              )}
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
            
            <div data-field-error="situation_familiale">
              <label className={`block text-sm font-medium mb-2 ${
                hasFieldError('situation_familiale')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                Situation familiale <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={profile.situation_familiale || 'celibataire'}
                onChange={(e) => updateProfile('situation_familiale', e.target.value)}
                className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                  hasFieldError('situation_familiale')
                    ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 ring-2 ring-red-300 dark:ring-red-800'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                }`}
              >
                {SITUATION_FAMILIALE.map(sit => (
                  <option key={sit.value} value={sit.value}>{sit.label}</option>
                ))}
              </select>
              {hasFieldError('situation_familiale') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {getFieldError('situation_familiale') || 'Ce champ est obligatoire'}
                </p>
              )}
            </div>

            <div data-field-error="nombre_enfants">
              <label className={`block text-sm font-medium mb-2 ${
                hasFieldError('nombre_enfants')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                Nombre d'enfants <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={profile.nombre_enfants ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  updateProfile('nombre_enfants', val);
                }}
                className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                  hasFieldError('nombre_enfants')
                    ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 ring-2 ring-red-300 dark:ring-red-800'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                }`}
                required
              />
              {hasFieldError('nombre_enfants') ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {getFieldError('nombre_enfants') || 'Ce champ est obligatoire'}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Indiquez 0 si vous n'avez pas d'enfants
                </p>
              )}
            </div>

            <div data-field-error="geographicLocation">
              <label className={`block text-sm font-medium mb-2 ${
                hasFieldError('geographicLocation')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                Zone géographique <span className="text-red-500 font-bold">*</span>
              </label>
              <div className={hasFieldError('geographicLocation') ? 'ring-2 ring-red-300 dark:ring-red-800 rounded-lg p-2' : ''}>
                <GeographicSelector
                  value={geographicLocation || null}
                  onChange={(loc) => {
                    setGeographicLocation(loc);
                    updateProfile('geographic_location', loc);
                    setTouchedFields(prev => new Set(prev).add('geographicLocation'));
                  }}
                  label=""
                  required={true}
                />
              </div>
              {hasFieldError('geographicLocation') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {getFieldError('geographicLocation') || 'Ce champ est obligatoire'}
                </p>
              )}
            </div>

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

