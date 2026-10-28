import { expect, test } from '@playwright/test';

test('desktop fidelity slice uses stored lineage in constellation and equivalent list selection', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop lineage check');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Go beyond the first idea.' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Original orbital drawing/ })).toBeVisible();
  await page.getByRole('button', { name: /Start with an idea/ }).click();
  await page.getByLabel('Workspace title').fill('Direction field');
  await page.getByLabel('Original idea').fill('An offline neighborhood tool for sharing time and supplies safely.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  const nodes = page.locator('.graph-node');
  await expect(nodes).toHaveCount(9);
  const second = nodes.nth(1);
  const secondName = await second.locator('strong').textContent();
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.inspector h2')).toHaveText(secondName || '');
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await expect(page.locator('.idea-list-row.selected strong')).toHaveText(secondName || '');
  await page.getByRole('button', { name: 'Branch' }).click();
  await page.getByRole('button', { name: 'Constellation' }).click();
  await expect(nodes).toHaveCount(10);
  await expect(page.locator('.graph-line.active')).toHaveCount(1);
  await page.getByLabel('Second idea').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Combine selected versions' }).click();
  await expect(nodes).toHaveCount(11);
  await expect(page.locator('.graph-line.active')).toHaveCount(2);
});

test('landing has a reduced-motion orbital and no page overflow', async ({ page }, testInfo) => {
  test.skip(!['desktop', 'mobile-320', 'tablet'].includes(testInfo.project.name), 'Viewport check');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.orbit-ring')).toHaveCSS('animation-duration', '1e-05s');
  for (const mode of ['dark', 'light']) {
    await page.getByRole('radio', { name: mode }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  }
});
