import { test, expect } from '@playwright/test';
for (const width of [390, 820, 1280]) {
  test(`workspace navigation and settings-only sign-out at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/*', route => ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await page.goto('/tests/interface/index.html');
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Mi cuenta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mi cuenta', exact: true })).toBeVisible();
    await expect(page.locator('.account-identity')).toHaveCount(0);
    await page.getByRole('button', { name: /^Tu actividad/ }).click();
    await expect(page.getByRole('tab', { name: 'Resumen', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Logros', exact: true }).click();
    const badge = page.locator('.badge-display').first();
    await badge.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(badge).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Ajustes de accesibilidad' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Mi cuenta', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(0);
  });
}
