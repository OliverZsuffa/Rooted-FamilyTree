import { expect, test } from '@playwright/test';

async function addPerson(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Add person' }).click();
  await page.getByPlaceholder('Full name').fill(name);
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
  await page.locator('.react-flow__node').filter({ hasText: 'Ben Example' }).click({ force: true });
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Connect to').selectOption({ label: 'Ada Example' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await page.locator('.react-flow__node').filter({ hasText: 'Cara Example' }).click({ force: true });
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await page.getByLabel('Relationship type').selectOption('marriage');
  await page.getByLabel('Connect to').selectOption({ label: 'Ada Example' });
  await page.getByRole('button', { name: 'Save relationship' }).click();

  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ada Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ben Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Cara Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Daria Example' })).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ada Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Ben Example' })).toBeVisible();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Cara Example' })).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
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
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 70, y: y + 30, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => node.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(before);
  const moved = await node.evaluate((element) => (element as HTMLElement).style.transform);
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
