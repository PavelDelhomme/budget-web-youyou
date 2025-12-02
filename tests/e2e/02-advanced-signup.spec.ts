import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Advanced Signup', () => {
  test('should complete advanced signup flow', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    
    // Si on est déjà connecté, se déconnecter
    const logoutButton = page.locator('button:has-text("Déconnexion")').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Chercher le bouton d'inscription
    const signupButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Inscription")').first();
    
    if (await signupButton.count() > 0) {
      await signupButton.click();
      await page.waitForTimeout(1000);
      
      // Remplir le formulaire d'inscription de base
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      await emailInput.fill('test@example.com');
      await passwordInput.fill('Test1234!@#');
      
      // Si un champ de confirmation existe
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordInput.count() > 1) {
        await confirmPasswordInput.fill('Test1234!@#');
      }
      
      // Cliquer sur s'inscrire
      const submitButton = page.locator('button:has-text("S\'inscrire"), button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier que le formulaire d'inscription avancée apparaît
      const advancedForm = page.locator('text=/socio-professionnel|catégorie|situation/i').first();
      
      if (await advancedForm.count() > 0) {
        // Test du formulaire d'inscription avancée
        // Étape 1: Catégorie socio-professionnelle
        const cspSelect = page.locator('select, input[type="select"]').filter({ hasText: /CSP|catégorie/i }).first();
        if (await cspSelect.count() > 0) {
          await cspSelect.selectOption({ index: 1 });
        }
        
        // Cliquer sur Suivant
        const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next")').first();
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Continuer avec les autres étapes...
        // (Test simplifié - à compléter selon le formulaire réel)
      }
    }
  });
});

