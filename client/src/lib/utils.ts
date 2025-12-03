export const today = new Date();

export function toISODate(d: Date | string): string {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Évalue une expression mathématique simple de manière sécurisée
 */
function evaluateExpression(expr: string): number {
  try {
    // Normaliser l'expression
    let normalized = expr.trim().replace(/\s+/g, '');
    
    // Remplacer les virgules par des points
    normalized = normalized.replace(/,/g, '.');
    
    // Normaliser les opérateurs (x -> *)
    normalized = normalized.replace(/x/gi, '*');
    
    // Valider le format (seulement chiffres, opérateurs, points, parenthèses)
    if (!/^[\d+\-*/.()]+$/.test(normalized)) {
      return 0;
    }
    
    // Évaluer l'expression de manière sécurisée
    // On crée une fonction avec l'expression pour éviter l'injection
    const result = new Function('return (' + normalized + ')')();
    const num = Number(result);
    
    return Number.isFinite(num) ? num : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Parse un montant en acceptant les expressions mathématiques simples
 * Accepte : chiffres, opérateurs (+, -, *, /, x), virgules et points
 * Exemples : "1000+500", "2000/2", "1500*1.2", "1000-200"
 */
export function parseAmount(v: string | number): number {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  }
  
  const str = String(v).trim();
  if (!str) return 0;
  
  // Remplacer la virgule par un point pour les décimales
  let normalized = str.replace(/,/g, '.');
  
  // Normaliser les opérateurs (x -> *)
  normalized = normalized.replace(/x/gi, '*');
  
  // Vérifier si c'est une expression mathématique
  const hasOperator = /[+\-*/]/.test(normalized);
  
  if (hasOperator) {
    // Évaluer l'expression
    const result = evaluateExpression(normalized);
    return Math.round(result * 100) / 100;
  }
  
  // Sinon, parser comme un nombre simple
  const num = Number(normalized);
  if (Number.isFinite(num)) {
    return Math.round(num * 100) / 100;
  }
  
  return 0;
}

/**
 * Valide qu'une chaîne ne contient que des caractères autorisés pour les montants
 * Accepte : chiffres, opérateurs (+, -, *, /, x), virgules, points, espaces, parenthèses
 */
export function isValidAmountInput(input: string): boolean {
  if (!input) return true; // Vide est valide (sera converti en 0)
  
  const normalized = input.replace(/,/g, '.').replace(/x/gi, '*');
  const validPattern = /^[\d\s+\-*/.()]+$/;
  return validPattern.test(normalized);
}

export const currency = (n: number): string =>
  (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

// Catégories par défaut avec target à 0€ - l'utilisateur doit définir son propre budget
export const defaultCategories = [
  { id: 'achats', name: 'Achats & Loisirs', target: 0 },
  { id: 'alimentation', name: 'Alimentation', target: 0 }
];

/**
 * Génère les années par défaut basées sur l'année actuelle
 * Inclut l'année actuelle et les 4 années suivantes
 */
export function getDefaultYears(): number[] {
  const currentYear = today.getFullYear();
  return [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
}

export const INITIAL_YEARS = getDefaultYears();

