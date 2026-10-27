#!/usr/bin/env node
/**
 * Verifica e rigenera le schermate della landing.
 *
 *   node tools/assets.mjs            # check (default)
 *   node tools/assets.mjs check
 *   node tools/assets.mjs build      # rigenera tutte le WebP dal master
 *   node tools/assets.mjs build dashboard   # solo una schermata
 *
 * Esce con codice 1 se: un file referenziato non esiste, una WebP non è
 * referenziata da nessuno (derivata morta), il manifest dichiara qualcosa
 * che non c'è. Gli asset del deck non referenziati sono solo warning,
 * perché i master servono a produrre i ritagli.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'assets/manifest.json';

const errors = [];
const warnings = [];
const ok = [];

const abs = (p) => join(ROOT, p);
const rel = (p) => relative(ROOT, p);
const exists = async (p) => {
  try {
    await stat(abs(p));
    return true;
  } catch {
    return false;
  }
};

async function read(p) {
  return readFile(abs(p), 'utf8');
}

/** Estrae src, href e srcset di un file HTML, risolti rispetto alla sua cartella. */
async function refsIn(htmlPath) {
  const html = await read(htmlPath);
  const baseDir = dirname(htmlPath);
  const raw = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) raw.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) raw.add(url);
    }
  }
  return [...raw]
    .filter((u) => !/^(https?:|data:|mailto:|tel:|#)/.test(u))
    .map((u) => normalize(join(baseDir, u.split('?')[0].split('#')[0])));
}

/** Estrae url(...) da un CSS, risolti rispetto al file. */
async function cssRefsIn(cssPath) {
  const css = await read(cssPath);
  const baseDir = dirname(cssPath);
  return [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
    .map((m) => m[1])
    .filter((u) => !/^(https?:|data:)/.test(u))
    .map((u) => normalize(join(baseDir, u)));
}

async function listFiles(dir, ext) {
  try {
    const entries = await readdir(abs(dir));
    return entries.filter((e) => e.endsWith(ext)).map((e) => normalize(join(dir, e)));
  } catch {
    return [];
  }
}

async function check() {
  const manifest = JSON.parse(await read(MANIFEST));
  const screens = manifest.screens ?? [];
  const deckMasters = new Set(manifest.deckMasters ?? []);

  const landingRefs = new Set([
    ...(await refsIn('landing/index.html')),
    ...(await refsIn('landing/privacy.html')),
    ...(await cssRefsIn('landing/css/styles.css')),
  ]);
  const deckRefs = new Set(await refsIn('index.html'));

  // 1. ogni riferimento deve esistere
  for (const ref of landingRefs) {
    if (await exists(ref)) ok.push(`rif ${ref}`);
    else errors.push(`riferimento rotto nella landing: ${ref}`);
  }
  for (const ref of deckRefs) {
    if (!ref.startsWith('assets/')) continue;
    if (await exists(ref)) ok.push(`rif ${ref}`);
    else errors.push(`riferimento rotto nel deck: ${ref}`);
  }

  // 2. il manifest deve descrivere file che esistono
  const declaredLandingMasters = new Set();
  for (const s of screens) {
    const l = s.landing ?? {};
    if (l.master) {
      declaredLandingMasters.add(l.master);
      if (!(await exists(l.master))) errors.push(`master dichiarato e assente: ${l.master}`);
    }
    for (const w of l.widths ?? []) {
      const out = `landing/assets/screens/webp/${s.id}-${w}.webp`;
      if (!(await exists(out))) errors.push(`WebP dichiarata e assente: ${out} (lancia: node tools/assets.mjs build ${s.id})`);
    }
    for (const crop of s.deck?.crops ?? []) {
      if (!(await exists(crop))) errors.push(`ritaglio deck dichiarato e assente: ${crop}`);
      else if (!deckRefs.has(crop)) warnings.push(`ritaglio deck dichiarato ma non usato: ${crop}`);
    }
  }

  // 3. nessuna derivata morta nella landing (il caso che ha già causato un re-render)
  for (const webp of await listFiles('landing/assets/screens/webp', '.webp')) {
    if (!landingRefs.has(webp)) errors.push(`WebP orfana (nessuno la usa): ${webp}`);
    else ok.push(`usata ${webp}`);
  }

  // 4. master della landing non registrati
  for (const png of await listFiles('landing/assets/screens', '.png')) {
    if (!declaredLandingMasters.has(png)) warnings.push(`master non registrato nel manifest: ${png}`);
  }

  // 5. asset del deck non referenziati e non dichiarati master
  for (const png of await listFiles('assets/screens', '.png')) {
    if (!deckRefs.has(png) && !deckMasters.has(png)) warnings.push(`asset deck non usato né dichiarato: ${png}`);
  }

  report(manifest);
}

function report(manifest) {
  console.log(`\nschermate dichiarate: ${manifest.screens.length}`);
  console.log(`controlli superati: ${ok.length}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning:`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (errors.length) {
    console.log(`\n${errors.length} errori:`);
    for (const e of errors) console.log(`  ✗ ${e}`);
    console.log('');
    process.exit(1);
  }
  console.log('\n✓ asset coerenti\n');
}

async function build(onlyId) {
  const manifest = JSON.parse(await read(MANIFEST));
  const targets = manifest.screens.filter((s) => !onlyId || s.id === onlyId);
  if (!targets.length) {
    console.error(`nessuna schermata con id "${onlyId}" nel manifest`);
    process.exit(1);
  }
  for (const s of targets) {
    const master = s.landing?.master;
    if (!master || !(await exists(master))) {
      console.error(`  ✗ ${s.id}: master assente (${master ?? 'non dichiarato'})`);
      process.exitCode = 1;
      continue;
    }
    for (const w of s.landing.widths ?? []) {
      const out = `landing/assets/screens/webp/${s.id}-${w}.webp`;
      const quality = String(manifest.webp?.quality?.[w] ?? 82);
      await exec('magick', [abs(master), '-resize', `${w}x`, '-strip', '-quality', quality, abs(out)]);
      console.log(`  ✓ ${out} (${w}px, q${quality})`);
    }
  }
}

const [command = 'check', arg] = process.argv.slice(2);
if (command === 'build') await build(arg);
else if (command === 'check') await check();
else {
  console.error('uso: node tools/assets.mjs [check|build] [id-schermata]');
  process.exit(1);
}
