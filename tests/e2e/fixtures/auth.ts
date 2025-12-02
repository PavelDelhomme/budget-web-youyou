import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test that uses authenticatedPage
    await page.goto('/');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[placeholder*="Email"]', { timeout: 10000 });
    
    // Fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('dev@delhomme.ovh');
      await passwordInput.fill('5n!B@#c*ymgEBYXrWdKE');
      
      // Click login button
      await page.click('button:has-text("Se connecter"), button:has-text("Connexion")');
      
      // Wait for navigation or dashboard
      await page.waitForURL('**/', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

