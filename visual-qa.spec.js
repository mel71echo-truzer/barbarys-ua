const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3333';

test.describe('Барбарис — Visual QA', () => {
  test('homepage loads — title and screenshot', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '/tmp/qa-home.png', fullPage: true });
    const title = await page.title();
    expect(title).toContain('Барбарис');
  });

  test('headings do not break mid-word (height sanity check)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      const box = await h.boundingBox();
      if (box) expect(box.height).toBeLessThan(500);
    }
  });

  test('product cards exist and have gradient backgrounds', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const count = await page.locator('.product-card-visual').count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const card = page.locator('.product-card-visual').nth(i);
      const bg = await card.evaluate(el =>
        window.getComputedStyle(el).backgroundImage
      );
      expect(bg).toMatch(/gradient/);
    }
  });

  test('telegram button is fixed at bottom-right', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    // Use evaluate on document to avoid locator waiting-for-visible
    const position = await page.evaluate(() => {
      const el = document.querySelector('.tg-float');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return { position: s.position, bottom: s.bottom, right: s.right, top: s.top };
    });
    expect(position).not.toBeNull();
    expect(position.position).toBe('fixed');
    // bottom/right should be ≤50px (near corner), not 'auto'
    expect(parseInt(position.bottom)).toBeLessThanOrEqual(50);
    expect(parseInt(position.right)).toBeLessThanOrEqual(50);
  });

  test('no stray dot separators in navbar', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const navHtml = await page.evaluate(() =>
      document.querySelector('nav')?.innerHTML ?? ''
    );
    expect(navHtml.length).toBeGreaterThan(0);
    expect(navHtml).not.toMatch(/>\s*·\s*</);
  });

  test('body background is warm beige (#F5EDD8)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    // #F5EDD8 = rgb(245, 237, 216)
    expect(bg).toBe('rgb(245, 237, 216)');
  });

  test('product page loads and screenshot saved', async ({ page }) => {
    await page.goto(`${BASE}/product.html`, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '/tmp/qa-product.png', fullPage: true });
    const h1 = await page.evaluate(() =>
      document.querySelector('h1')?.textContent ?? ''
    );
    expect(h1.length).toBeGreaterThan(0);
  });
});
