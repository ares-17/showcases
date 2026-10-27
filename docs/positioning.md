# Posizionamento — istanza StudioMS

> **Istanza, non verità assoluta.** Questo file descrive *un* pubblico. Se la repo
> diventa un toolkit per più progetti, ogni progetto porta il proprio
> `positioning.md` con questo stesso schema. Il campo `audience.status` dice se
> il target è deciso o provvisorio: leggilo prima di riscrivere i claim.

```yaml
project: StudioMS
audience:
  primary: studi dentistici
  secondary: igienisti dentali (utenti, non acquirenti)
  status: primo caso — non ancora validato su altri verticali
channel: vendita a freddo (demo prenotata, nessun self-service)
```

## Dolore che vendiamo

Lo studio gestisce agenda, cartella, fatture e promemoria su strumenti separati (Excel, carta, WhatsApp). Il costo non è il software mancante: è il tempo perso a ricomporre le informazioni e i promemoria dimenticati.

## Prova ammessa

- **Solo schermate reali dell'app**, con dati demo dentali. Nessun mockup disegnato.
- Numeri concreti sull'app (quanti moduli, cosa fa ogni modulo), non numeri di mercato.
- Il fatto che sia italiano e che i dati restino sul server dello studio.

## Claim vietati (non scriverli, non suggerirli)

| Vietato | Perché |
|---|---|
| Prova gratuita, self-service, "registrati e prova" | non esiste: la vendita è a freddo con demo |
| Testimonianze, loghi di clienti, "500 studi" | non ci sono clienti citabili |
| Invio automatico al Sistema Tessera Sanitaria | non è quello che fa l'app: la landing dice "fatturazione e TS", non "invio SDI" |
| Integrazione con gestionali esistenti o migrazione automatica dei dati | non implementata: la note del form dicono "vogliamo trasferire i pazienti", è una richiesta, non una promessa |
| Qualunque cosa con "AI" | non c'è AI nel prodotto |
| Prezzi "a partire da" senza il listino vero | il listino è nella sezione `#prezzi` |

## Lessico

| Usa | Non usare |
|---|---|
| studio dentistico / studi dentistici | studio medico, studio osteopatico, "clinica" |
| sedute | sessioni, trattamenti prenotati |
| in poltrona | in trattamento, durante la seduta |
| professionista | operatore, dottore (come sostantivo generico) |
| paziente | cliente, utente |

## Il pubblico vive anche nelle immagini

Il dataset demo dell'app si chiamava "Studio Osteopatico Marchetti": il nome era **dentro i pixel** di sette schermate. Prima di pubblicare qualsiasi materiale:

```bash
# testo
grep -rniE "osteopat|sessioni|trattament" landing/ index.html | grep -v node_modules

# pixel: OCR su tutte le schermate
for f in assets/screens/*.png landing/assets/screens/*.png; do
  magick "$f" -resize 200% -colorspace Gray /tmp/ocr.png
  tesseract /tmp/ocr.png stdout 2>/dev/null | grep -iE "osteopat|session" && echo "^^ $f"
done
```

Tesseract qui ha solo la lingua `eng`: sufficiente per i nomi propri e per le parole italiane in uso, non per una revisione linguistica.

## Stato dei materiali

- **Landing**: allineata ai dentisti (testo, JSON-LD, alt, schermate).
- **Deck**: allineato (eyebrow, footer, due schermate).
- **Placeholder ancora aperti**: numero WhatsApp, dati del titolare in `privacy.html`, dominio `studioms.it`, demo navigabile citata ma inesistente. Vedi `landing/README.md`.
