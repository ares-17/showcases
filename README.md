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
| `docs/openscreen.md` | Video demo registrati dall'app: installazione, MCP, flusso, problemi noti |

## Skill, per cosa

| Lavoro | Skill |
|---|---|
| Video, animazioni, captions | `/hyperframes`, `/hyperframes-cli`, `/hyperframes-registry` |
| Audio, immagini, voiceover, colori | `/media-use` |
| Demo registrate dell'app, video per PR o X | `openscreen-demo` (skill del progetto) |
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

## Video demo registrati (OpenScreen)

Per registrare **l'app vera** — demo da 20–60 s, un video da attaccare a una PR, un clip per X — OpenScreen è installato e collegato all'agente: RPM `openscreen-2.1.2`, eseguibile `/usr/bin/openscreen`, skill `openscreen-demo` in `.agents/skills/` (registrata in `skills-lock.json`).

Si registra **dall'app**, con il suo pulsante: è l'unico modo affidabile su Linux Wayland, perché la sorgente la sceglie il selettore del desktop e da un processo senza finestra il dialogo può non comparire. Poi le modifiche le faccio io via MCP e tu le ritrovi nell'editor, annullabili con `Ctrl+Z`.

```bash
sudo dnf install ./Openscreen-Linux-*.rpm                     # RPM da getopenscreen.com/download
npx skills add getopenscreen/openscreen --skill openscreen-demo -y
openscreen help                                               # deve elencare "openscreen mcp"
```

Collegamento all'agente: in OpenScreen *AI settings* → *MCP server* si accende il server, si sceglie la porta (qui **47821**) e si copia il token. Il token sta in un file, mai nel repo:

```bash
printf '%s' '<token>' > ~/.config/openscreen/mcp-token && chmod 600 ~/.config/openscreen/mcp-token
```

In `~/.config/opencode/opencode.json`, poi riavviare la sessione:

```json
{
  "mcp": {
    "openscreen": {
      "type": "remote",
      "url": "http://127.0.0.1:47821/mcp",
      "enabled": true,
      "headers": { "Authorization": "Bearer {file:/home/aress/.config/openscreen/mcp-token}" }
    }
  }
}
```

`type: "remote"` perché è un URL; `{file:…}` legge il token dal file (`{env:VAR}` funziona solo se opencode eredita la shell). Il server `openscreen mcp` su stdio resta come fallback ad app chiusa, disabilitato: mai attivo insieme a questo, o ogni strumento compare due volte.

Registrazione su Wayland, zoom sui click (regola udev), CLI, verifica dell'handshake e problemi noti: `docs/openscreen.md`.

## Regola generale

Un progetto nuovo si apre leggendo i fatti del prodotto (repo, presentazione, design system), non inventandoli. Se un fatto non è verificabile, non entra nel materiale: entra nei segnaposto, con il nome di chi lo deve fornire.
