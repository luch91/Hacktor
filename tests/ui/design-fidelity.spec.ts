import { expect, test } from '@playwright/test';

test('desktop hackathon fidelity slice uses stored lineage in constellation and equivalent list selection', async ({ page }, testInfo) => {
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
  const overlaps = await nodes.evaluateAll((items) => items.flatMap((item, index) => items.slice(index + 1).filter((other) => {
    const a = item.getBoundingClientRect();
    const b = other.getBoundingClientRect();
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  })));
  expect(overlaps).toHaveLength(0);
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
  await expect(page.locator('.inspector .parent-link')).toHaveCount(2);
  const selectedVisible = await page.locator('.graph-node.selected').evaluate((node) => {
    const selected = node.getBoundingClientRect();
    const viewport = node.closest('.constellation-scroll')?.getBoundingClientRect();
    return Boolean(viewport && selected.left >= viewport.left && selected.right <= viewport.right);
  });
  expect(selectedVisible).toBe(true);
});

test('required compact landing has a reduced-motion orbital and no page overflow', async ({ page }, testInfo) => {
  test.skip(!['desktop', 'mobile-320', 'tablet'].includes(testInfo.project.name), 'Viewport check');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.orbit-ring')).toHaveCSS('animation-name', 'none');
  for (const mode of ['dark', 'light']) {
    await page.getByRole('radio', { name: mode }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  }
});
