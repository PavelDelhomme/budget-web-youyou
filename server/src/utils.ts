import * as fs from 'fs';
import * as path from 'path';
import { UserData, YearData } from './types';

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o775 });
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '_');
}

export function getUserFilePath(email: string): string {
  const safe = sanitizeEmail(email);
  return path.join(DATA_DIR, `${safe}.json`);
}

export function loadUser(email: string): UserData {
  const filePath = getUserFilePath(email);
  
  if (!fs.existsSync(filePath)) {
    const initial: UserData = {
      years: [2026, 2027, 2028, 2029, 2030],
      datasets: {}
    };
    saveUser(email, initial);
    return initial;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as UserData;
    return {
      years: Array.isArray(data.years) ? data.years : [2026, 2027, 2028, 2029, 2030],
      datasets: data.datasets || {}
    };
  } catch (error) {
    // Return default if file is corrupted
    return {
      years: [2026, 2027, 2028, 2029, 2030],
      datasets: {}
    };
  }
}

export function saveUser(email: string, data: UserData): void {
  const filePath = getUserFilePath(email);
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2) + '\n',
    'utf-8'
  );
}

export function getDefaultYearData(): YearData {
  return {
    categories: [
      { id: 'achats', name: 'Achats & Loisirs', target: 2400 },
      { id: 'alimentation', name: 'Alimentation', target: 2400 }
    ],
    expenses: [],
    subs: []
  };
}

