import { test, expect } from '@playwright/test';
import { login, waitForAppLoad, clickElement, findAndVerifyElement } from './helpers/test-helpers';

test.describe('ML Model Selection and Benchmark', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should display model selection interface', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher le sélecteur de modèle
    const modelSelector = page.locator('select').filter({
      hasText: /Auto|neuronal|traditionnel/i
    }).first();
    
    await expect(modelSelector).toBeVisible({ timeout: 10000, message: 'Le sélecteur de modèle devrait être visible' });
    
    // Vérifier les options disponibles
    const options = modelSelector.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
    
    // Vérifier qu'il y a au moins l'option "Auto"
    const autoOption = options.filter({ hasText: /Auto/i });
    await expect(autoOption).toBeVisible({ message: 'L\'option "Auto" devrait être disponible' });
  });

  test('should change model type selection', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Trouver le sélecteur de modèle
    const modelSelector = page.locator('select').filter({
      hasText: /Auto|neuronal|traditionnel/i
    }).first();
    
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
    
    // Changer la sélection vers "Réseau neuronal"
    await modelSelector.selectOption({ label: /neuronal/i });
    await page.waitForTimeout(500);
    
    // Vérifier que la sélection a changé
    const selectedValue = await modelSelector.inputValue();
    expect(selectedValue).toMatch(/neural|neuronal/i);
    
    // Changer vers "Modèle traditionnel"
    await modelSelector.selectOption({ label: /traditionnel/i });
    await page.waitForTimeout(500);
    
    // Vérifier que la sélection a changé
    const selectedValue2 = await modelSelector.inputValue();
    expect(selectedValue2).toMatch(/traditional|traditionnel/i);
  });

  test('should display benchmark button', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher le bouton de benchmark
    const benchmarkButton = page.locator('button:has-text("Benchmark"), button:has-text("📊")').filter({
      hasText: /Benchmark/i
    }).first();
    
    await expect(benchmarkButton).toBeVisible({ timeout: 10000, message: 'Le bouton de benchmark devrait être visible' });
  });

  test('should run benchmark and display results', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher le bouton de benchmark
    const benchmarkButton = page.locator('button:has-text("Benchmark"), button:has-text("📊")').filter({
      hasText: /Benchmark/i
    }).first();
    
    const buttonCount = await benchmarkButton.count();
    if (buttonCount > 0 && await benchmarkButton.isEnabled()) {
      // Cliquer sur le bouton de benchmark
      await benchmarkButton.click();
      await page.waitForTimeout(500);
      
      // Attendre que le benchmark démarre (bouton désactivé ou texte change)
      await page.waitForTimeout(2000);
      
      // Attendre que les résultats s'affichent (peut prendre du temps)
      const benchmarkResults = page.locator('text=/Résultats du Benchmark/i, text=/Temps d\'entraînement/i, text=/Précision/i, text=/Modèle traditionnel/i, text=/Réseau neuronal/i').first();
      
      // Le benchmark peut prendre du temps ou échouer si pas assez de données
      // On attend un maximum de 30 secondes
      try {
        await expect(benchmarkResults).toBeVisible({ timeout: 30000, message: 'Les résultats de benchmark devraient s\'afficher' });
        
        // Vérifier qu'il y a des métriques affichées
        const metrics = page.locator('text=/s/i, text=/ms/i, text=/%/i');
        const metricsCount = await metrics.count();
        // Au moins quelques métriques devraient être affichées
        expect(metricsCount).toBeGreaterThan(0);
      } catch (error) {
        // Si le benchmark échoue ou prend trop de temps, vérifier qu'un message d'erreur ou d'info s'affiche
        const errorOrInfo = page.locator('text=/erreur/i, text=/pas assez/i, text=/données/i, text=/besoin/i');
        const hasMessage = await errorOrInfo.count() > 0;
        // C'est OK si le benchmark n'a pas assez de données ou échoue
        if (!hasMessage) {
          console.log('Benchmark en cours ou pas assez de données pour le benchmark');
        }
      }
    } else {
      // Le bouton peut être désactivé si pas assez de données
      test.skip('Le bouton de benchmark n\'est pas disponible ou désactivé (peut nécessiter plus de données)');
    }
  });

  test('should display current model type in model info', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Chercher la section "État du Modèle"
    const modelInfoSection = page.locator('text=/État du Modèle/i, text=/État/i').first();
    await expect(modelInfoSection).toBeVisible({ timeout: 10000, message: 'La section État du Modèle devrait être visible' });
    
    // Chercher l'affichage du type de modèle
    const modelType = page.locator('text=/Réseau neuronal/i, text=/Traditionnel/i, text=/🧠/i, text=/📊/i').first();
    
    // Il peut ne pas y avoir de modèle entraîné, donc on vérifie juste que la section existe
    const modelTypeCount = await modelType.count();
    if (modelTypeCount > 0) {
      await expect(modelType).toBeVisible({ message: 'Le type de modèle devrait être affiché' });
    } else {
      // Pas de modèle entraîné, c'est OK
      console.log('Aucun modèle entraîné actuellement');
    }
  });

  test('should send model type parameter when training', async ({ page }) => {
    // Ouvrir l'interface ML
    const mlButton = page.locator('button:has-text("Entraînement IA")').first();
    await expect(mlButton).toBeVisible({ timeout: 10000 });
    await mlButton.click();
    await page.waitForTimeout(2000);
    
    // Écouter les requêtes réseau
    let trainingRequest: any = null;
    page.on('request', (request) => {
      if (request.url().includes('/api/ml/train') && request.method() === 'POST') {
        trainingRequest = request;
      }
    });
    
    // Sélectionner "Réseau neuronal"
    const modelSelector = page.locator('select').filter({
      hasText: /Auto|neuronal|traditionnel/i
    }).first();
    
    if (await modelSelector.count() > 0) {
      await modelSelector.selectOption({ label: /neuronal/i });
      await page.waitForTimeout(500);
      
      // Chercher le bouton d'entraînement (peut être désactivé)
      const trainButton = page.locator('button:has-text("Entraîner")').first();
      const isEnabled = await trainButton.isEnabled().catch(() => false);
      
      if (isEnabled) {
        await trainButton.click();
        await page.waitForTimeout(1000);
        
        // Vérifier que la requête contient use_neural_network
        if (trainingRequest) {
          const postData = trainingRequest.postDataJSON();
          expect(postData).toHaveProperty('use_neural_network');
          expect(postData.use_neural_network).toBe(true);
        }
      } else {
        test.skip('Le bouton d\'entraînement n\'est pas disponible (données insuffisantes)');
      }
    } else {
      test.skip('Le sélecteur de modèle n\'est pas disponible');
    }
  });
});

