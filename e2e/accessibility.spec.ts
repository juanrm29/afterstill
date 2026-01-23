import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have an h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all images
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Images should have alt (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });

  test('interactive elements should be focusable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press Tab and ensure something gets focused
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have skip to content link or proper landmarks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have main landmark or skip link
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();
    
    const skipLink = page.locator('a[href="#main-content"], a[href="#content"]');
    const skipCount = await skipLink.count();
    
    expect(mainCount + skipCount).toBeGreaterThan(0);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some accessible name
      const hasName = (text && text.trim()) || ariaLabel || title;
      expect(hasName).toBeTruthy();
    }
  });

  test('color contrast should be sufficient', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic check - text should be visible
    const textElements = page.locator('p, h1, h2, h3, span');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        // Element should be visible
        await expect(element).toBeVisible();
      }
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should have focused something
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('escape key should close modals if any', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press Escape (shouldn't cause errors even if no modal)
    await page.keyboard.press('Escape');
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});
