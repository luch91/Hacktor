import { expect, test } from '@playwright/test';

test('desktop hackathon-first journey reaches a diverse interactive Studio', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop evidence only');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Go beyond the first idea/ })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/m2-desktop-landing.png', fullPage: true });
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
  await page.getByRole('button', { name: 'List view' }).click();
  const ideas = page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem');
  await expect(ideas).toHaveCount(9);
  await page.screenshot({ path: 'docs/evidence/m2-desktop-studio.png', fullPage: true });
  await expect(page.getByText(/deterministic test adapter/i)).toBeVisible();
  await page.getByRole('button', { name: /Research blocked/ }).click();
  await expect(page.getByText(/Automated sources are disabled/)).toBeVisible();
  await expect(page.getByText(/No source backed claims/)).toBeVisible();
  await ideas.first().focus();
  await expect(ideas.first()).toBeFocused();
  await page.getByRole('button', { name: 'Challenge' }).click();
  await expect(page.getByRole('heading', { name: 'Critique' })).toBeVisible();
  await page.getByLabel('Second idea').selectOption({ index: 1 });
  await page.getByRole('button', { name: /^Compare / }).click();
  await expect(page.locator('.comparison-grid article')).toHaveCount(2);
  await page.screenshot({ path: 'docs/evidence/m2-desktop-comparison.png', fullPage: true });
  await page.getByRole('button', { name: 'Combine selected versions' }).click();
  await expect(page.getByText(/Combined idea created with two parent edges/)).toBeVisible();
  await page.getByText('Immutable lineage', { exact: false }).click();
  await expect(page.locator('.lineage li')).toHaveCount(2);
  await page.screenshot({ path: 'docs/evidence/m2-desktop-lineage.png', fullPage: true });
  await page.getByRole('button', { name: 'Blueprint', exact: false }).first().click();
  await page.getByRole('button', { name: 'Create blueprint' }).click();
  await expect(page.getByRole('heading', { name: 'Blueprint review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Export Markdown blueprint' })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/m2-desktop-blueprint.png', fullPage: true });
});

test('mobile idea-first journey preserves the original and remains operable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile evidence only');
  const original = 'An offline neighborhood mutual aid board that coordinates one request at a time.';
  await page.goto('/');
  await page.screenshot({ path: 'docs/evidence/m2-mobile-landing.png', fullPage: true });
  await page.getByRole('button', { name: /Start with an idea/ }).click();
  await page.getByLabel('Workspace title').fill('Mutual aid builder');
  await page.getByLabel('Original idea').fill(original);
  await page.getByRole('button', { name: 'Review context' }).click();
  await expect(page.getByLabel('Working summary')).toHaveValue(original);
  await page.getByLabel('Working summary').fill(`${original} Make it usable without an account.`);
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Working summary')).toHaveValue(`${original} Make it usable without an account.`);
  await expect(page.getByText(original, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await expect(page.locator('body')).toHaveCSS('min-width', '320px');
  await page.screenshot({ path: 'docs/evidence/m2-mobile-studio.png' });
  await page.getByRole('button', { name: 'Inspect and act' }).click();
  await expect(page.locator('.inspector').getByRole('button', { name: 'Branch' })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/m2-mobile-inspector.png' });
});

test('desktop hackathon job resumes after an interrupted status response', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop recovery check only');
  let submissions = 0;
  await page.route('**/api/v1/sessions/*/jobs', async (route) => {
    if (route.request().method() === 'POST') submissions += 1;
    await route.continue();
  });
  let interrupted = false;
  await page.route('**/api/v1/jobs/*', async (route) => {
    if (!interrupted) {
      interrupted = true;
      await route.abort('failed');
    } else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await page.getByLabel('Workspace title').fill('Interrupted job');
  await page.getByLabel('Hackathon brief').fill('Build a private offline emergency coordination tool for a weekend hackathon that works on older devices.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await expect(page.getByText(/Connection interrupted/)).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  expect(submissions).toBe(1);
});

test('required compact breakpoints avoid page-level horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!['mobile-320', 'tablet'].includes(testInfo.project.name), 'Compact breakpoint check only');
  await page.goto('/');
  await page.screenshot({ path: `docs/evidence/m2-${testInfo.project.name}-landing.png`, fullPage: true });
  await expect(page.getByRole('button', { name: /Start with a hackathon/ })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    client_width: document.documentElement.clientWidth,
    scroll_width: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll_width).toBeLessThanOrEqual(dimensions.client_width);
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await page.getByLabel('Workspace title').fill('Compact layout sprint');
  await page.getByLabel('Hackathon brief').fill('Build an accessible offline aid coordination tool for a weekend hackathon on older phones with a demonstrable privacy rule.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await page.screenshot({ path: `docs/evidence/m2-${testInfo.project.name}-studio.png` });
  const studioWidth = await page.evaluate(() => ({ client_width: document.documentElement.clientWidth, scroll_width: document.documentElement.scrollWidth }));
  expect(studioWidth.scroll_width).toBeLessThanOrEqual(studioWidth.client_width);
});

