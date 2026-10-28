# video-generation — materiale di vendita per più prodotti

Questa cartella non è un progetto: è il posto dove si costruisce il **materiale che vende** un prodotto. Per ogni prodotto: un video di presentazione (HyperFrames), una landing statica, e quando serve un one-pager o un documento commerciale.

Il prodotto vive altrove. Qui vive il racconto.

## Struttura prevista

```
video-generation/
├── AGENTS.md                 regole per gli agenti che lavorano qui
├── docs/                     conoscenza riusabile (playbook, copy, design, lezioni)
└── projects/
    └── <slug>/               un prodotto
        ├── index.html        composizione HyperFrames (video)
        ├── assets/           schermate, logo, font del video
        ├── landing/          HTML/CSS/JS puri
        ├── docs/             contesto di QUEL prodotto
        └── tools/            check asset e QA del progetto
```

Stato attuale: un solo progetto, `projects/studioms/` (primo caso: gestionale per studi dentistici). Il repo git sta alla radice. Il file `meta.json` del progetto conserva l'id storico `osteopacity-deck`: è una chiave di HyperFrames, non un nome da mostrare, e cambiarla invaliderebbe la cronologia del progetto.

## Cosa c'è in docs/

| File | Contenuto |
|---|---|
| `docs/playbook.md` | Il percorso completo: fatti → posizionamento → video → landing → verifica, con i cancelli |
| `docs/copy.md` | Regole di copy per vendita a freddo: promessa, prova, form, prezzi, claim vietati |
| `docs/design.md` | Come usare le skill di design/frontend senza scivolare nell'estetica generica |
| `docs/lessons.md` | Le trappole che sono già costate tempo, con il costo misurato |
| `docs/migration.md` | Come spostare un progetto nato nella cartella sbagliata |

## Skill, per cosa

| Lavoro | Skill |
|---|---|
| Video, animazioni, captions | `/hyperframes`, `/hyperframes-cli`, `/hyperframes-registry` |
| Audio, immagini, voiceover, colori | `/media-use` |
| Landing, one-pager, UI | `design-taste-frontend`, `frontend-design`, `web-design-guidelines` |
| Da immagine a codice | `image-to-code`, `imagegen-frontend-web` |
| Controllo visivo finale | `visual-qa` |
| Prima di dichiarare finito | `verification-before-completion` |
| Prima di costruire qualcosa di grosso | `brainstorming`, `writing-plans` |

## Comandi tipici (dentro un progetto)

```bash
npm run assets        # coerenza immagini
npm run qa            # landing nei 4 viewport, hero/FAB, form
npm run check         # lint/runtime/layout/motion/contrast del video
npm run render -- -o renders/<slug>-deck.mp4
```

## Regola generale

Un progetto nuovo si apre leggendo i fatti del prodotto (repo, presentazione, design system), non inventandoli. Se un fatto non è verificabile, non entra nel materiale: entra nei segnaposto, con il nome di chi lo deve fornire.
