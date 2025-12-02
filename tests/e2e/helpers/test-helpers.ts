import { Page, expect } from '@playwright/test';

/**
 * Helpers pour les tests E2E
 */

export const TEST_EMAIL = 'dev@delhomme.ovh';
export const TEST_PASSWORD = '5n!B@#c*ymgEBYXrWdKE';

/**
 * Se connecter à l'application
 */
export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/');
  
  // Attendre que le formulaire de connexion soit visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Trouver et remplir le champ email
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(email);
  
  // Trouver et remplir le champ password
  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  await passwordInput.fill(password);
  
  // Cliquer sur le bouton de connexion
  const loginButton = page.locator('button:has-text("Se connecter"), button[type="submit"]').first();
  await expect(loginButton).toBeVisible({ timeout: 5000 });
  await loginButton.click();
  
  // Attendre la navigation ou le chargement du dashboard
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
  
  // Vérifier qu'on est connecté (le formulaire de login ne doit plus être visible ou on voit le dashboard)
  const loginForm = page.locator('input[type="email"]');
  // Si le formulaire est toujours là après 5 secondes, vérifier qu'il n'est pas visible
  try {
    await expect(loginForm.first()).not.toBeVisible({ timeout: 5000 });
  } catch {
    // Le formulaire est peut-être encore là, vérifier qu'on voit au moins le sidebar ou dashboard
    const sidebar = page.locator('text=/Budget Annuel/i, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  }
}

/**
 * Attendre que l'application soit chargée
 */
export async function waitForAppLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Trouver un élément et vérifier qu'il existe avant de l'utiliser
 */
export async function findAndVerifyElement(page: Page, selector: string, description: string, timeout = 10000) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible({ timeout, message: `L'élément "${description}" devrait être visible (sélecteur: ${selector})` });
  return element;
}

/**
 * Cliquer sur un élément avec vérification
 */
export async function clickElement(page: Page, selector: string, description: string, timeout = 10000) {
  const element = await findAndVerifyElement(page, selector, description, timeout);
  await element.click();
  await page.waitForTimeout(500); // Attendre un peu après le clic
}

/**
 * Vérifier qu'une notification ou message d'erreur s'affiche
 */
export async function expectNotification(page: Page, text: string) {
  const notification = page.locator(`text=${text}`).first();
  await expect(notification).toBeVisible({ timeout: 5000 });
}

/**
 * Vérifier qu'un élément est visible avec retry
 */
export async function expectVisibleWithRetry(page: Page, selector: string, timeout = 5000) {
  await expect(page.locator(selector).first()).toBeVisible({ timeout });
}

/**
 * Remplir un champ avec gestion d'erreur
 */
export async function safeFill(page: Page, selector: string, value: string, description?: string) {
  const element = await findAndVerifyElement(page, selector, description || `Champ avec sélecteur ${selector}`);
  await element.fill(value);
}

/**
 * Cliquer sur un bouton avec gestion d'erreur
 */
export async function safeClick(page: Page, selector: string, description?: string) {
  await clickElement(page, selector, description || `Bouton avec sélecteur ${selector}`);
}

/**
 * Parser un montant affiché (gère les formats français)
 */
export function parseAmount(text: string): number {
  // Supprime les espaces et remplace la virgule par un point
  const cleaned = text.replace(/\s/g, '').replace(',', '.').replace('€', '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Attendre qu'un élément disparaisse
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Vérifier qu'une erreur API ne s'affiche pas dans la console
 */
export async function checkNoApiErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorer certaines erreurs attendues
      if (!text.includes('favicon') && !text.includes('404') && !text.includes('401')) {
        errors.push(text);
      }
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * Naviguer vers une année spécifique
 */
export async function navigateToYear(page: Page, year: number | string) {
  const yearButton = page.locator(`button:has-text("${year}"), a:has-text("${year}")`).first();
  await expect(yearButton).toBeVisible({ timeout: 10000, message: `Le bouton pour l'année ${year} devrait être visible` });
  await yearButton.click();
  await page.waitForTimeout(2000);
  await waitForAppLoad(page);
}
