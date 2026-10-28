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

`hero` (banda scura) → `#problema` (banda scura, con calcolatore) → `#come-funziona` → `#moduli` → `#whatsapp` (banda scura) → `#prezzi` → `#dati` → `#domande` → `#demo` (banda scura, form) → footer.

La hero è split su desktop (≥961px): copy a sinistra, screenshot `agenda-wide` a destra, telefono in sovrapposizione. Sotto 961px torna centrata; sotto 640px restano solo H1, CTA primaria e telefono. La gallery a tab è stata rimossa: le schermate vivono solo nelle righe di `#moduli`, con immagine inline. La sezione demo usa lo stesso fondo scuro della hero, con card form bianca.

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

## Hero

- ≥961px: griglia a due colonne (copy ~55%, media ~45%), copy allineata a sinistra, H1 max 3 righe, screenshot intero sopra la piega a 1440×900.
- 641–960px: hero centrata, copy completa, screenshot a piena larghezza.
- ≤640px: solo `h1`, CTA primaria e `.hero-phone`; eyebrow, sub, micro-row, CTA secondaria e figcaption nascosti. Il telefono resta sopra la piega a 390×844, 375×667 e 320×568.
- Le immagini hanno `sizes` allineati al layout: desktop ~46vw, mobile ~92vw; telefono ~12vw desktop, ~54vw mobile.

## FAB

`#fab-right` è un `<a href="#demo">` fisso in basso a destra, visibile da 641px in su e nascosto su mobile. Un `IntersectionObserver` imposta `hidden` quando `#demo` è in vista. Il CSS ha `.fab-right[hidden] { display: none !important }` perché la regola del media query (`display: block`) vincerebbe l'attributo. Non esiste più la bottom bar mobile: niente `#mobile-cta`, niente padding-bottom sul body.

## Breakpoint

| Soglia | Cosa cambia |
|---|---|
| 1080 | gutter ridotto |
| 961 | hero passa a due colonne |
| 960 | griglie a due colonne → una; hero torna centrata a piena larghezza |
| 640 | header compatto, hero compatta (H1 + CTA + telefono), FAB nascosto, tutto a colonna singola |
| ≤640 e altezza ≤720 | hero più compatta: H1 36px, telefono 48% |
| ≤640 e altezza ≤600 | H1 32px, telefono 42% |
| `prefers-reduced-motion` | animazioni, reveal e count-up disattivati |

Sui fondi scuri il testo secondario non scende sotto `rgba(249, 249, 255, 0.6)`: a 0.45 le note da 11–12px non passano il contrasto AA.

## Regole di copy

Il lessico e i claim vietati stanno in `docs/positioning.md`: leggilo prima di riscrivere un titolo. In sintesi: dentisti, "sedute", "in poltrona", nessun trial, nessuna testimonianza.

## Segnaposto aperti

Numero WhatsApp, dati del titolare in `privacy.html`, dominio `studioms.it` in canonical/Open Graph/JSON-LD, demo navigabile citata ma non esistente. Elenco aggiornato in `landing/README.md`.
