# OpenScreen — stato della sessione

Fotografia al **28 ottobre 2026, 17:30** (Fedora 42, KDE Plasma 6, Wayland). Questo file **invecchia**: registra cosa è verificato oggi e cosa manca per fare il primo video vero. Regole stabili, installazione e problemi noti stanno in `docs/openscreen.md`.

## Cosa è verificato adesso

| Cosa | Stato | Prova |
|---|---|---|
| Server MCP dell'app | attivo, `http://127.0.0.1:47821/mcp`, solo loopback | `tools/list` → **55 strumenti**; ci sono `startRecording`, `stopRecording`, `exportVideo`, `getFrames` |
| Token | in `~/.config/openscreen/mcp-token`, `0600`, 43 byte senza newline | letto dal file, non dalla config |
| Config agente | `openscreen` = `type: "remote"` con `Bearer {file:…}`; `openscreen-cli` (stdio) **disabilitato** | `~/.config/opencode/opencode.json` |
| Permesso di scrittura MCP | **acceso** (`MCP edits` già attivo) | `createCheckpoint` → `cp_77519a64-a074-407c-b9e0-3a4d986f2812` |
| Progetti | 1, aperto nell'editor: `Recording 28/10/2026, 16:59:45` | `listProjects` |

## Il progetto aperto non è una demo

| Campo | Valore | Cosa significa |
|---|---|---|
| Durata | 17,8 s | troppo corto e senza struttura |
| Risoluzione | 1920×1200 (8:5) | il formato del take, non quello del target |
| Clip | 1, intera, nessun taglio | nessun montaggio fatto |
| Audio | **nessuno** (`transcriptionFailure: no-audio`) | niente transcript, niente sottotitoli, niente taglio per parole |
| Cursore | `hasCursorTelemetry: false` (controllato, non "da verificare") | nessuno zoom automatico sui click |
| Zoom, trim, callout | nessuno | progetto grezzo |

È il take di prova del portale: non mostra StudioMS che lavora, non ha voce, non ha cursore. Va registrato di nuovo.

## Cosa dice la documentazione ufficiale

Fonte: `https://getopenscreen.com/docs/ai-editing/`, aggiornata il **24 ottobre 2026**.

- Il server **dell'app** registra come il pulsante Record: si chiude l'editor, la barra fa il conto alla rovescia, il take si apre come progetto nuovo.
- Le modifiche al progetto aperto si annullano con `Ctrl+Z`. Su un altro progetto l'unico undo è il checkpoint preso prima della prima modifica.
- I checkpoint vivono in memoria: **muoiono alla chiusura dell'app, al cambio di porta e alla rigenerazione del token**. Se ne tengono 20.
- **Cancellare un progetto non è uno strumento**: resta un'operazione da fare nell'app.
- La traduzione dei sottotitoli la fa il client col proprio modello: **non serve una chiave OpenRouter in OpenScreen**.
- Il server **stdio** (`openscreen mcp`) non richiede il permesso `MCP edits` e funziona ad app chiusa: è il fallback, non il modo normale.

## Cosa manca, in ordine

1. **Un take vero**: 20–30 s di StudioMS con il mouse che si muove e 2–3 azioni riconoscibili (aprire un paziente, un appuntamento, una vista). Il take attuale non ha né voce né cursore.
2. **Decidere l'audio.** Microfono acceso mentre si registra → ho il transcript, quindi taglio le pause, metto i sottotitoli e tolgo i filler con `removeWords`. Registrazione muta → solo callout di testo, nessun sottotitolo: per un demo a freddo è molto più debole.
3. **Regola udev** (facoltativa): senza, niente zoom automatico sui click; gli zoom si mettono a mano guardando i frame. Stesso risultato, più tempo. Comando e verifica in `docs/openscreen.md`, sezione *Registrare su Linux (Wayland)*.
4. **Target**: 16:9 per X/YouTube, padding e sfondo coerenti col brand — questi li decido io, non serve una tua scelta.

## Due modi per il take

| Modo | Come | Rischio |
|---|---|---|
| **A — lo lancio io** (`startRecording`) | l'app chiude l'editor, apre la barra, tu scegli `Studio Osteopatico Marchetti` nel selettore entro 30 s | su Wayland il selettore è la parte fragile: un `startRecording` è già scaduto a 30 s |
| **B — premi Record tu** nell'app, poi mi dici "fatto" | il selettore lo apri tu, senza scadenze | nessuno, ma serve la tua mano |

Primo giro: **B**. Quando il flusso è rodato si passa ad A.

## Ciclo di lavoro concordato

1. `createCheckpoint` prima di ogni serie di modifiche.
2. `getFrames` sul take grezzo: cosa si vede davvero, dove sono le azioni.
3. Taglio dei tempi morti con `addTrims` (o `removeWords` se c'è transcript).
4. Zoom: `addAutoZooms` se c'è telemetria, altrimenti `addZooms` a mano.
5. Callout con `addAnnotation`; `setAspectRatio` per il formato.
6. `exportVideo` in `/tmp`, poi `getFrames` **sull'export** per verificare che niente sia tagliato o nero.
7. Il video finito non entra nel repo (`*.mp4` è in `.gitignore`): va nella PR, nella landing o nel post.

## Verifiche rapide

```bash
# il server risponde e ha i quattro strumenti che servono
curl -s --max-time 20 -X POST http://127.0.0.1:47821/mcp \
  -H "Authorization: Bearer $(cat ~/.config/openscreen/mcp-token)" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 200

# la regola udev è valida (senza root)
udevadm verify /etc/udev/rules.d/71-openscreen-pointer.rules

# l'utente può leggere il mouse/touchpad
getfacl -p /dev/input/event6    # deve comparire user:aress:rw-
```

## Decisioni aperte

- [ ] Chi preme Record: **A** (io) o **B** (tu). Proposta: B.
- [ ] Audio: si parla durante la registrazione? Sì → sottotitoli e taglio per parole; no → solo callout.
- [ ] Regola udev: si installa ora o si va di zoom manuali?
- [ ] Cosa deve restare in testa dopo 3 secondi: la funzione da mostrare (una sola, vedi `docs/copy.md`).
- [ ] Dove finisce il video: PR, landing o post.
