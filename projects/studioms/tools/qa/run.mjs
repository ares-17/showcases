#!/usr/bin/env node
/**
 * Smoke test visivo e funzionale della landing.
 *
 *   node tools/qa/run.mjs
 *
 * Apre landing/index.html su 1440, 390 e 320 px, controlla overflow,
 * console, richieste fallite, immagini rotte, comportamento del form e
 * della CTA mobile. Salva gli screenshot in .qa/.
 *
 * Playwright viene cercato in: questo repo, $PLAYWRIGHT_DIR, poi
 * un'installazione sorella del workspace: ../../../osteopacity/frontend/node_modules
 * rispetto alla radice del progetto (installazione già presente sulla macchina).
 * Esce con codice 1 al primo gruppo di controlli falliti.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = join(ROOT, 'landing');
const SHOTS = join(ROOT, '.qa');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function loadPlaywright() {
  const candidates = [
    ROOT,
    process.env.PLAYWRIGHT_DIR,
    resolve(ROOT, '..', '..', '..', 'osteopacity', 'frontend', 'node_modules'),
  ].filter(Boolean);
  for (const dir of candidates) {
    try {
      const require = createRequire(join(dir, 'noop.cjs'));
      return require('playwright');
    } catch {
      // prova il prossimo
    }
  }
  throw new Error(
    `playwright non trovato. Installa con: npm i -D playwright && npx playwright install chromium\n` +
      `oppure indica la cartella: PLAYWRIGHT_DIR=/percorso/node_modules node tools/qa/run.mjs`,
  );
}

function serve() {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = join(SITE, url === '/' ? 'index.html' : url);
    if (!file.startsWith(SITE)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const stream = createReadStream(file);
    stream.on('open', () => {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      stream.pipe(res);
    });
    stream.on('error', () => res.writeHead(404).end('not found'));
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);

async function settle(page) {
  // lo scroll fluido del CSS renderebbe le misure dipendenti dal tempo
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  await page.evaluate(async () => {
    for (const img of [...document.images]) {
      img.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function pageHealth(page, label) {
  const health = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    pending: [...document.images].filter((i) => !i.complete).map((i) => i.src.split('/').pop()),
  }));
  if (health.overflow > 1) fail(`${label}: overflow orizzontale di ${health.overflow}px`);
  if (health.broken.length) fail(`${label}: immagini rotte → ${health.broken.join(', ')}`);
  if (health.pending.length) notes.push(`${label}: immagini non caricate → ${health.pending.join(', ')}`);
  return health;
}

async function run() {
  await mkdir(SHOTS, { recursive: true });
  const { chromium } = loadPlaywright();
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const consoleErrors = [];
  const networkErrors = [];

  try {
    for (const [label, viewport] of [
      ['desktop 1440', { width: 1440, height: 900 }],
      ['mobile 390', { width: 390, height: 844 }],
      ['mobile 320', { width: 320, height: 568 }],
    ]) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', (e) => consoleErrors.push(`${label}: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push(`${label}: ${m.text()}`));
      page.on('requestfailed', (r) => networkErrors.push(`${label}: ${r.url().split('/').pop()}`));
      page.on('response', (r) => {
        if (r.status() >= 400) networkErrors.push(`${label}: ${r.status()} ${r.url().split('/').pop()}`);
      });

      await page.goto(base, { waitUntil: 'networkidle' });
      await settle(page);
      await pageHealth(page, label);

      if (label === 'desktop 1440') {
        // form vuoto → cinque errori sui campi obbligatori
        await page.locator('#demo-form').scrollIntoViewIfNeeded();
        await page.click('#demo-form button[type="submit"]');
        await page.waitForTimeout(150);
        const errs = await page.locator('.field.has-error').count();
        if (errs !== 5) fail(`form vuoto: attesi 5 campi in errore, trovati ${errs}`);

        // form valido → link wa.me con il messaggio
        await page.fill('#nome', 'Marco Bianchi');
        await page.fill('#studio', 'Studio Bianchi — Milano');
        await page.fill('#email', 'marco@studiobianchi.it');
        await page.selectOption('#professionisti', { index: 1 });
        await page.check('#consenso');
        await page.click('#demo-form button[type="submit"]');
        await page.waitForTimeout(200);
        const link = await page.getAttribute('#wa-link', 'href');
        const visible = await page.locator('#result').isVisible();
        if (!visible) fail('form valido: il blocco risultato non è visibile');
        if (!link?.startsWith('https://wa.me/')) fail(`form valido: link inatteso (${link})`);
        else if (!decodeURIComponent(link).includes('Studio Bianchi')) fail('form valido: il messaggio non contiene lo studio');
        await page.screenshot({ path: join(SHOTS, 'form-result.png'), fullPage: false });
      }

      if (label.startsWith('mobile')) {
        const ctaState = () => page.evaluate(() => {
          const el = document.getElementById('mobile-cta');
          return { hidden: el.hidden, display: getComputedStyle(el).display };
        });
        const atTop = await ctaState();
        if (!atTop.hidden) fail(`${label}: la CTA mobile è visibile sopra la piega`);
        if (atTop.display !== 'none') fail(`${label}: la CTA mobile ha hidden ma resta display:${atTop.display} sopra la piega`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
        await page.waitForTimeout(250);
        const mid = await ctaState();
        if (mid.hidden) fail(`${label}: la CTA mobile non compare a metà pagina`);
        if (mid.display === 'none') fail(`${label}: la CTA mobile resta nascosta a metà pagina`);
      }

      await page.screenshot({ path: join(SHOTS, `${label.replace(/\s+/g, '-')}.png`), fullPage: false });

      if (label.startsWith('mobile')) {
        await page.evaluate(() => document.getElementById('demo').scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(400);
        const inDemo = await page.evaluate(() => {
          const el = document.getElementById('mobile-cta');
          return { hidden: el.hidden, display: getComputedStyle(el).display };
        });
        if (!inDemo.hidden) fail(`${label}: la CTA mobile resta visibile dentro #demo`);
        if (inDemo.display !== 'none') fail(`${label}: la CTA mobile ha hidden ma resta display:${inDemo.display} dentro #demo`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  for (const e of consoleErrors) fail(`console: ${e}`);
  for (const e of networkErrors) fail(`rete: ${e}`);

  console.log(`screenshot in ${join(ROOT, '.qa')}`);
  for (const n of notes) console.log(`  · ${n}`);
  if (failures.length) {
    console.log(`\n${failures.length} problemi:`);
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log('\n✓ landing a posto (3 viewport, form, CTA)\n');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
