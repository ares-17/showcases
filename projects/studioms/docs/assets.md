# Asset — master, derivate, consumatori

Ogni schermata esiste in **tre forme**, e la stessa immagine è usata da **due consumatori** che non si parlano:

```
landing/assets/screens/<nome>.png        master, 1 per schermata (fonte)
        │
        ├── tools/assets.mjs build ──► landing/assets/screens/webp/<nome>-720.webp   (q80)
        │                              landing/assets/screens/webp/<nome>-1440.webp  (q82)
        │
        └── ritaglio manuale ────────► assets/screens/<nome>--hero|--pane|--band.png  (deck)
```

`assets/screens/` (radice) è il **deck**; `landing/assets/screens/` è la **landing**. Sono due alberi separati, e questa è la causa del bug già successo: ripulire un lato non tocca l'altro.

## Manifest

`assets/manifest.json` è l'unico registro. Per ogni schermata dichiara:

- `landing.master` — il PNG in `landing/assets/screens/`
- `landing.widths` — quali WebP vanno generate (`[]` = solo deck)
- `deck.crops` — i ritagli usati dal deck

**Aggiungere una schermata significa prima registrarla qui**, poi usarla. Il check legge il manifest *e* l'HTML: se una WebP esiste ma nessuno la cita, è un errore.

## Comandi

```bash
npm run assets          # check: riferimento rotto, derivata morta, dichiarazione senza file
npm run assets:build    # rigenera tutte le WebP dal master (ImageMagick, `magick`)
npm run assets:build dashboard   # solo una schermata
```

Errori (esce 1): file citato e assente, WebP orfana, master o WebP dichiarati nel manifest ma assenti.
Warning (esce 0): asset del deck presente ma non usato né dichiarato master.

## Warning noti e accettati

Cinque file in `assets/screens/` sono varianti di ritaglio scartate durante il montaggio del deck (`agenda--pane`, `agenda-giorno`, `agenda-giorno--pane`, `agenda-wide--pane`, `cartella--session`). Restano perché possono servire a rimontare una scena; il check li segnala a ogni giro. Se il rumore dà fastidio, si cancellano e il warning sparisce.

## Schermate attuali

| Schermata | WebP landing | Ritagli deck |
|---|---|---|
| dashboard | — | `--hero`, `--pane` |
| agenda | 720, 1440 | `--band` |
| agenda-wide | 720, 1440 | — |
| cartella-clinica | — | `--band` |
| fatturazione | — | `--pane` |
| sistema-ts | 720, 1440 | `--pane` |
| whatsapp | 720, 1440 | `--pane` |
| scheda-paziente | 720, 1440 | — |
| nuova-fattura | 720, 1440 | — |
| mobile-agenda | 720, 1440 | intero file |
| pazienti | — (solo deck) | `--pane` |

## Regola che ha già pagato

Quando cambi il contenuto di una schermata (per esempio un nome proprio nel dataset demo), tocca **entrambi** gli alberi e **tutti** i ritagli, poi:

```bash
npm run assets && npm run qa   # landing: riferimenti e pixel
npm run check                  # deck: lint
npx hyperframes snapshot --at 3   # deck: guarda il frame che contiene la schermata
```

Se salti il lato deck, il video esce sbagliato e lo scopri solo dopo un render da cinque minuti.
