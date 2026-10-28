import { expect, test } from '@playwright/test';

test('desktop continuity restores a draft and reopens exact blueprint history', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop continuity journey');
  await page.goto('/');
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await page.getByLabel('Workspace title').fill('Continuity workshop');
  await page.getByLabel('Hackathon brief').fill('Build an offline and accessible flood readiness handoff for a weekend hackathon. It must protect private location data and work on older phones.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await page.getByLabel('Working summary').fill('A private offline flood readiness handoff for residents and coordinators.');
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/continuity-desktop-saved-draft.png' });

  const storageState = await page.context().storageState();
  const returned = await browser.newContext({ storageState, viewport: { width: 1440, height: 1000 } });
  try {
    const resumed = await returned.newPage();
    await resumed.goto('/');
    await expect(resumed.getByLabel('Working summary')).toHaveValue('A private offline flood readiness handoff for residents and coordinators.');
    await expect(resumed.getByText('Working draft: saved')).toBeVisible();
    await resumed.screenshot({ path: 'docs/evidence/continuity-desktop-restored-draft.png' });
    await resumed.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
    await resumed.getByRole('button', { name: 'Generate diverse slate' }).click();
    await resumed.getByRole('button', { name: 'List view' }).click();
    await expect(resumed.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
    await resumed.locator('.stage-rail').getByRole('button', { name: /Map/ }).click();
    await expect(resumed.locator('.opportunity-card')).toHaveCount(3);
    await expect(resumed.getByText('Unverified hypothesis')).toHaveCount(3);
    await resumed.screenshot({ path: 'docs/evidence/continuity-desktop-map.png' });
    await resumed.getByRole('button', { name: 'Create blueprint' }).click();
    await expect(resumed.locator('.blueprint-history li')).toHaveCount(1);
    await resumed.getByRole('button', { name: 'Create blueprint' }).click();
    await expect(resumed.locator('.blueprint-history li')).toHaveCount(2);
    await resumed.reload();
    await resumed.locator('.stage-rail').getByRole('button', { name: /Blueprint/ }).click();
    await expect(resumed.locator('.blueprint-history li')).toHaveCount(2);
    await resumed.locator('.blueprint-history button').first().click();
    await expect(resumed.locator('.blueprint-document')).toContainText('MVP scope');
    await expect(resumed.getByRole('link', { name: 'Export Markdown blueprint' })).toBeVisible();
    await resumed.screenshot({ path: 'docs/evidence/continuity-desktop-blueprint-history.png' });
    await resumed.getByRole('button', { name: 'Return to selected idea' }).click();
    await expect(resumed.locator('.inspector h2')).toBeVisible();
    await resumed.getByRole('button', { name: 'Branch', exact: true }).click();
    await expect(resumed.getByText('branch completed without changing the parent version.')).toBeVisible();
    await resumed.locator('.stage-rail').getByRole('button', { name: /Blueprint/ }).click();
    await expect(resumed.getByText('No stored blueprint exists for this version.')).toBeVisible();
  } finally { await returned.close(); }
});

test('desktop continuity resolves two-tab conflict and serializes delayed autosaves', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop concurrency journey');
  await page.goto('/');
  await page.getByRole('button', { name: /Start with an idea/ }).click();
  await page.getByLabel('Workspace title').fill('Two tab review');
  await page.getByLabel('Original idea').fill('A neighborhood repair exchange with offline check-in.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  const other = await page.context().newPage();
  await other.goto('/');
  await expect(other.getByLabel('Working summary')).toBeVisible();
  await page.getByLabel('Working summary').fill('First tab made this a tool library.');
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  await other.getByLabel('Working summary').fill('Second tab made this a repair queue.');
  await expect(other.getByText('Working draft: conflict')).toBeVisible();
  await other.screenshot({ path: 'docs/evidence/continuity-desktop-draft-conflict.png' });
  await other.getByRole('button', { name: 'Load saved draft' }).click();
  await expect(other.getByLabel('Working summary')).toHaveValue('First tab made this a tool library.');
  await other.close();

  let delayed = false;
  await page.route('**/api/v1/sessions/*/draft', async (route) => {
    if (route.request().method() !== 'PUT' || delayed) { await route.continue(); return; }
    delayed = true;
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ response });
  });
  await page.getByLabel('Working summary').fill('First delayed revision.');
  await expect(page.getByText('Working draft: saving')).toBeVisible();
  await page.getByLabel('Working summary').fill('Final revision after delayed response.');
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  const stored = await page.evaluate(async () => (await (await fetch('/api/v1/sessions/' + localStorage.getItem('hacktor-session-id') + '/draft')).json()) as { data: { draft: { context: { summary: string } } } });
  expect(stored.data.draft.context.summary).toBe('Final revision after delayed response.');
});

test('mobile continuity preserves idea decisions after refresh', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile continuity journey');
  await page.goto('/');
  await page.getByRole('button', { name: /Start with an idea/ }).click();
  await page.getByLabel('Workspace title').fill('Local aid idea');
  const original = 'A local aid board for older phones with one request at a time.';
  await page.getByLabel('Original idea').fill(original);
  await page.getByRole('button', { name: 'Review context' }).click();
  await page.getByLabel('Working summary').fill(`${original} No account needed.`);
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/continuity-mobile-saved-draft.png' });
  await page.reload();
  await expect(page.getByText(original, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Working summary')).toHaveValue(`${original} No account needed.`);
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await page.getByRole('button', { name: 'Inspect and act' }).click();
  await page.getByRole('button', { name: 'Pin', exact: true }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Explore ideas' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem').first()).toContainText('pinned');
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem').first()).toContainText('rejected');
  await page.screenshot({ path: 'docs/evidence/continuity-mobile-restored-studio.png' });
});

test('required compact continuity reflows saved review and Map', async ({ page }, testInfo) => {
  test.skip(!['mobile-320', 'tablet'].includes(testInfo.project.name), 'Compact widths only');
  await page.goto('/');
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await page.getByLabel('Workspace title').fill('Compact continuity');
  await page.getByLabel('Hackathon brief').fill('Build a private offline maintenance handoff for a weekend hackathon that works on older phones and can be demonstrated in three minutes.');
  await page.getByRole('button', { name: 'Review context' }).click();
  await expect(page.getByText('Working draft: saved')).toBeVisible();
  await page.screenshot({ path: `docs/evidence/continuity-${testInfo.project.name}-saved-draft.png` });
  await page.getByRole('button', { name: 'Confirm context and enter Studio' }).click();
  await page.getByRole('button', { name: 'Generate diverse slate' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('list', { name: 'Generated ideas' }).getByRole('listitem')).toHaveCount(9);
  await page.locator('.stage-rail').getByRole('button', { name: /Map/ }).click();
  await expect(page.locator('.opportunity-card')).toHaveCount(3);
  await page.screenshot({ path: `docs/evidence/continuity-${testInfo.project.name}-map.png` });
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});

test('desktop continuity accessibility checks focus, status, contrast and reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop accessibility check');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => ({
    name: document.activeElement?.getAttribute('aria-label'),
    outline: getComputedStyle(document.activeElement as Element).outlineWidth,
  }));
  expect(focus.name).toBe('Hacktor home');
  expect(Number.parseFloat(focus.outline)).toBeGreaterThanOrEqual(2);
  const measureContrast = async () => page.evaluate(() => {
    const color = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [0, 0, 0];
    const luminance = (channels: number[]) => channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const text = luminance(color(getComputedStyle(document.querySelector('.hero-copy') as Element).color));
    const background = luminance(color(getComputedStyle(document.body).backgroundColor));
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  });
  expect(await measureContrast()).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('radio', { name: 'light' }).check();
  await expect.poll(measureContrast).toBeGreaterThanOrEqual(4.5);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.locator('.entry-paths button').first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(motion).toContain('1e-05s');
  await page.getByRole('button', { name: /Start with a hackathon/ }).click();
  await expect(page.getByLabel('Workspace title')).toBeVisible();
  await expect(page.getByLabel('Hackathon brief')).toBeVisible();
});

