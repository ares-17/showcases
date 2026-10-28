# QA — cosa gira, quando, e cosa non copre

Due comandi coprono il 90% dei casi. Girano in locale, senza CI.

```bash
npm run assets   # coerenza immagini (riferimenti, orfani, manifest)
npm run qa       # landing nei 4 viewport + form + hero/FAB (Playwright)
npm run check    # deck: HyperFrames lint/runtime/layout/motion/contrast
```

## `npm run qa` — `tools/qa/run.mjs`

Apre `landing/index.html` servito da un server statico interno su 1440×900, 390×844, 375×667, 320×568.

Verifica:

| Controllo | Fallisce se |
|---|---|
| Overflow orizzontale | `scrollWidth - innerWidth > 1` |
| Immagini | una `<img>` ha `naturalWidth === 0` dopo lo scroll in vista |
| Console / rete | `pageerror`, `console.error`, risposta ≥ 400, richiesta fallita |
| Form vuoto | i campi in `.field.has-error` non sono 5 |
| Form valido | `#result` non visibile, o `#wa-link` non è `https://wa.me/…` con lo studio nel testo |
| Header | non è `fixed`, ha già un fondo in cima, copre il titolo, wordmark scuro sulla banda, o dopo lo scroll il fondo è fuori da 0.60–0.95 di opacità |
| Hero desktop | screenshot sotto la piega, copy/media sovrapposti, H1 su più di 3 righe |
| Hero mobile | sottotitolo nascosto, `.hero-media` nascosto, telefono nascosto o che scavalca la didascalia, una CTA primaria dentro la hero, la CTA dell'header assente o con `href` diverso da `#demo`, o copy che scende sotto la piega a 390×844, 375×667 o 320×568 |
| FAB | non è `<a href="#demo">`, non è `fixed`, è visibile su mobile, o non si nasconde dentro `#demo` |
| Bottom bar | `#mobile-cta` è ancora nel DOM |

Screenshot in `.qa/` (ignorata da git): `desktop-1440.png`, `mobile-390.png`, `mobile-375.png`, `mobile-320.png`, `form-result.png`.

**Playwright** non è una dipendenza di questa repo. Lo script lo cerca in: repo, `$PLAYWRIGHT_DIR`, `../../../osteopacity/frontend/node_modules` (installazione già presente sulla macchina). Se manca:

```bash
npm i -D playwright && npx playwright install chromium
# oppure
PLAYWRIGHT_DIR=/percorso/node_modules node tools/qa/run.mjs
```

Nota: il CSS ha `scroll-behavior: smooth`; lo script lo disattiva prima di misurare, altrimenti il FAB può risultare visibile mentre la pagina sta ancora tornando in cima.

## Cosa non copre

- **Nessun audit di accessibilità** oltre alla navigazione da tastiera provata a mano (frecce/Home/End sulle tab). `web-design-guidelines` resta un controllo manuale.
- **Nessun Lighthouse / Core Web Vitals.**
- **Un solo browser**: Chromium. Safari e Firefox non sono verificati.
- **Contenuto delle immagini**: l'OCR per i claim vietati è manuale, vedi `docs/positioning.md`.

## Sequenza consigliata dopo una modifica

| Hai toccato | Comandi |
|---|---|
| CSS/JS/HTML landing | `npm run qa`, poi guarda `.qa/*.png` |
| Immagini o manifest | `npm run assets && npm run qa` |
| `index.html` del deck | `npm run check`, poi `snapshot --at <secondo>` |
| Asset del deck | `npm run check`, `snapshot`, e solo se serve un render: `npm run render -- -o renders/studioms-deck.mp4` |
| Copy su entrambi | tutto quanto sopra, più il grep OCR di `docs/positioning.md` |
