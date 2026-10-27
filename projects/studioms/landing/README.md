# StudioMS — landing statica

Pagina di acquisizione a freddo. HTML, CSS e JavaScript puri: nessun build step, nessuna dipendenza, nessuna richiesta di rete verso terzi.

## Aprire

Doppio clic su `index.html`, oppure servila in locale:

```sh
python3 -m http.server 8000
```

## Numero WhatsApp

Il numero di destinazione sta in un punto solo: `index.html`, tag `<body data-wa-number="">`.
Formato internazionale, solo cifre, senza `+` (esempio: `393331234567`).
Se resta vuoto, il link apre WhatsApp e il visitatore sceglie il contatto: il messaggio è già scritto.

## Cosa è ancora un segnaposto

- Numero WhatsApp (sopra) e link `wa.me` di contatto diretto.
- `privacy.html`: bozza da completare con ragione sociale, P.IVA e indirizzo.
- `https://studioms.it/` in canonical, Open Graph e JSON-LD.
- La demo navigabile citata nella sezione prodotto non esiste ancora: il testo lo dice.
