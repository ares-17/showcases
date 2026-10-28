# Landing — struttura e comportamenti

HTML, CSS e JS puri. Nessun build step, nessuna dipendenza, nessuna richiesta di rete verso terzi (font locali, il chevron della select è un data-URI SVG). Si apre anche con doppio clic.

## File

| File | Contenuto |
|---|---|
| `landing/index.html` | tutte le sezioni, JSON-LD, form |
| `landing/css/styles.css` | token (`:root`), layout, breakpoint |
| `landing/js/app.js` | form, calcolatore, FAB |
| `landing/privacy.html` | bozza informativa, `noindex` |
| `landing/README.md` | istruzioni d'uso e segnaposto aperti |

## Sezioni, in ordine

`hero` (banda scura) → `#problema` (campo `--brand-soft`, con calcolatore scuro) → `#come-funziona` → `#moduli` → `#whatsapp` (banda scura) → `#prezzi` → `#dati` → `#domande` → `#demo` (banda scura, form) → footer.

La hero è split su desktop (≥961px): copy a sinistra, screenshot `agenda-wide` a destra, telefono in sovrapposizione. Sotto 961px torna centrata; sotto 640px restano solo H1 e sottotitolo, senza render e senza CTA (l'unica azione di prenotazione è quella nell'header). La gallery a tab è stata rimossa: le schermate vivono solo nelle righe di `#moduli`, con immagine inline. La sezione demo usa lo stesso fondo scuro della hero, con card form bianca.

`#problema` è l'unica sezione su campo `--brand-soft`: card bianche separate da linee `rgba(0,25,69,.16)`, badge numerico `--error`, e in fondo il calcolatore su `--brand-deep`. Serve a staccare la diagnosi dalle bande scure di hero e demo.

## Calcolatore

In fondo a `#problema`, pannello `--brand-deep` con testo `--paper` e due `input[type="range"]`:

- disdette non recuperate a settimana: 0–15, default 3;
- valore medio di una seduta: 30–300 €, default 90.

Formula: `disdette × valore × 52` per l'anno, diviso 12 per il mese. Default: 1.170 €/mese, 14.040 €/anno. Gli importi sono formattati con `Intl.NumberFormat('it-IT', { useGrouping: 'always' })`: senza l'opzione, i numeri a quattro cifre come 1170 restano senza separatore. Il totale annuale è in una regione `aria-live="polite"`. Il count-up del totale mensile è solo visivo e viene saltato con `prefers-reduced-motion`. Copy di sicurezza: «La stima è tua, non nostra» e «Stima indicativa».

## Form → WhatsApp

Nessun backend. Il submit costruisce un messaggio e apre `wa.me`.

- Campi obbligatori: `nome`, `studio`, `email`, `professionisti`, `consenso`. Opzionali: `interessi` (checkbox), `quando`, `note`.
- Validazione custom (`novalidate`): ogni errore aggiunge `.has-error` al `.field` e scrive in `#err-<nome>`; lo stato generale va in `#form-status` (`aria-live="polite"`).
- Esito: `#result` con `#result-text`, `#wa-link`, `#copy-btn`.
- **Numero**: `landing/index.html`, `<body data-wa-number="">`, solo cifre senza `+`. Vuoto → `https://wa.me/?text=…` e il visitatore sceglie il contatto. È l'unico punto da toccare.

## Header

`position: fixed`, altezza `--header-h` (68px), sempre sopra il contenuto. Due stati, gestiti da `data-scrolled` su `.site-header` (`app.js`, soglia 8px, rAF):

| Stato | Fondo | Testo |
|---|---|---|
| In cima | trasparente, nessun blur: la banda scura della hero passa sotto | wordmark `--paper`, link `rgba(249,249,255,.74)`, CTA `--brand-soft` su `--brand-deep` |
| Dopo lo scroll | `rgba(249,249,255,.88)` + `backdrop-filter: blur(16px)` + bordo `--line-soft` | wordmark `--ink`, link `--muted`, CTA `--brand` |

Il fondo a 0.88 lascia intravedere il contenuto senza sporcare la barra; sopra 0.95 diventa una barra opaca e il QA lo segnala. La hero paga l'header fuori dal flusso con `padding-top: calc(var(--header-h) + var(--hero-top))`: nessun margine negativo, nessun contenuto coperto.

## Hero

- ≥961px: griglia a due colonne (copy ~55%, media ~45%), copy allineata a sinistra, H1 max 3 righe, screenshot intero sopra la piega a 1440×900.
- 641–960px: hero centrata, copy completa, screenshot a piena larghezza.
- ≤640px: solo `h1` e `.hero-sub`, allineati a sinistra (H1 2.4rem, `line-height` 1.02, `max-width` 22ch); eyebrow, micro-row, CTA (primaria e secondaria), `.hero-media` e figcaption nascosti. Nessuno screenshot: a 210px di larghezza la UI è illeggibile.
- Le immagini hanno `sizes` allineati al layout: desktop ~46vw, telefono ~12vw desktop.

## FAB

`#fab-right` è un `<a href="#demo">` fisso in basso a destra, visibile da 641px in su e nascosto su mobile. Un `IntersectionObserver` imposta `hidden` quando `#demo` è in vista. Il CSS ha `.fab-right[hidden] { display: none !important }` perché la regola del media query (`display: block`) vincerebbe l'attributo. Non esiste più la bottom bar mobile: niente `#mobile-cta`, niente padding-bottom sul body.

## Breakpoint

| Soglia | Cosa cambia |
|---|---|
| 1080 | gutter ridotto |
| 961 | hero passa a due colonne |
| 960 | griglie a due colonne → una; hero torna centrata a piena larghezza |
| 640 | header compatto, hero solo H1 + sottotitolo, FAB nascosto, tutto a colonna singola |
| ≤640 e altezza ≤720 | hero più compatta: H1 2.2rem |
| ≤640 e altezza ≤600 | H1 2.05rem |
| `prefers-reduced-motion` | animazioni, reveal e count-up disattivati |

Sui fondi scuri il testo secondario non scende sotto `rgba(249, 249, 255, 0.6)`: a 0.45 le note da 11–12px non passano il contrasto AA.

## Regole di copy

Il lessico e i claim vietati stanno in `docs/positioning.md`: leggilo prima di riscrivere un titolo. In sintesi: dentisti, "sedute", "in poltrona", nessun trial, nessuna testimonianza.

## Segnaposto aperti

Numero WhatsApp, dati del titolare in `privacy.html`, dominio `studioms.it` in canonical/Open Graph/JSON-LD, demo navigabile citata ma non esistente. Elenco aggiornato in `landing/README.md`.
