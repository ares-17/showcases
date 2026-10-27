# Migrazione — da progetto-repo a workspace-repo

Situazione: `osteopacity-deck/` è nato come repo git a sé, alla radice del workspace. Doveva essere un **progetto dentro un repo** che sta un livello sopra, così lo stesso repo ospita più prodotti.

```
ORA                                  DOPO
video-generation/  (no git)          video-generation/  (git)
└── osteopacity-deck/  (git)         ├── AGENTS.md
    ├── index.html                   ├── docs/
    ├── landing/                     └── projects/
    └── .git                             └── studioms/
                                             ├── index.html
                                             ├── landing/
                                             ├── docs/
                                             ├── tools/
                                             └── assets/
```

## Opzione C — quella eseguita (nessun tool esterno)

Il 2026-10-27 la migrazione è stata fatta così: repo spostato alla radice e progetto rinominato, con la storia intatta (git riconosce le rinomine nel commit di spostamento).

```bash
cd /home/aress/Documenti/progetti/video-generation
mkdir -p projects
mv osteopacity-deck projects/studioms
mv projects/studioms/.git .git
printf 'node_modules/\n.hyperframes/\n.thumbnails/\n.qa/\nrenders/\nout/\n.omo/\n*.mp4\n*.webm\n*.mov\n*.gif\n.DS_Store\n' > .gitignore
git add -A && git commit -m "Workspace: repo alla radice, StudioMS in projects/studioms"
```

Dopo lo spostamento è stato necessario correggere il percorso di Playwright in `projects/studioms/tools/qa/run.mjs` (da `../../` a `../../../osteopacity/...`), perché lo script risale dalla radice del progetto al workspace.

Costo: i commit precedenti hanno i path vecchi (`index.html` alla radice). `git log --follow` li attraversa grazie alla rilevazione delle rinomine; un `checkout` di un commit vecchio mostra il progetto alla vecchia posizione. Accettabile quando la storia è di pochi giorni.

## Opzione A — riscrive i path storici (alternativa)

Richiede `git-filter-repo` (assente sulla macchina: si installa con `pip install --user git-filter-repo`).

```bash
cd /home/aress/Documenti/progetti/video-generation

# 1. rinomina il progetto (il nome attuale è un refuso)
mkdir -p projects
git -C osteopacity-deck status --short          # deve essere pulito
mv osteopacity-deck projects/studioms

# 2. porta il repo alla radice
mv projects/studioms/.git .git

# 3. riscrivi i path storici dentro projects/studioms
git filter-repo --to-subdirectory-filter projects/studioms

# 4. verifica
git status          # nessuna cancellazione di massa
git log --oneline -5
```

## Opzione B — ripartenza pulita

La storia esistente è di un giorno (una decina di commit). Se non serve, è più semplice:

```bash
cd /home/aress/Documenti/progetti/video-generation
mkdir -p projects
mv osteopacity-deck projects/studioms
mv projects/studioms/.git projects/studioms/.git-archivio   # fuori dal controllo di git
printf 'node_modules/\nrenders/\n.qa/\n.thumbnails/\n.hyperframes/\nout/\n*.mp4\n*.webm\n*.mov\n*.gif\n.DS_Store\n' > .gitignore
git init -b main
git add -A
git commit -m "Workspace materiale di vendita: docs, StudioMS come primo progetto"
rm -rf projects/studioms/.git-archivio
```

## Cosa va aggiornato dopo lo spostamento

| Cosa | Nota |
|---|---|
| `projects/studioms/AGENTS.md` | i path al suo interno restano relativi al progetto: nessuna modifica |
| `projects/studioms/README` e doc | idem, finché sono relativi |
| `tools/qa/run.mjs` | risale a `../../osteopacity/frontend` per Playwright: **si rompe** se il progetto scende di un livello → correggere in `../../../osteopacity/frontend` |
| `.gitignore` del progetto | può restare; quello di radice copre i casi comuni, il progetto aggiunge i suoi |

## Checklist dopo la migrazione

```bash
cd projects/studioms
npm run assets      # deve uscire 0
npm run qa          # deve uscire 0 (controlla anche il path di Playwright)
npm run check       # 0 errori
cd ../..
git status          # pulito
```

## Perché questa forma

- Un repo, un `git log`: si vede cosa è cambiato in tutto il materiale, non in un progetto alla volta.
- I documenti di radice valgono per tutti; quelli di progetto solo per il loro.
- Un progetto nuovo è una cartella nuova, non un repo nuovo da ricordare.
