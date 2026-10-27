# Playbook — dal prodotto al materiale

Sei fasi, con un cancello tra una e l'altra. Il cancello esiste perché ogni fase produce qualcosa che la successiva dà per vero: saltarne una significa rifare il lavoro due volte.

## Fase 0 — Fatti (mezza giornata, non si salta)

Leggi, non chiedere e non inventare:

- la presentazione del prodotto (il documento che il fondatore usa già per vendere);
- il repo del prodotto: cosa fa davvero, quali moduli esistono, cosa non esiste;
- il design system / i token dell'app viva: i colori del materiale vengono da lì, non da un moodboard.

**Cancello:** un elenco di fatti verificabili e un elenco separato di **segnaposto** (prezzo, telefono, dati legali, dominio, demo). I segnaposto si dichiarano subito, in un punto solo, e non si colmano con ipotesi.

## Fase 1 — Posizionamento (un'ora, su un file)

Scrivi `docs/positioning.md` di quel progetto con: pubblico primario e secondario, stato del target (deciso o provvisorio), dolore, prova ammessa, **claim vietati**, lessico.

Il file va scritto come *istanza*: `audience.status: primo caso — non validato` se il pubblico può cambiare. Un posizionamento assunto come eterno invecchia peggio di un prezzo.

**Cancello:** per ogni frase che vuoi usare sai dire da quale fatto viene. Se non lo sai, non è copy: è un'ipotesi.

## Fase 2 — Inventario schermate

Servono schermate **reali** dell'app, con dati demo plausibili per quel pubblico. Per ognuna: un master PNG, le derivate WebP, e i ritagli che il video userà.

Un manifest (`assets/manifest.json`) dichiara master, larghezze, ritagli e consumatori. Un controllo automatico verifica che nulla sia orfano o rotto.

**Cancello:** `npm run assets` esce 0. E l'OCR sulle schermate non trova nomi o claim vietati — i nomi propri vivono nei pixel, non solo nell'HTML.

## Fase 3 — Video (HyperFrames)

- 12–15 scene, 2–3 minuti. Oltre, nessuno arriva in fondo.
- Una scena = un'idea: problema, prodotto, un modulo per scena, prova, chiusura.
- Canvas fisso, testo non scalato, una sola timeline registrata.
- Audio: o c'è una colonna sonora vera, o il film è dichiaratamente muto (`film_silent` è un warning onesto, non un errore da nascondere).
- Il render è sincrono e lento (minuti): si fa alla fine, non a ogni modifica. Nel frattempo si guardano gli `snapshot`.

**Cancello:** `npm run check` senza errori + frame guardati ai secondi modificati.

## Fase 4 — Landing

Struttura che ha funzionato su vendita a freddo (B2B, nessun self-service):

`hero` → problema → come funziona (3 passi) → moduli → prova/seconda banda → prodotto → prezzi → dati/sicurezza → domande → form → footer legale.

Regole: nessun backend, un solo canale di contatto (WhatsApp o email, deciso una volta), numero in un punto solo, form corto, nessuna richiesta di rete a terzi. Dettagli in `docs/copy.md` e `docs/design.md`.

**Cancello:** `npm run qa` esce 0 su 1440/390/320, form vuoto e form valido.

## Fase 5 — Verifica e consegna

| Cosa | Comando | Tempo reale |
|---|---|---|
| Immagini coerenti | `npm run assets` | 1 s |
| Landing nei 3 viewport + form + CTA | `npm run qa` | 20–40 s |
| Video: lint/runtime/layout/motion/contrast | `npm run check` | 30–60 s |
| Frame del video | `snapshot --at N` | 5 s per frame |
| Render completo | `render -- -o …` | 5 min (3 min di video) |
| OCR su tutte le schermate | loop `magick` + `tesseract` | 1 s per immagine |

Poi guarda le immagini. Un controllo verde dice che non è rotto, non che è buono.

## Cosa si può fare in parallelo

Landing e video condividono solo i token di brand: si possono costruire insieme, ma **non** nello stesso momento in cui si cambiano le schermate. Prima si congela l'inventario immagini (fase 2), poi si scrive.

## L'errore di sequenza più costoso

Cambiare una schermata dopo aver reso il video: il render va rifatto da capo. Le immagini si chiudono prima di premere render.
