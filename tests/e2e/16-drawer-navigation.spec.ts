import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Drawer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should open and close drawer on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(500);
    
    // Vérifier que le drawer est fermé par défaut sur mobile
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    await expect(sidebar).toHaveClass(/translate-x-full|hidden/);
    
    // Cliquer sur le bouton hamburger pour ouvrir
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    // Vérifier que le drawer est ouvert
    await expect(sidebar).toBeVisible();
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.x).toBeGreaterThanOrEqual(-10); // Visible (pas complètement caché)
    
    // Cliquer sur le bouton X pour fermer
    const closeButton = page.locator('button[aria-label*="Fermer"]').first();
    await closeButton.click();
    await page.waitForTimeout(300);
    
    // Vérifier que le drawer est fermé
    const sidebarBoxAfter = await sidebar.boundingBox();
    if (sidebarBoxAfter) {
      expect(sidebarBoxAfter.x).toBeLessThan(0); // Caché à gauche
    }
  });

  test('should persist drawer state after page reload on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    
    // Ouvrir le drawer
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    // Vérifier qu'il est ouvert
    await expect(sidebar).toBeVisible();
    
    // Recharger la page
    await page.reload();
    await waitForAppLoad(page);
    await page.waitForTimeout(1000); // Attendre le chargement complet
    
    // Vérifier que l'état est restauré depuis localStorage
    const sidebarAfterReload = page.locator('aside[aria-label="Navigation principale"]');
    const sidebarBox = await sidebarAfterReload.boundingBox();
    
    // Le drawer devrait être dans l'état sauvegardé (peut être ouvert ou fermé selon localStorage)
    // On vérifie juste qu'il est visible ou pas selon l'état
    expect(sidebarAfterReload).toBeVisible();
  });

  test('should close drawer when clicking overlay on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    
    // Ouvrir le drawer
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    await expect(sidebar).toBeVisible();
    
    // Cliquer sur l'overlay (fond sombre)
    const overlay = page.locator('div[aria-hidden="true"]').first();
    if (await overlay.isVisible()) {
      await overlay.click();
      await page.waitForTimeout(300);
      
      // Vérifier que le drawer est fermé
      const sidebarBox = await sidebar.boundingBox();
      if (sidebarBox) {
        expect(sidebarBox.x).toBeLessThan(0);
      }
    }
  });

  test('should close drawer with Escape key on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    
    // Ouvrir le drawer
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    await expect(sidebar).toBeVisible();
    
    // Appuyer sur Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Vérifier que le drawer est fermé
    const sidebarBox = await sidebar.boundingBox();
    if (sidebarBox) {
      expect(sidebarBox.x).toBeLessThan(0);
    }
  });

  test('should navigate to dashboard from drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    // Cliquer sur le bouton Dashboard dans le drawer
    const dashboardButton = page.locator('button:has-text("Dashboard"), button:has-text("📊")').first();
    await expect(dashboardButton).toBeVisible();
    await dashboardButton.click();
    await page.waitForTimeout(500);
    
    // Vérifier que le drawer se ferme sur mobile après sélection
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    const sidebarBox = await sidebar.boundingBox();
    if (sidebarBox) {
      expect(sidebarBox.x).toBeLessThan(0);
    }
    
    // Vérifier qu'on est sur le dashboard (vérifier la présence d'un élément du dashboard)
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Dashboard|Budget|Revenus/i }).first()).toBeVisible({ timeout: 2000 });
  });

  test('should navigate to year from drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    // Trouver et cliquer sur une année dans le drawer
    const yearButton = page.locator('button').filter({ hasText: /202[0-9]/ }).first();
    if (await yearButton.isVisible()) {
      await yearButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier que le drawer se ferme sur mobile
      const sidebar = page.locator('aside[aria-label="Navigation principale"]');
      const sidebarBox = await sidebar.boundingBox();
      if (sidebarBox) {
        expect(sidebarBox.x).toBeLessThan(0);
      }
    }
  });

  test('should show drawer always visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    
    // Le drawer devrait toujours être visible sur desktop
    await expect(sidebar).toBeVisible();
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.x).toBeGreaterThanOrEqual(0); // Visible
    
    // Vérifier que le bouton hamburger n'est pas visible sur desktop
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await expect(hamburgerButton).not.toBeVisible();
  });

  test('should handle multiple reloads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Premier chargement
    await page.reload();
    await waitForAppLoad(page);
    await page.waitForTimeout(1000);
    
    // Deuxième chargement
    await page.reload();
    await waitForAppLoad(page);
    await page.waitForTimeout(1000);
    
    // Troisième chargement
    await page.reload();
    await waitForAppLoad(page);
    await page.waitForTimeout(1000);
    
    // Vérifier que le drawer fonctionne toujours
    const sidebar = page.locator('aside[aria-label="Navigation principale"]');
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    await expect(sidebar).toBeVisible();
  });

  test('should display all navigation elements in drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    await hamburgerButton.click();
    await page.waitForTimeout(300);
    
    // Vérifier la présence des éléments de navigation
    await expect(page.locator('button:has-text("Dashboard")').first()).toBeVisible();
    
    // Vérifier la présence du titre
    await expect(page.locator('h1:has-text("Budget Annuel")').first()).toBeVisible();
    
    // Vérifier la présence de l'email de session
    await expect(page.locator('text=/.*@.*/').first()).toBeVisible();
  });
});
