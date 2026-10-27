# QA — cosa gira, quando, e cosa non copre

Due comandi coprono il 90% dei casi. Girano in locale, senza CI.

```bash
npm run assets   # coerenza immagini (riferimenti, orfani, manifest)
npm run qa       # landing nei 3 viewport + form + CTA (Playwright)
npm run check    # deck: HyperFrames lint/runtime/layout/motion/contrast
```

## `npm run qa` — `tools/qa/run.mjs`

Apre `landing/index.html` servito da un server statico interno su 1440×900, 390×844, 320×568.

Verifica:

| Controllo | Fallisce se |
|---|---|
| Overflow orizzontale | `scrollWidth - innerWidth > 1` |
| Immagini | una `<img>` ha `naturalWidth === 0` dopo lo scroll in vista |
| Console / rete | `pageerror`, `console.error`, risposta ≥ 400, richiesta fallita |
| Form vuoto | i campi in `.field.has-error` non sono 5 |
| Form valido | `#result` non visibile, o `#wa-link` non è `https://wa.me/…` con lo studio nel testo |
| CTA mobile | visibile sopra la piega, o assente a metà pagina |

Screenshot in `.qa/` (ignorata da git): `desktop-1440.png`, `mobile-390.png`, `mobile-320.png`, `form-result.png`.

**Playwright** non è una dipendenza di questa repo. Lo script lo cerca in: repo, `$PLAYWRIGHT_DIR`, `../../../osteopacity/frontend/node_modules` (installazione già presente sulla macchina). Se manca:

```bash
npm i -D playwright && npx playwright install chromium
# oppure
PLAYWRIGHT_DIR=/percorso/node_modules node tools/qa/run.mjs
```

Nota: il CSS ha `scroll-behavior: smooth`; lo script lo disattiva prima di misurare, altrimenti la CTA mobile risulta visibile mentre la pagina sta ancora tornando in cima.

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
