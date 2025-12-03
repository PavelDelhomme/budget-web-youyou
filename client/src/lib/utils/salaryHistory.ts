import { SalaryHistory } from '../../core/types';
import { today } from '../utils';

/**
 * Calcule le salaire actif actuel depuis l'historique des salaires
 * Un salaire est actif s'il n'a pas de date de fin ou si sa date de fin est dans le futur
 * Retourne le salaire le plus récent si plusieurs salaires sont actifs
 */
export function getActiveSalary(salaryHistory: SalaryHistory[] | undefined): number | null {
  if (!salaryHistory || salaryHistory.length === 0) {
    return null;
  }
  
  const now = today;
  
  // Trouver tous les salaires actifs (sans date de fin ou date de fin dans le futur)
  const activeSalaries = salaryHistory.filter(salary => {
    if (!salary.endDate) {
      // Pas de date de fin = toujours actif si la date de début est passée ou aujourd'hui
      return new Date(salary.startDate) <= now;
    }
    // Date de fin dans le futur = actif
    return new Date(salary.endDate) >= now && new Date(salary.startDate) <= now;
  });
  
  if (activeSalaries.length === 0) {
    return null;
  }
  
  // Prendre le salaire le plus récent (date de début la plus récente)
  const mostRecent = activeSalaries.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB.getTime() - dateA.getTime();
  })[0];
  
  return mostRecent.amount;
}

/**
 * Calcule le salaire actif pour une année spécifique
 */
export function getActiveSalaryForYear(salaryHistory: SalaryHistory[] | undefined, year: number): number | null {
  if (!salaryHistory || salaryHistory.length === 0) {
    return null;
  }
  
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  
  // Trouver tous les salaires actifs pour cette année
  const activeSalaries = salaryHistory.filter(salary => {
    const startDate = new Date(salary.startDate);
    const endDate = salary.endDate ? new Date(salary.endDate) : null;
    
    // Le salaire doit avoir commencé avant ou pendant l'année
    if (startDate > yearEnd) {
      return false;
    }
    
    // Si pas de date de fin, actif jusqu'à la fin de l'année
    if (!endDate) {
      return true;
    }
    
    // Si date de fin, doit être après le début de l'année
    return endDate >= yearStart;
  });
  
  if (activeSalaries.length === 0) {
    return null;
  }
  
  // Pour une année donnée, prendre le salaire le plus récent qui a commencé avant ou pendant l'année
  const mostRecent = activeSalaries.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB.getTime() - dateA.getTime();
  })[0];
  
  return mostRecent.amount;
}

/**
 * Calcule les revenus annuels depuis l'historique des salaires pour une année donnée
 * Prend en compte les changements de salaire au cours de l'année
 */
export function calculateAnnualIncomeFromSalaryHistory(
  salaryHistory: SalaryHistory[] | undefined,
  year: number
): number {
  if (!salaryHistory || salaryHistory.length === 0) {
    return 0;
  }
  
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  
  // Trier les salaires par date de début
  const sortedSalaries = [...salaryHistory].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  let totalAnnualIncome = 0;
  
  // Pour chaque salaire actif pendant cette année
  for (const salary of sortedSalaries) {
    const startDate = new Date(salary.startDate);
    const endDate = salary.endDate ? new Date(salary.endDate) : null;
    
    // Ignorer les salaires qui commencent après la fin de l'année
    if (startDate > yearEnd) {
      continue;
    }
    
    // Ignorer les salaires qui se terminent avant le début de l'année
    if (endDate && endDate < yearStart) {
      continue;
    }
    
    // Calculer le nombre de mois actifs dans l'année
    const effectiveStart = startDate < yearStart ? yearStart : startDate;
    const effectiveEnd = endDate && endDate < yearEnd ? endDate : yearEnd;
    
    // Calculer le nombre de mois entre effectiveStart et effectiveEnd (inclus)
    const monthsActive = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 +
                         (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1;
    
    // Ajouter les revenus pour ces mois
    totalAnnualIncome += salary.amount * Math.max(0, monthsActive);
  }
  
  return totalAnnualIncome;
}

