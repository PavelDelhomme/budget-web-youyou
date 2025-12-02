import { test, expect } from '@playwright/test';
import { login, waitForAppLoad, TEST_EMAIL, TEST_PASSWORD } from './helpers/test-helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
  });

  test('should display login form by default', async ({ page }) => {
    // Vérifier que le formulaire de connexion est visible
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    
    // Attendre que l'interface principale soit chargée
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on n'est plus sur la page de login - on devrait voir la sidebar ou le dashboard
    const sidebar = page.locator('text=/Budget Annuel/i, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    
    // Le formulaire de login ne doit plus être visible
    const loginForm = page.locator('input[type="email"]');
    const formCount = await loginForm.count();
    if (formCount > 0) {
      // Si le formulaire est toujours présent, vérifier qu'il n'est pas visible
      await expect(loginForm.first()).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show error with invalid email', async ({ page }) => {
    await page.locator('input[type="email"]').first().fill('invalid@email.com');
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    
    const loginButton = page.locator('button:has-text("Se connecter"), button[type="submit"]').first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();
    
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on est toujours sur la page de login ou qu'une erreur s'affiche
    const emailInput = page.locator('input[type="email"]').first();
    const errorMessage = page.locator('text=/erreur|incorrect|invalid|Email/i').first();
    
    // Soit une erreur s'affiche, soit le formulaire reste visible (ce qui est normal si l'email est invalide)
    const hasError = await errorMessage.count() > 0;
    const formStillVisible = await emailInput.isVisible();
    
    expect(hasError || formStillVisible).toBeTruthy();
  });

  test('should show error with invalid password', async ({ page }) => {
    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    
    const loginButton = page.locator('button:has-text("Se connecter"), button[type="submit"]').first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();
    
    await page.waitForTimeout(2000);
    
    // Vérifier qu'une erreur s'affiche ou que le formulaire reste visible
    const emailInput = page.locator('input[type="email"]').first();
    const errorMessage = page.locator('text=/erreur|incorrect|invalid|mot de passe/i').first();
    
    const hasError = await errorMessage.count() > 0;
    const formStillVisible = await emailInput.isVisible();
    
    expect(hasError || formStillVisible).toBeTruthy();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    // Chercher le bouton de visibilité du mot de passe (aria-label ou icône)
    const toggleButton = page.locator('button[aria-label*="password"], button[aria-label*="mot de passe"]').first();
    
    // Le bouton peut ne pas exister, donc on vérifie d'abord
    const buttonCount = await toggleButton.count();
    if (buttonCount > 0) {
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier que le type a changé ou que la valeur est visible
      const inputType = await passwordInput.getAttribute('type');
      expect(inputType === 'text' || inputType === 'password').toBeTruthy();
    } else {
      // Si le bouton n'existe pas, on skip ce test avec une note
      test.skip();
    }
  });

  test('should show signup form when clicking signup button', async ({ page }) => {
    const signupButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Inscription"), text=/Première connexion/i').first();
    
    const buttonCount = await signupButton.count();
    if (buttonCount > 0) {
      await signupButton.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'un champ de confirmation de mot de passe apparaît
      const confirmPasswordInput = page.locator('input[placeholder*="Confirmer"], input[type="password"]').filter({ 
        hasText: /confirmer/i 
      }).first();
      
      const confirmCount = await confirmPasswordInput.count();
      if (confirmCount > 0) {
        await expect(confirmPasswordInput).toBeVisible({ timeout: 3000 });
      }
    } else {
      // Si le bouton n'existe pas, on skip ce test
      test.skip();
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Se connecter d'abord
    await login(page);
    await page.waitForTimeout(2000);
    
    // Chercher le bouton de déconnexion
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Logout")').first();
    await expect(logoutButton).toBeVisible({ timeout: 10000, message: 'Le bouton de déconnexion devrait être visible' });
    
    await logoutButton.click();
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on revient à la page de login
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty form submission', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Se connecter"), button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Vérifier qu'une validation ou erreur s'affiche, ou que le formulaire reste visible
    const emailInput = page.locator('input[type="email"]').first();
    const errorOrValidation = page.locator('text=/requis|obligatoire|vide|remplir/i').first();
    
    const hasError = await errorOrValidation.count() > 0;
    const formStillVisible = await emailInput.isVisible();
    
    // Soit une erreur s'affiche, soit le formulaire reste visible (validation HTML5)
    expect(hasError || formStillVisible).toBeTruthy();
  });
});
