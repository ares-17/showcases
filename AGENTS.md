# video-generation — istruzioni per agenti

Qui si producono video di presentazione, landing e materiale commerciale per **uno o più prodotti**. Ogni prodotto sta in `projects/<slug>/` con il proprio `AGENTS.md`, che ha la precedenza su questo file quando lavori dentro quella cartella.

## Dove guardare

| Ti serve | Leggi |
|---|---|
| Il percorso completo, con i cancelli tra le fasi | `docs/playbook.md` |
| Scrivere testi che vendono a freddo | `docs/copy.md` |
| Landing/UI senza estetica generica | `docs/design.md` |
| Trappole già pagate (asset, render, test) | `docs/lessons.md` |
| Il prodotto specifico | `projects/<slug>/AGENTS.md` e `projects/<slug>/docs/` |

## Regole non negoziabili

1. **I fatti del prodotto si leggono, non si inventano.** Repo del prodotto, presentazione, design system: se un dato non è verificabile, va nei segnaposto, non nel copy.
2. **Il video e la landing sono due artefatti, non uno.** Il video ha canvas fisso 1536×864 e non si scala; la landing è fluida e non riusa quel canvas. Condividono solo i token di brand.
3. **Le immagini si controllano anche nei pixel.** Nomi propri e claim vietati finiscono dentro gli screenshot: dopo ogni cambio, OCR oltre al grep.
4. **Il render del video è sincrono.** In background con `nohup … &` muore con `render_cancelled_parent_exited`. E `check` non mostra come viene: guarda sempre lo `snapshot`.
5. **Un segnaposto dichiarato è meglio di un placeholder silenzioso.** Numero di telefono, dati legali, dominio, demo: elencati in un punto solo, con il nome di chi li deve fornire.
6. **Nessuna richiesta di rete nei materiali.** Font locali, niente CDN, niente analytics.

## Verifiche prima di dire "fatto"

```bash
npm run assets   # immagini coerenti (esce 1 se no)
npm run qa       # landing: viewport, form, CTA
npm run check    # video: lint + runtime + layout + motion + contrast
```

Un controllo che passa non è una prova che sia bello: apri gli screenshot in `.qa/` e i frame dello `snapshot`.

## Cosa non fare

- Non copiare i token di brand di un prodotto nel progetto di un altro: ogni progetto ha i suoi.
- Non creare un secondo file con lo stesso contenuto di `AGENTS.md` (un `CLAUDE.md` duplicato diverge in due giorni): semmai un puntatore.
- Non mettere nei documenti i fatti che cambiano (prezzi, moduli, numeri): quelli stanno in un manifest o in un config, o invecchiano male.
