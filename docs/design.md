# Design — landing e materiali che non sembrano generati

Le skill di design (`design-taste-frontend`, `frontend-design`, `web-design-guidelines`, `image-to-code`) servono a **eseguire bene**, non a decidere il concetto. Su vendita B2B a freddo il concetto lo decide la prova: prodotto reale, numeri verificabili, attrito basso. Un sito "premiato" ma ambiguo vende meno di una pagina chiara.

## Da dove partono i token

Dall'**app viva**, non da una tavolozza scelta a occhio:

1. apri il prodotto, ispeziona i colori e i font reali;
2. estrai i token (3–6 colori, 1–2 famiglie di caratteri, 1 raggio);
3. scrivili in `docs/brand.md` del progetto, con il nome che usa il codice.

Se landing e video divergono, il colore del brand è uno solo: si mappa con due nomi, non si reinventa.

## Prima le schermate, poi il layout

- Le schermate dell'app si catturano **prima** di scrivere l'HTML: la griglia nasce da lì.
- Mai disegnare UI finta. Se un modulo non esiste, non ha una schermata.
- `image-to-code` ha senso quando c'è un riferimento visivo approvato; senza riferimento produce solo la versione "AI" della pagina.

## Tipografia

- Due famiglie al massimo: una per il testo, una per etichette/eyebrow.
- Scala ridotta: 4–5 taglie. Se ne servono otto, la gerarchia non è chiara.
- Il titolo deve stare in 2–3 righe a 1440 **e** leggersi a 320.
- Nel video il testo non si scala con il layer: si riduce il corpo (vedi `docs/lessons.md`).

## Colore

- Contrasto AA misurato, non stimato. Il check del video lo fa; per la landing si controlla a mano sulle tre superfici (carta, card, banda scura).
- Un solo accento. Il resto è neutro: se tutto è colorato, niente è importante.
- Il colore non è mai l'unico segnale di stato (errore, attivo): serve anche testo o forma.

## Mozione

- Una sola curva per tutto (`cubic-bezier(.22, 1, .36, 1)` funziona).
- `prefers-reduced-motion: reduce` disattiva reveal e transizioni, non solo le "decorazioni".
- Niente parallax su blocchi di testo, niente animazioni che ritardano la lettura del titolo.
- Il movimento deve spiegare (comparsa in sequenza = ordine di lettura), non intrattenere.

## Breakpoint

320 px è il test vero, non 390. Se a 320 c'è overflow orizzontale, il problema è quasi sempre: immagine con larghezza fissa, tabella, o `padding` + `width: 100%` senza `box-sizing`.

## Cosa fa e cosa non fa `design-taste-frontend`

| Fa | Non fa |
|---|---|
| Alza la qualità dell'esecuzione (spazi, scala, dettagli) | Decidere il posizionamento |
| Evita i cliché visivi (gradienti viola, card su card) | Sostituire la prova (schermate, numeri) |
| Dà un metodo di revisione a screenshot | Garantire conversioni |

Il suo rischio: trasformare una pagina commerciale in un portfolio. Su B2B vince la chiarezza: un titolo, una promessa, una prova, un CTA.

## Errori che si vedono subito

- Card dentro card dentro card.
- Hero che non sta in 800 px di altezza (sopra la piega non si capisce cosa si vende).
- Testo sopra un'immagine senza velo o senza spazio negativo.
- Icone di stock con sei stili diversi.
- Un carosello come prova principale: nessuno lo guarda.
- Form a 8 campi perché "servono i dati".
