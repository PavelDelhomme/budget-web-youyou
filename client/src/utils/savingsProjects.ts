import { SavingsProject } from '../types';

// Utiliser directement Date pour éviter les dépendances circulaires
const today = new Date();

/**
 * Calcule les contributions totales aux projets d'épargne pour une année donnée
 * @param projects Liste des projets d'épargne
 * @param year Année pour laquelle calculer
 * @param currentMonth Mois actuel (1-12) pour calculer les contributions restantes
 * @returns Montant total des contributions prévues pour le reste de l'année
 */
export function calculateProjectsContributionsForYear(
  projects: SavingsProject[],
  year: number,
  currentMonth: number = today.getMonth() + 1
): number {
  if (!projects || projects.length === 0) return 0;
  
  // Si on calcule pour une année future, tous les mois comptent
  const isFutureYear = year > today.getFullYear();
  const monthsRemaining = isFutureYear ? 12 : Math.max(0, 12 - currentMonth + 1);
  
  let totalContributions = 0;
  
  for (const project of projects) {
    const targetDate = new Date(project.targetDate);
    const projectYear = targetDate.getFullYear();
    
    // Un projet est actif pour une année si sa date cible est dans l'année ou après
    // (on continue à épargner pour ce projet jusqu'à sa date cible)
    if (projectYear >= year) {
      const monthlyContrib = project.monthlyContribution || 0;
      
      if (isFutureYear) {
        // Pour les années futures, calculer sur toute l'année
        totalContributions += monthlyContrib * 12;
      } else {
        // Pour l'année en cours, seulement les mois restants
        totalContributions += monthlyContrib * monthsRemaining;
      }
    }
  }
  
  return totalContributions;
}

/**
 * Calcule la valeur projetée des projets d'épargne en fin d'année
 * @param projects Liste des projets d'épargne
 * @param year Année pour laquelle calculer
 * @param currentMonth Mois actuel (1-12)
 * @returns Valeur projetée totale des projets en fin d'année
 */
export function calculateProjectsProjectedValue(
  projects: SavingsProject[],
  year: number,
  currentMonth: number = today.getMonth() + 1
): number {
  if (!projects || projects.length === 0) return 0;
  
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const now = new Date();
  
  const isFutureYear = year > today.getFullYear();
  const monthsRemaining = isFutureYear ? 12 : Math.max(0, 12 - currentMonth + 1);
  
  let totalProjected = 0;
  
  for (const project of projects) {
    const targetDate = new Date(project.targetDate);
    
    // Vérifier si le projet est actif pour cette année
    if (targetDate >= yearStart && targetDate <= yearEnd) {
      const monthlyContrib = project.monthlyContribution || 0;
      
      if (isFutureYear) {
        // Pour les années futures : valeur actuelle + contributions sur toute l'année
        const projectedValue = Math.min(
          project.targetAmount,
          project.currentAmount + (monthlyContrib * 12)
        );
        totalProjected += projectedValue;
      } else {
        // Pour l'année en cours : valeur actuelle + contributions restantes
        const projectedValue = Math.min(
          project.targetAmount,
          project.currentAmount + (monthlyContrib * monthsRemaining)
        );
        totalProjected += projectedValue;
      }
    } else if (targetDate < yearStart) {
      // Projet déjà terminé avant cette année
      // Ne rien ajouter (ou ajouter le montant cible si on veut inclure les projets terminés)
    } else {
      // Projet commence après cette année
      // Ne rien ajouter
    }
  }
  
  return totalProjected;
}

/**
 * Calcule la valeur actuelle totale des projets d'épargne actifs pour une année
 * @param projects Liste des projets d'épargne
 * @param year Année pour laquelle calculer
 * @returns Valeur actuelle totale des projets
 */
export function calculateProjectsCurrentValue(
  projects: SavingsProject[],
  year: number
): number {
  if (!projects || projects.length === 0) return 0;
  
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  
  let totalCurrent = 0;
  
  for (const project of projects) {
    const targetDate = new Date(project.targetDate);
    
    // Projets actifs pour cette année
    if (targetDate >= yearStart && targetDate <= yearEnd) {
      totalCurrent += project.currentAmount || 0;
    }
  }
  
  return totalCurrent;
}

