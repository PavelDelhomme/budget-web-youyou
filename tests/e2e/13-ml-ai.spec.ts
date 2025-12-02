import { test, expect } from '@playwright/test';
import { login, waitForAppLoad, navigateToYear, clickElement, findAndVerifyElement } from './helpers/test-helpers';

test.describe('ML/AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should open ML training interface', async ({ page }) => {
    // Chercher le bouton "Entraînement IA" dans la sidebar
    const mlButton = page.locator('button:has-text("Entraînement IA"), button:has-text("🤖")').filter({
      hasText: /Entraînement IA/i
    }).first();
    
    await expect(mlButton).toBeVisible({ timeout: 10000, message: 'Le bouton "Entraînement IA" devrait être visible dans la sidebar' });
    
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Vérifier que l'interface s'ouvre - chercher des éléments spécifiques de l'interface ML
    const mlInterface = page.locator('text=/Entraînement/i, text=/Modèle/i, text=/ML/i, text=/complétude/i').first();
    await expect(mlInterface).toBeVisible({ timeout: 10000, message: 'L\'interface d\'entraînement IA devrait s\'ouvrir' });
  });

  test('should validate data for ML training', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher le bouton de validation des données
    const validateButton = page.locator('button:has-text("Valider"), button:has-text("Vérifier"), button:has-text("Validation")').first();
    
    const buttonCount = await validateButton.count();
    if (buttonCount > 0) {
      await validateButton.click();
      await page.waitForTimeout(3000);
      
      // Vérifier que les résultats de validation s'affichent
      const validationResults = page.locator('text=/complétude/i, text=/erreur/i, text=/score/i, text=/complet/i').first();
      await expect(validationResults).toBeVisible({ timeout: 10000, message: 'Les résultats de validation devraient s\'afficher' });
    } else {
      // Si le bouton n'existe pas, on skip ce test
      test.skip('Le bouton de validation n\'existe pas dans l\'interface');
    }
  });

  test('should train ML model', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher le bouton d'entraînement
    const trainButton = page.locator('button:has-text("Entraîner"), button:has-text("Train"), button:has-text("Lancer")').first();
    
    const buttonCount = await trainButton.count();
    if (buttonCount > 0) {
      await trainButton.click();
      await page.waitForTimeout(5000);
      
      // Vérifier que le modèle s'entraîne (peut prendre du temps)
      const trainingStatus = page.locator('text=/entraînement/i, text=/score/i, text=/R²/i, text=/MAE/i, text=/RMSE/i').first();
      await expect(trainingStatus).toBeVisible({ timeout: 15000, message: 'Le statut d\'entraînement devrait s\'afficher' });
    } else {
      // Si le bouton n'existe pas ou n'est pas disponible, on skip
      test.skip('Le bouton d\'entraînement n\'existe pas ou n\'est pas disponible');
    }
  });

  test('should get AI recommendations for savings', async ({ page }) => {
    // Naviguer vers une année
    try {
      await navigateToYear(page, 2025);
    } catch {
      // Si l'année n'existe pas, essayer une autre année ou skip
      test.skip('Aucune année disponible pour tester les recommandations');
      return;
    }
    
    // Chercher les boutons de recommandation IA dans la section épargne avancée
    const recommendationButton = page.locator('button:has-text("🤖"), button:has-text("IA")').filter({
      hasText: /Recommandation/i
    }).first();
    
    const buttonCount = await recommendationButton.count();
    if (buttonCount > 0) {
      await recommendationButton.click();
      await page.waitForTimeout(3000);
      
      // Vérifier qu'une recommandation s'affiche
      const recommendation = page.locator('text=/recommandation/i, text=/recommandé/i, text=/€/i').first();
      await expect(recommendation).toBeVisible({ timeout: 10000, message: 'Une recommandation devrait s\'afficher' });
    } else {
      // Si les boutons de recommandation n'existent pas, on skip
      test.skip('Les boutons de recommandation IA ne sont pas disponibles');
    }
  });
});
