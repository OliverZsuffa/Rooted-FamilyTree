import { expect, test } from '@playwright/test';

async function addPerson(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Add person' }).click();
  const parts = name.split(' ');
  const first = parts.shift() ?? name;
  const last = parts.pop() ?? '';
  const middle = parts.join(' ');
  await page.getByPlaceholder('First name').fill(first);
  if (middle) await page.getByPlaceholder('Optional').fill(middle);
  await page.getByPlaceholder('Last name').fill(last);
  await page.getByRole('button', { name: 'Save person' }).click();
  await expect(page.locator('.react-flow__node').filter({ hasText: name })).toBeVisible();
}

test('shows multiple people and renders parentage and partnership edges', async ({ page }) => {
  await page.goto('/');
  await addPerson(page, 'Ada Example');
  await addPerson(page, 'Ben Example');
  await addPerson(page, 'Cara Example');
  await addPerson(page, 'Daria Example');

  await page.waitForTimeout(500);
  const personNodes = page.locator('.react-flow__node-person');
  const boxes = await personNodes.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      expect(boxes[i].right <= boxes[j].left || boxes[j].right <= boxes[i].left || boxes[i].bottom <= boxes[j].top || boxes[j].bottom <= boxes[i].top).toBe(true);
    }
  }
  await page.getByRole('button', { name: 'Close details' }).click().catch(() => {});
  await page.locator('.react-flow__node-person').filter({ hasText: 'Ben Example' }).click();
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Connect to').selectOption({ label: 'Ada Example' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await page.getByRole('button', { name: 'Close details' }).click().catch(() => {});
  await page.locator('.react-flow__node-person').filter({ hasText: 'Ada Example' }).click();
  await expect(page.locator('.person-panel h2')).toHaveText('Ada Example');
  await expect(page.locator('.person-panel .relationship-list').first()).toContainText('biological parent: Ben Example');

  await page.getByRole('button', { name: 'Close details' }).click().catch(() => {});
  await page.locator('.react-flow__node-person').filter({ hasText: 'Cara Example' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Gender').selectOption('female');
  await page.getByRole('button', { name: 'Save person' }).click();
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Relationship type').selectOption('marriage');
  await page.getByLabel('Who changes their name?').selectOption('first');
  await page.getByLabel('New full name for Cara Example').fill('Cara New Example');
  await page.getByLabel('Started').fill('2020-01-01');
  await page.getByLabel('Connect to').selectOption({ label: 'Ada Example' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ada Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ben Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Cara New Example' })).toBeVisible();
  await expect(page.getByText(/Cara Example to Cara New Example/)).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Daria Example' })).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ada Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ben Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Cara New Example' })).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);
  await page.locator('.react-flow__node-person').filter({ hasText: 'Cara New Example' }).click();
  await expect(page.getByText(/Cara Example to Cara New Example.*2020-01-01/)).toBeVisible();
  await page.getByRole('button', { name: 'Search people' }).click();
  await page.getByPlaceholder('Find someone…').fill('Cara Example');
  await expect(page.locator('.react-flow__node-person').filter({ hasText: 'Cara New Example' })).toBeVisible();
});

test('consolidates matching parent partnerships and finds relationships interactively', async ({ page }) => {
  await page.goto('/');
  await addPerson(page, 'Finder Ada');
  await addPerson(page, 'Finder Ben');
  await addPerson(page, 'Finder Cara');

  await page.locator('.react-flow__node-person').filter({ hasText: 'Finder Ada' }).click();
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Connect to').selectOption({ label: 'Finder Cara' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await page.locator('.react-flow__node-person').filter({ hasText: 'Finder Ben' }).click();
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Connect to').selectOption({ label: 'Finder Cara' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await page.locator('.react-flow__node-person').filter({ hasText: 'Finder Ada' }).click();
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Relationship type').selectOption('marriage');
  await page.getByLabel('Connect to').selectOption({ label: 'Finder Ben' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await expect(page.locator('.family-junction-symbol')).toHaveText('♥');
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);
  await page.getByRole('button', { name: 'Find relationship' }).click();
  await page.getByRole('combobox', { name: 'From' }).fill('Finder Ada');
  await page.getByRole('combobox', { name: 'To' }).fill('Finder Cara');
  await expect(page.locator('.finder-result')).toContainText('child');
  await page.getByRole('button', { name: 'Swap' }).click();
  await expect(page.locator('.finder-result')).toContainText('parent');
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.locator('.finder-result')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close relationship finder' }).click();
  await page.locator('.react-flow__node-person').filter({ hasText: 'Finder Cara' }).click();
  await expect(page.getByText('Family connections')).toHaveCount(0);
});

test('mobile canvas fits the screen and supports dragging a person card', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');
  await addPerson(page, 'Mobile Person');
  await page.getByRole('button', { name: 'Close details' }).click().catch(() => {});
  const node = page.locator('.react-flow__node').filter({ hasText: 'Mobile Person' });
  await expect(node).toBeVisible();
  await expect(page.locator('.tree-workspace .react-flow')).toHaveCSS('touch-action', 'none');
  const before = await node.evaluate((element) => (element as HTMLElement).style.transform);
  const bounds = await node.boundingBox();
  if (!bounds) throw new Error('Person node has no visible bounding box');
  const context = page.context();
  const session = await context.newCDPSession(page);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const nodeHandle = await node.elementHandle();
  if (!nodeHandle) throw new Error('Person node element could not be captured');
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  for (const offset of [15, 30, 45, 60, 70]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + offset, y: y + Math.round(offset * 0.35), id: 1 }] });
    await expect.poll(() => nodeHandle.evaluate((element) => element.isConnected)).toBe(true);
    await expect(node).toBeVisible();
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(before);
  const moved = await node.evaluate((element) => (element as HTMLElement).style.transform);

  // A complete drag must be represented by exactly one undoable change.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).toBe(before);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).toBe(moved);

  await page.waitForTimeout(450);
  await page.reload();
  const reloadedNode = page.locator('.react-flow__node').filter({ hasText: 'Mobile Person' });
  await expect.poll(() => reloadedNode.evaluate((element) => (element as HTMLElement).style.transform)).toBe(moved);
  await session.detach();
});


test('fits narrow phone widths without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');
  await addPerson(page, 'Narrow Screen Person');
  await page.getByRole('button', { name: 'Close details' }).click();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 760 });
    await page.waitForTimeout(150);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(width);
    const canvas = await page.locator('.tree-workspace .react-flow').boundingBox();
    expect(canvas?.width).toBeGreaterThanOrEqual(width - 1);
    expect(canvas?.height).toBeGreaterThan(300);
  }
});


test('persists the theme choice and supports partial precision dates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await addPerson(page, 'Partial Date Person');
  await page.locator('.react-flow__node-person').filter({ hasText: 'Partial Date Person' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Gender').selectOption('female');
  await page.getByLabel('Born').fill('1984-03');
  await page.getByRole('button', { name: 'Save person' }).click();
  await expect(page.locator('.react-flow__node-person').filter({ hasText: 'Partial Date Person' })).not.toHaveClass(/person-card-incomplete/);
  await page.locator('.react-flow__node-person').filter({ hasText: 'Partial Date Person' }).click();
  await expect(page.locator('.person-panel .panel-dates')).toContainText('1984-03');
});
