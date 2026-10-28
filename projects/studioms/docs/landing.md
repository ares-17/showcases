# Landing — struttura e comportamenti

HTML, CSS e JS puri. Nessun build step, nessuna dipendenza, nessuna richiesta di rete verso terzi (font locali, il chevron della select è un data-URI SVG). Si apre anche con doppio clic.

## File

| File | Contenuto |
|---|---|
| `landing/index.html` | tutte le sezioni, JSON-LD, form |
| `landing/css/styles.css` | token (`:root`), layout, breakpoint |
| `landing/js/app.js` | form, calcolatore, CTA mobile |
| `landing/privacy.html` | bozza informativa, `noindex` |
| `landing/README.md` | istruzioni d'uso e segnaposto aperti |

## Sezioni, in ordine

`hero` (banda scura) → `#problema` (banda scura, con calcolatore) → `#come-funziona` → `#moduli` → `#whatsapp` (banda scura) → `#prezzi` → `#dati` → `#domande` → `#demo` (banda scura, form) → footer.

La hero è centrata su fondo `--band`, con screenshot `agenda-wide` e telefono in sovrapposizione. La gallery a tab è stata rimossa: le schermate vivono solo nelle righe di `#moduli`, con immagine inline. La sezione demo usa lo stesso fondo scuro della hero, con card form bianca.

## Calcolatore

In fondo a `#problema`, pannello `--brand-soft` con due `input[type="range"]`:

- disdette non recuperate a settimana: 0–15, default 3;
- valore medio di una seduta: 30–300 €, default 90.

Formula: `disdette × valore × 52` per l'anno, diviso 12 per il mese. Default: 1.170 €/mese, 14.040 €/anno. Gli importi sono formattati con `Intl.NumberFormat('it-IT', { useGrouping: 'always' })`: senza l'opzione, i numeri a quattro cifre come 1170 restano senza separatore. Il totale annuale è in una regione `aria-live="polite"`. Il count-up del totale mensile è solo visivo e viene saltato con `prefers-reduced-motion`. Copy di sicurezza: «La stima è tua, non nostra» e «Stima indicativa».

## Form → WhatsApp

Nessun backend. Il submit costruisce un messaggio e apre `wa.me`.

- Campi obbligatori: `nome`, `studio`, `email`, `professionisti`, `consenso`. Opzionali: `interessi` (checkbox), `quando`, `note`.
- Validazione custom (`novalidate`): ogni errore aggiunge `.has-error` al `.field` e scrive in `#err-<nome>`; lo stato generale va in `#form-status` (`aria-live="polite"`).
- Esito: `#result` con `#result-text`, `#wa-link`, `#copy-btn`.
- **Numero**: `landing/index.html`, `<body data-wa-number="">`, solo cifre senza `+`. Vuoto → `https://wa.me/?text=…` e il visitatore sceglie il contatto. È l'unico punto da toccare.

## CTA mobile

`#mobile-cta`. Visibile solo sotto 640px (`display: none` sopra), compare quando `scrollY > 0.65 × altezza hero` e la sezione `#demo` non è in vista. Usa l'attributo `hidden`, quindi il CSS ha bisogno di `.mobile-cta[hidden] { display: none !important }`: senza, la regola `display: block` del media query lo vince. Il QA controlla anche il `display` calcolato, non solo l'attributo. `body` ha `padding-bottom: 84px` per non coprire il footer.

## Breakpoint

| Soglia | Cosa cambia |
|---|---|
| 1080 | gutter ridotto |
| 960 | griglie a due colonne → una; hero con screenshot a piena larghezza |
| 640 | header compatto, hero con solo telefono, CTA mobile, tutto a colonna singola |
| `prefers-reduced-motion` | animazioni, reveal e count-up disattivati |

Sui fondi scuri il testo secondario non scende sotto `rgba(249, 249, 255, 0.6)`: a 0.45 le note da 11–12px non passano il contrasto AA.

## Regole di copy

Il lessico e i claim vietati stanno in `docs/positioning.md`: leggilo prima di riscrivere un titolo. In sintesi: dentisti, "sedute", "in poltrona", nessun trial, nessuna testimonianza.

## Segnaposto aperti

Numero WhatsApp, dati del titolare in `privacy.html`, dominio `studioms.it` in canonical/Open Graph/JSON-LD, demo navigabile citata ma non esistente. Elenco aggiornato in `landing/README.md`.
