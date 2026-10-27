# Deck — contratto e comandi

Composizione unica, 15 scene, 182 secondi. `index.html` è sia struttura sia motore: nessuna sottocomposizione.

## Contratto da non rompere

| Elemento | Valore | Note |
|---|---|---|
| `data-composition-id` radice | `root` | una sola radice |
| `data-duration` radice | `182` | la somma delle scene non deve superarlo |
| Scene | `s01`…`s15` | ogni `<section>` è `class="clip"` + `data-composition-id` |
| Dissolvenze di scena | `data-duration` 12 o 14 | brevi, servono al taglio |
| Timeline | una sola, `paused: true`, registrata su `window.__timelines["root"]` | le timeline figlie **non** vanno messe in pausa |
| `data-no-timeline` | vietato | il deck è temporizzato: serve la timeline registrata |
| Canvas | 1536×864 | non si scala, vedi `docs/brand.md` |
| CLI | `hyperframes@0.8.186` pinnata in `package.json` | non aggiornare senza rifare il render |

## Comandi

```bash
npm run dev        # preview interattiva (blocca la shell: non usarla in background)
npm run check      # lint + runtime + layout + motion + contrast: sempre dopo una modifica
npx --yes hyperframes@0.8.186 snapshot --at 3    # guarda il frame al secondo 3
npm run render -- -o renders/studioms-deck.mp4   # render completo, ~5 minuti
```

**Il render va lanciato in modo sincrono** (timeout ampio). In background con `nohup … &` muore con `render_cancelled_parent_exited`: il processo figlio resta orfano e il lavoro si perde.

## Warning accettati

| Warning | Perché resta |
|---|---|
| `duplicate_media_discovery_risk` | il logo compare due volte con stesse tempistiche: è voluto (apertura e chiusura) |
| `composition_file_too_large` (1039 righe) | il deck è tarato a mano: spezzarlo costerebbe più di quanto rende |
| `film_silent` | nessuna colonna sonora, il filmato è muto per scelta |

`sub_timeline_readiness_timeout` (45 s in attesa di `s01`…`s15`) compare anche su render riusciti: le scene sono guidate da CSS/rAF e registrano la timeline a valle. Non è un errore.

## Dove sta il contenuto

- Copy, tempi e coreografia: `index.html` (cerca l'id della scena, `s01`…`s15`).
- Schermate: `assets/screens/*--hero|--pane|--band.png` — mappa in `docs/assets.md`.
- Logo: `assets/brand/logo.webp`.
- Font: `assets/fonts/PublicSans-600.woff2` (Inter non è inclusa: fallback di sistema).

## Output

`renders/studioms-deck.mp4` — 182 s, 1080p30, ~31 MB, ignorato da git. Il vecchio `renders/` può contenere render obsoleti: fidati solo della data del file e del contenuto dei frame, non del nome.

## Verifica minima dopo una modifica

```bash
npm run check
npx --yes hyperframes@0.8.186 snapshot --at <secondo-modificato>
# poi guarda il PNG: il check non mostra come viene
```
