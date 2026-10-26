import { expect, test } from '@playwright/test';

test('desktop hackathon-first journey reaches a diverse interactive Studio', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop evidence only');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find the idea beneath/ })).toBeVisible();
  await page.getByRole('radio', { name: 'light' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('radio', { name: 'system' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'dark' }).check();
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await page.getByLabel('Workspace title').fill('Accessible city sprint');
  await page.getByLabel('Hackathon brief').fill(
    'Build an accessible city navigation tool for a weekend hackathon. It must work on older phones, protect private location data, and provide a credible live demonstration.',
  );
  await page.getByRole('button', { name: 'Review context' }).click();
  await expect(page.getByRole('heading', { name: 'Correct the context before generation.' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  const ideas = page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem');
  await expect(ideas).toHaveCount(9);
  await expect(page.getByText(/deterministic test adapter/i)).toBeVisible();
  await ideas.first().focus();
  await expect(ideas.first()).toBeFocused();
  await page.getByRole('button', { name: 'Challenge' }).click();
  await expect(page.getByRole('heading', { name: 'Critique' })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/m1-desktop-studio.png', fullPage: true });
});

test('mobile idea-first journey preserves the original and remains operable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile evidence only');
  const original = 'An offline neighborhood mutual aid board that coordinates one request at a time.';
  await page.goto('/');
  await page.getByRole('button', { name: /Start with an idea/ }).click();
  await page.getByLabel('Workspace title').fill('Mutual aid builder');
  await page.getByLabel('Original idea').fill(original);
  await page.getByRole('button', { name: 'Review context' }).click();
  await expect(page.getByLabel('Working summary')).toHaveValue(original);
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await expect(page.locator('body')).toHaveCSS('min-width', '320px');
  await page.screenshot({ path: 'docs/evidence/m1-mobile-studio.png', fullPage: true });
});

test('required compact breakpoints avoid page-level horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!['mobile-320', 'tablet'].includes(testInfo.project.name), 'Compact breakpoint check only');
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start with a hackathon/ })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    client_width: document.documentElement.clientWidth,
    scroll_width: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll_width).toBeLessThanOrEqual(dimensions.client_width);
});
