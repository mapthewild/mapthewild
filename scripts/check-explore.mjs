// check-explore.mjs: walk through Explore in a real browser, the way a reader would, and save
// pictures and a record of each step. Written for the 20 Oct 2026 merge of the redesign and the
// Explore world (Astra's handoff, HANDOFF-EXPLORE-TO-CLAUDE.md section 5, "Browser replay").
//
// Usage: node scripts/check-explore.mjs <site root URL> <output folder>
//   e.g. node scripts/check-explore.mjs http://127.0.0.1:4330/mapthewild/ /tmp/explore-base
//        node scripts/check-explore.mjs http://127.0.0.1:4331/ /tmp/explore-root   (the mapthewild.xyz build)
// Needs playwright-core and Google Chrome. playwright-core is not one of the site's packages:
// point NODE_PATH at a folder that has it (~/Documents/method/doomcheck-ui/node_modules).
//
// It checks: the spyglass keeps the writing inside the lens, the lens moves while the text holds
// still, scrolling, switching posts, the full page and back, lowering the glass; then ashore, into
// the shop, to Moe's shelf, a book opened from the list, and back to the boat. Every file the
// browser fails to load (status 400 or more) and every page error is listed.
import { createRequire } from 'node:module';
// Loaded this way so NODE_PATH can point at a folder that has playwright-core.
const { chromium } = createRequire(import.meta.url)('playwright-core');
import fs from 'node:fs';

const [ROOT, OUT] = process.argv.slice(2);
if (!ROOT || !OUT) { console.error('usage: node scripts/check-explore.mjs <site root URL> <output folder>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const url = path => new URL(path, ROOT.endsWith('/') ? ROOT : ROOT + '/').href;
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const record = { root: ROOT, at: new Date().toISOString(), views: [] };

for (const [name, viewport] of [['laptop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  const view = { name, steps: [], failed: [], errors: [] };
  page.on('response', r => { if (r.status() >= 400) view.failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => view.failed.push(`failed ${r.url()} ${r.failure()?.errorText || ''}`));
  page.on('pageerror', e => view.errors.push(e.message));
  const step = async (label, fn) => {
    try { const note = await fn(); view.steps.push({ step: label, ok: true, note: note ?? '' }); }
    catch (e) { view.steps.push({ step: label, ok: false, note: String(e.message || e).split('\n')[0] }); }
    await page.screenshot({ path: `${OUT}/${name}-${String(view.steps.length).padStart(2, '0')}.png` }).catch(() => {});
  };
  const box = async sel => (await page.locator(sel).first().boundingBox());

  await step('open Explore at Nowbrary', async () => {
    await page.goto(url('explore?port=nowbrary'), { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('a.landing-story', { hasText: 'The Nowbrary' }).first().waitFor({ state: 'visible', timeout: 30000 });
    return page.url();
  });
  await step('raise the spyglass on "The Nowbrary"', async () => {
    await page.locator('a.landing-story', { hasText: 'The Nowbrary' }).first().click();
    await wait(4000);
    const prose = page.locator('.shore-essay-prose').first();
    await prose.waitFor({ state: 'visible', timeout: 10000 });
    const text = await prose.innerText();
    if (!text.includes('On walks in my neighbourhood')) throw new Error('the post text is not in the reader');
    const full = await page.locator('dialog.shore-reader.is-full-page').count();
    if (name === 'phone') {
      if (!full) throw new Error('on a phone the post should open as a full page');
      await page.locator('.shore-view-toggle').first().click(); await wait(1500);
      if (!(await page.locator('.shore-lens-rim').first().isVisible())) throw new Error('no lens after choosing the spyglass');
      return 'opened as a full page; the spyglass is one tap away';
    }
    if (full) throw new Error('on a laptop the post should open in the spyglass');
    if (!(await page.locator('.shore-lens-rim').first().isVisible())) throw new Error('no lens rim after the entrance');
    return 'writing and lens visible after 4 s';
  });
  if (name === 'laptop') {
    await step('move the lens over the writing, which stays put', async () => {
      const lens0 = await box('.shore-lens-rim'), head0 = await box('.shore-essay-heading');
      await page.mouse.move(400, 400); await wait(600);
      await page.mouse.move(900, 450); await wait(900);
      const lens1 = await box('.shore-lens-rim'), head1 = await box('.shore-essay-heading');
      const lensMoved = Math.abs(lens1.x - lens0.x) + Math.abs(lens1.y - lens0.y);
      const headMoved = Math.abs(head1.x - head0.x) + Math.abs(head1.y - head0.y);
      if (lensMoved < 20) throw new Error(`lens moved only ${lensMoved.toFixed(1)} px`);
      if (headMoved > 2) throw new Error(`the heading moved ${headMoved.toFixed(1)} px`);
      return `lens moved ${lensMoved.toFixed(0)} px, heading ${headMoved.toFixed(1)} px`;
    });
  }
  await step('scroll the post inside the glass', async () => {
    const scroller = page.locator('.shore-reading-scroll').first();
    const before = await scroller.evaluate(el => el.scrollTop);
    await scroller.focus(); await page.keyboard.press('PageDown'); await wait(800);
    const after = await scroller.evaluate(el => el.scrollTop);
    if (after <= before) throw new Error(`no scroll (${before} to ${after})`);
    return `scrolled ${before} to ${after}`;
  });
  await step('full page and back keeps the place', async () => {
    const scroller = page.locator('.shore-reading-scroll').first();
    const before = await scroller.evaluate(el => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    await page.locator('.shore-view-toggle').first().click(); await wait(1200);
    await page.locator('.shore-view-toggle').first().click(); await wait(1200);
    const after = await scroller.evaluate(el => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    if (!(await page.locator('.shore-lens-rim').first().isVisible())) throw new Error('lens gone after returning from the full page');
    if (Math.abs(after - before) > 0.08) throw new Error(`place moved from ${(before * 100).toFixed(0)}% to ${(after * 100).toFixed(0)}%`);
    return `place ${(before * 100).toFixed(0)}% then ${(after * 100).toFixed(0)}%`;
  });
  await step('switch to "Starting your Nowbrary"', async () => {
    await page.locator('nav[aria-label="Nowbrary posts"] >> text=Starting').first().click(); await wait(1500);
    const text = (await page.locator('.shore-essay-prose:visible').first().innerText()).replace(/\s+/g, ' ');
    if (!text.includes('nowbrary usually fits in one bookcase')) throw new Error('part 2 text not shown');
    return 'part 2 shown in the lens';
  });
  await step('lower the spyglass, back on the boat', async () => {
    await page.locator('button[aria-label="Close the posts"]').first().click(); await wait(1500);
    if (await page.locator('.shore-essay-prose').first().isVisible().catch(() => false)) throw new Error('reader still open');
    return 'reader closed';
  });
  await step('ashore at the quay', async () => {
    await page.goto(url('explore?port=nowbrary&visit=quay'), { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('nav[aria-label="Explore Nowbrary on foot"] button', { hasText: /Enter the bookshop/ }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => !document.querySelector('nav[aria-label="Explore Nowbrary on foot"] button[disabled]'), null, { timeout: 30000 });
    return 'quay shown';
  });
  await step('walk into the bookshop', async () => {
    await page.locator('nav[aria-label="Explore Nowbrary on foot"] button', { hasText: /Enter the bookshop/ }).click();
    await page.locator('nav[aria-label="Walk between the shelves"]').waitFor({ state: 'visible', timeout: 30000 });
    await wait(1500);
    return 'inside';
  });
  await step("walk to Moe's shelf", async () => {
    await page.locator('nav[aria-label="Walk between the shelves"] button', { hasText: /Moe/ }).first().click();
    await page.getByRole('button', { name: /Choose a book/ }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('button.choose-book')][0]; return b && !b.disabled; }, null, { timeout: 30000 });
    await wait(1500);
    return 'at the shelf';
  });
  await step('open a book from the list', async () => {
    await page.getByRole('button', { name: /Choose a book/ }).click();
    const list = page.locator('section.shelf-titles button:not(.shelf-titles-close)');
    await list.first().waitFor({ state: 'visible', timeout: 10000 });
    const title = (await list.first().innerText()).split('\n')[0];
    await list.first().click();
    const frame = page.locator('iframe[title*="pages and notes"]').first();
    await frame.waitFor({ state: 'attached', timeout: 20000 });
    await wait(5000);
    const src = await frame.getAttribute('src');
    const inner = await (await frame.elementHandle()).contentFrame();
    const words = inner ? (await inner.locator('body').innerText().catch(() => '')).slice(0, 120).replace(/\s+/g, ' ') : '';
    if (!inner || !words) throw new Error(`book page empty (${src})`);
    return `${title}: ${src}`;
  });
  await step('close the book and walk back to the boat', async () => {
    await page.keyboard.press('Escape'); await wait(1500);
    await page.locator('nav[aria-label="Walk between the shelves"] button', { hasText: /Go outside/ }).first().click();
    await page.locator('nav[aria-label="Explore Nowbrary on foot"] button', { hasText: /Back to the boat/ }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('nav[aria-label="Explore Nowbrary on foot"] button')].find(x => /Back to the boat/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 30000 });
    await page.locator('nav[aria-label="Explore Nowbrary on foot"] button', { hasText: /Back to the boat/ }).click(); await wait(6000);
    return 'boat';
  });
  record.views.push(view);
  await page.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/record.json`, JSON.stringify(record, null, 2));
for (const v of record.views) {
  console.log(`== ${v.name}`);
  for (const s of v.steps) console.log(`${s.ok ? 'ok  ' : 'FAIL'} ${s.step}${s.note ? ': ' + s.note : ''}`);
  console.log(`files that failed to load: ${v.failed.length}${v.failed.length ? '\n  ' + [...new Set(v.failed)].slice(0, 12).join('\n  ') : ''}`);
  console.log(`page errors: ${v.errors.length}${v.errors.length ? '\n  ' + [...new Set(v.errors)].slice(0, 6).join('\n  ') : ''}`);
}
