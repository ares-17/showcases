# Landing — struttura e comportamenti

HTML, CSS e JS puri. Nessun build step, nessuna dipendenza, nessuna richiesta di rete verso terzi (font locali, il chevron della select è un data-URI SVG). Si apre anche con doppio clic.

## File

| File | Contenuto |
|---|---|
| `landing/index.html` | tutte le sezioni, JSON-LD, form |
| `landing/css/styles.css` | token (`:root`), layout, breakpoint |
| `landing/js/app.js` | form, CTA mobile, galleria a tab, prefetch |
| `landing/privacy.html` | bozza informativa, `noindex` |
| `landing/README.md` | istruzioni d'uso e segnaposto aperti |

## Sezioni, in ordine

`hero` → `#problema` → `#come-funziona` → `#moduli` → `#whatsapp` (banda scura) → `#prodotto` → `#prezzi` → `#dati` → `#domande` → `#demo` (form) → footer.

## Form → WhatsApp

Nessun backend. Il submit costruisce un messaggio e apre `wa.me`.

- Campi obbligatori: `nome`, `studio`, `email`, `professionisti`, `consenso`. Opzionali: `interessi` (checkbox), `quando`, `note`.
- Validazione custom (`novalidate`): ogni errore aggiunge `.has-error` al `.field` e scrive in `#err-<nome>`; lo stato generale va in `#form-status` (`aria-live="polite"`).
- Esito: `#result` con `#result-text`, `#wa-link`, `#copy-btn`.
- **Numero**: `landing/index.html`, `<body data-wa-number="">`, solo cifre senza `+`. Vuoto → `https://wa.me/?text=…` e il visitatore sceglie il contatto. È l'unico punto da toccare.

## CTA mobile

`#mobile-cta`. Visibile solo sotto 640px (`display: none` sopra), compare quando `scrollY > 0.65 × altezza hero` e la sezione `#demo` non è in vista. Usa l'attributo `hidden`, quindi il CSS ha bisogno di `.mobile-cta[hidden] { display: none !important }` (riga 876) — senza, la regola `display: block` del media query lo vince. `body` ha `padding-bottom: 84px` per non coprire il footer.

## Galleria a tab

Bottoni `role="tab"`, pannelli `aria-controls` con `hidden`. Navigazione da tastiera: frecce, Home, End. I pannelli non attivi vengono precaricati con `requestIdleCallback` (fallback 1800 ms), saltati se `navigator.connection.saveData` o `effectiveType` è `2g`: senza prefetch il cambio tab mostra un fotogramma vuoto.

## Breakpoint

| Soglia | Cosa cambia |
|---|---|
| 1080 | gutter ridotto |
| 960 | griglie a due colonne → una |
| 640 | header compatto, hero con solo telefono, CTA mobile, tutto a colonna singola |
| `prefers-reduced-motion` | animazioni e reveal disattivati |

## Regole di copy

Il lessico e i claim vietati stanno in `docs/positioning.md`: leggilo prima di riscrivere un titolo. In sintesi: dentisti, "sedute", "in poltrona", nessun trial, nessuna testimonianza.

## Segnaposto aperti

Numero WhatsApp, dati del titolare in `privacy.html`, dominio `studioms.it` in canonical/Open Graph/JSON-LD, demo navigabile citata ma non esistente. Elenco aggiornato in `landing/README.md`.
