import { test, expect } from '@playwright/test';
test('activity summary, shared chart emphasis and separate filters', async ({ page }) => {
  await page.route('**/src/services/activityHistory.ts', route => route.fulfill({ contentType: 'text/javascript', body: 'export async function loadActivityPage(){return {results:[],more:false}}' }));
  await page.goto('/tests/interface/index.html?activity-demo');
  await page.getByRole('tab', { name: 'Actividad', exact: true }).click();
  for (const name of ['Áreas que practicas', 'Mapa de niveles']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Historial', exact: true }).click();
  await expect(page.locator('.stats-history tbody tr')).toHaveCount(10);
  await page.locator('.stats-pagination').getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.locator('.stats-history tbody tr')).toHaveCount(2);
  await page.getByRole('tab', { name: 'Gráficas', exact: true }).click();
  const charts = page.locator('.activity-line-chart');
  await expect(charts).toHaveCount(3);
  await expect(charts.last().locator('.stats-average')).toHaveText('Media histórica de partidas con nivel constante: 6');
  for (const chart of await charts.all()) {
    const line = chart.locator('.stats-chart-series').first();
    const other = chart.locator('.stats-chart-series').nth(1);
    await line.locator('circle').last().hover();
    await expect(other).toHaveAttribute('opacity', '0.15');
    await expect(chart.locator('.stats-series-label')).toHaveText('Busca la figura');
    await page.mouse.move(0, 0);
    await expect(other).toHaveAttribute('opacity', '1');
    await chart.getByRole('button', { name: 'Recuerda la secuencia', exact: true }).focus();
    await expect(line).toHaveAttribute('opacity', '0.15');
    await page.keyboard.press('Escape');
    await expect(line).toHaveAttribute('opacity', '1');
  }
  await page.getByRole('tab', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Área', { exact: true }).selectOption('memory');
  await page.getByRole('tab', { name: 'Gráficas', exact: true }).click();
  for (const chart of await charts.all()) {
    await expect(chart.locator('.stats-chart-series')).toHaveCount(1);
    await expect(chart.locator('.stats-chart-series')).toHaveAttribute('data-series', 'memory-path');
  }
});
