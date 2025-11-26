export const today = new Date();

export function toISODate(d: Date | string): string {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function parseAmount(v: string | number): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export const currency = (n: number): string =>
  (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const defaultCategories = [
  { id: 'achats', name: 'Achats & Loisirs', target: 2400 },
  { id: 'alimentation', name: 'Alimentation', target: 2400 }
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

