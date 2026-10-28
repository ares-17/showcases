#!/usr/bin/env node
/**
 * Smoke test visivo e funzionale della landing.
 *
 *   node tools/qa/run.mjs
 *
 * Apre landing/index.html su 1440, 390, 375 e 320 px, controlla overflow,
 * console, richieste fallite, immagini rotte, hero sopra la piega,
 * FAB desktop e comportamento del form. Salva gli screenshot in .qa/.
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

/** Canale alpha di un colore computed: "rgba(249, 249, 255, 0.82)" -> 0.82 */
const alphaOf = (color) => {
  const parts = String(color).match(/[\d.]+/g);
  if (!parts) return 1;
  return parts.length === 4 ? Number(parts[3]) : 1;
};

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
      ['mobile 375', { width: 375, height: 667 }],
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

      await page.screenshot({ path: join(SHOTS, `${label.replace(/\s+/g, '-')}.png`), fullPage: false });

      if (label === 'desktop 1440') {
        const hero = await page.evaluate(() => {
          const box = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              left: Math.round(r.left),
              right: Math.round(r.right),
              display: getComputedStyle(el).display,
            };
          };
          const h1 = document.querySelector('.hero h1');
          const h1Style = getComputedStyle(h1);
          const fab = document.getElementById('fab-right');
          const header = document.querySelector('.site-header');
          const headerStyle = getComputedStyle(header);
          return {
            header: {
              position: headerStyle.position,
              background: headerStyle.backgroundColor,
              height: Math.round(header.getBoundingClientRect().height),
              brand: getComputedStyle(document.querySelector('.site-header .brand')).color,
              h1Top: Math.round(h1.getBoundingClientRect().top),
            },
            copy: box('.hero-copy'),
            desktop: box('.hero-desktop'),
            phone: box('.hero-phone'),
            fab: box('#fab-right'),
            h1Lines: Math.round(h1.getBoundingClientRect().height / parseFloat(h1Style.lineHeight)),
            heroPrimary: document.querySelectorAll('.hero .btn-primary').length,
            headerCtaHref: document.querySelector('.site-header .btn-primary')?.getAttribute('href'),
            fabTag: fab?.tagName,
            fabHref: fab?.getAttribute('href'),
            fabPosition: fab ? getComputedStyle(fab).position : null,
          };
        });
        if (!hero.desktop || hero.desktop.display === 'none') fail('desktop: screenshot hero nascosto');
        if (hero.desktop && hero.desktop.bottom > 900) fail(`desktop: screenshot hero sotto la piega (${hero.desktop.bottom}px)`);
        if (hero.copy && hero.desktop && hero.copy.right > hero.desktop.left + 1) fail(`desktop: copy e screenshot si sovrappongono (${hero.copy.right} > ${hero.desktop.left})`);
        if (hero.phone && hero.phone.bottom > 900) fail(`desktop: telefono hero sotto la piega (${hero.phone.bottom}px)`);
        if (hero.h1Lines > 3) fail(`desktop: H1 su ${hero.h1Lines} righe (max 3)`);
        if (hero.heroPrimary !== 0) fail(`desktop: CTA primaria nella hero (${hero.heroPrimary}); l'unica azione è nell'header`);
        if (hero.headerCtaHref !== '#demo') fail(`desktop: CTA header non punta a #demo (${hero.headerCtaHref})`);
        if (hero.header.position !== 'fixed') fail(`header: non è fixed (${hero.header.position})`);
        if (alphaOf(hero.header.background) > 0.05) fail(`header: ha già un fondo in cima (${hero.header.background})`);
        if (hero.header.h1Top < hero.header.height) fail(`header: copre il titolo (${hero.header.h1Top} < ${hero.header.height})`);
        const brandLum = Number((hero.header.brand.match(/[\d.]+/g) || []).slice(0, 3).reduce((a, v) => a + Number(v), 0)) / 3;
        if (brandLum < 200) fail(`header: wordmark non leggibile sulla banda scura (${hero.header.brand})`);

        await page.evaluate(() => window.scrollTo(0, 420));
        await page.waitForTimeout(250);
        const headerScrolled = await page.evaluate(() => {
          const h = document.querySelector('.site-header');
          return { background: getComputedStyle(h).backgroundColor, state: h.dataset.scrolled };
        });
        if (headerScrolled.state !== 'true') fail('header: data-scrolled non impostato dopo lo scroll');
        const scrolledAlpha = alphaOf(headerScrolled.background);
        if (scrolledAlpha < 0.6) fail(`header: fondo troppo trasparente dopo lo scroll (${headerScrolled.background})`);
        if (scrolledAlpha > 0.95) fail(`header: fondo troppo opaco dopo lo scroll, non lascia intravedere (${headerScrolled.background})`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        if (hero.fabTag !== 'A' || hero.fabHref !== '#demo') fail(`desktop: FAB non è un link a #demo (${hero.fabTag}, ${hero.fabHref})`);
        if (hero.fabPosition !== 'fixed') fail(`desktop: FAB non è fixed (${hero.fabPosition})`);
        if (!hero.fab || hero.fab.display === 'none') fail('desktop: FAB nascosto');
        if (hero.fab && (hero.fab.bottom > 900 || hero.fab.right > 1440)) fail('desktop: FAB fuori viewport');

        await page.click('#fab-right');
        await page.waitForTimeout(700);
        const fabAfter = await page.evaluate(() => {
          const fab = document.getElementById('fab-right');
          return { hash: location.hash, hidden: fab.hidden, display: getComputedStyle(fab).display };
        });
        if (fabAfter.hash !== '#demo') fail(`desktop: il FAB non porta a #demo (${fabAfter.hash})`);
        if (!fabAfter.hidden) fail('desktop: il FAB resta visibile dentro #demo');
        if (fabAfter.display !== 'none') fail(`desktop: FAB con hidden ma display:${fabAfter.display} dentro #demo`);

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
      } else {
        const mobile = await page.evaluate(() => {
          const box = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              left: Math.round(r.left),
              right: Math.round(r.right),
              display: getComputedStyle(el).display,
            };
          };
          const display = (sel) => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el).display : null;
          };
          const headerEl = document.querySelector('.site-header');
          const headerCta = headerEl.querySelector('.btn-primary');
          return {
            header: { height: Math.round(headerEl.getBoundingClientRect().height) },
            h1Top: Math.round(document.querySelector('.hero h1').getBoundingClientRect().top),
            copy: box('.hero-copy'),
            h1: display('.hero h1'),
            sub: display('.hero-sub'),
            media: display('.hero-media'),
            phone: box('.hero-phone'),
            caption: box('.hero-media figcaption'),
            heroPrimary: document.querySelectorAll('.hero .btn-primary').length,
            headerCta: headerCta
              ? { display: getComputedStyle(headerCta).display, href: headerCta.getAttribute('href') }
              : null,
            fab: display('#fab-right'),
            mobileCta: !!document.getElementById('mobile-cta'),
            hidden: {
              eyebrow: display('.hero .eyebrow'),
              micro: display('.hero .micro-row'),
              btnRow: display('.hero .btn-row'),
            },
          };
        });
        if (mobile.mobileCta) fail(`${label}: #mobile-cta è ancora nel DOM`);
        if (mobile.fab !== 'none') fail(`${label}: FAB visibile su mobile (${mobile.fab})`);
        for (const [name, value] of Object.entries(mobile.hidden)) {
          if (value !== 'none') fail(`${label}: ${name} hero ancora visibile (${value})`);
        }
        if (mobile.h1 === 'none') fail(`${label}: H1 nascosto`);
        if (mobile.sub === 'none') fail(`${label}: sottotitolo hero nascosto`);
        if (mobile.h1Top < mobile.header.height) fail(`${label}: header copre il titolo (${mobile.h1Top} < ${mobile.header.height})`);
        if (mobile.media === 'none') fail(`${label}: render hero nascosto su mobile`);
        if (mobile.phone && mobile.phone.display === 'none') fail(`${label}: telefono hero nascosto su mobile`);
        if (mobile.phone && mobile.caption && mobile.phone.bottom > mobile.caption.top) {
          fail(`${label}: telefono hero sopra la didascalia (${mobile.phone.bottom} > ${mobile.caption.top})`);
        }
        if (mobile.heroPrimary !== 0) fail(`${label}: CTA primaria nella hero (${mobile.heroPrimary})`);
        if (!mobile.headerCta || mobile.headerCta.display === 'none') fail(`${label}: CTA header non visibile`);
        else if (mobile.headerCta.href !== '#demo') fail(`${label}: CTA header non punta a #demo (${mobile.headerCta.href})`);
        if (mobile.copy && mobile.copy.bottom > viewport.height) fail(`${label}: copy hero sotto la piega (${mobile.copy.bottom} > ${viewport.height})`);
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
  console.log('\n✓ landing a posto (4 viewport, hero, FAB, form)\n');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
