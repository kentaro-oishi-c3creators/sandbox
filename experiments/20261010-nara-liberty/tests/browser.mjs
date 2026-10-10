import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
await mkdir('test-results', { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [], failedRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(request.url()));
    const response = await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173/');
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => window.naraDebug?.().triangles > 0);
    await page.waitForTimeout(1200);
    const initial = await page.evaluate(() => window.naraDebug());
    assert.equal(initial.visibleStatues, 100);
    assert.equal(initial.webgl, true);
    await page.screenshot({ path: `test-results/nara-${viewport.width}.png` });
    const before = initial.firstStatueZ;
    await page.waitForTimeout(350);
    assert.notEqual((await page.evaluate(() => window.naraDebug())).firstStatueZ, before, 'Statues should move');
    await page.locator('#pause').click();
    const stopped = await page.evaluate(() => window.naraDebug());
    await page.waitForTimeout(350);
    assert.equal((await page.evaluate(() => window.naraDebug())).firstStatueZ, stopped.firstStatueZ, 'Pause should freeze motion');
    for (const count of [0, 1, 10, 100]) {
      await page.locator('#statue-count').selectOption(String(count));
      assert.equal((await page.evaluate(() => window.naraDebug())).visibleStatues, count);
    }
    await page.locator('#speed').fill('1.8');
    assert.equal((await page.evaluate(() => window.naraDebug())).speed, 1.8);
    for (const view of ['path', 'shrine', 'park']) {
      await page.locator(`[data-view="${view}"]`).click();
      await page.waitForTimeout(1300);
      assert.equal((await page.evaluate(() => window.naraDebug())).currentView, view);
    }
    const cameraBefore = await page.evaluate(() => window.naraDebug().camera);
    await page.mouse.move(viewport.width * .55, viewport.height * .5);
    await page.mouse.down();
    await page.mouse.move(viewport.width * .65, viewport.height * .45, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    assert.notDeepEqual(await page.evaluate(() => window.naraDebug().camera), cameraBefore);
    await page.locator('#reset').click();
    await page.waitForTimeout(1400);
    await page.locator('#about-button').click();
    assert.equal(await page.locator('#about').evaluate((d) => d.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#about').evaluate((d) => d.open), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    assert.deepEqual(failedRequests, []);
    results.push({ viewport, initial, fps: await page.locator('#fps').textContent(), errors, failedRequests, status: 'passed' });
    await context.close();
  }
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.naraDebug);
  assert.equal(await page.evaluate(() => window.naraDebug().paused), true);
  results.push({ reducedMotion: true, status: 'passed' });
  await writeFile('test-results/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
