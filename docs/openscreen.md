# OpenScreen — video demo registrati dall'app

Due modi per fare un video qui, e non sono alternativi:

| Serve mostrare | Strumento | Perché |
|---|---|---|
| Un'idea, un meccanismo, una schermata ricostruita | HyperFrames (`/hyperframes`) | Canvas fisso 1536×864, controllo totale su tipografia e motion |
| **L'app vera che funziona**, in un video breve da mandare a un cliente o su X | **OpenScreen** | Registra la finestra, ripulisce i tempi, zooma sui click, aggiunge callout, esporta MP4 |

OpenScreen non sostituisce il deck: lo completa. Una demo registrata dice "funziona davvero", un deck dice "ecco cosa cambia".

## Stato su questa macchina

Verificato il 28 ottobre 2026 su Fedora (x86_64, Wayland).

| Cosa | Valore |
|---|---|
| Pacchetto | `openscreen-2.1.2-1.x86_64` (RPM) |
| Eseguibile | `/usr/bin/openscreen` → `/opt/Openscreen/openscreen` |
| CLI | `openscreen help` elenca `record`, `sources`, `export`, `captions`, `info`, `pack`, `mcp` |
| Skill | `.agents/skills/openscreen-demo/SKILL.md`, registrata in `skills-lock.json` |
| Registrazioni | `~/.config/openscreen/recordings/` |
| Dati app | `~/.config/openscreen/` |
| Scorciatoia globale | `Ctrl+Shift+O` |
| Server MCP (app) | `http://127.0.0.1:47821/mcp`, bearer token in `~/.config/openscreen/mcp-token` (0600) — 55 strumenti, provato il 28/10/2026 |
| Server MCP (stdio) | `openscreen mcp`, registrato in `~/.config/opencode/opencode.json` come `openscreen-cli`, **disabilitato** |

Due server MCP, un solo nome attivo. Quello **dentro l'app** (`127.0.0.1:47821`) è la scelta normale: registra, monta ed esporta passando dall'app, quindi le modifiche compaiono nell'editor e si annullano con `Ctrl+Z`. Quello **stdio** (`openscreen mcp`) fa lo stesso lavoro ma sui file, senza app aperta: è il fallback, e resta spento per non avere 110 strumenti doppi.

## Installazione (già fatta; serve su una macchina nuova)

```bash
# 1. scaricare il pacchetto per la propria distribuzione
#    https://getopenscreen.com/download/  → su Fedora il file .rpm

# 2. installarlo (nella cartella del download)
sudo dnf install ./Openscreen-Linux-*.rpm

# 3. installare la skill nel progetto (crea .agents/ e skills-lock.json)
npx skills add getopenscreen/openscreen --skill openscreen-demo -y
```

Verifica, e va fatta prima di dire che è installato:

```bash
rpm -q openscreen          # openscreen-2.1.2-1.x86_64
openscreen help            # deve contenere la riga "openscreen mcp"
```

Se `help` non elenca `mcp`, la versione è troppo vecchia: la funzione MCP non c'è e l'agente non può pilotare l'app.

## Collegare l'agente (MCP)

L'agente non usa la GUI: parla con OpenScreen via MCP. Servono quattro strumenti — `startRecording`, `stopRecording`, `exportVideo`, `getFrames` — e li espongono entrambi i server.

**Prima scelta: il server dentro l'app.** In OpenScreen, *AI settings* → *MCP server*: si accende, si sceglie la porta (qui **47821**) e si copia il token. Ascolta solo su `127.0.0.1`, quindi non esce dalla macchina.

Il token non entra né nel repo né in `opencode.json`: sta in un file con permessi ristretti, e la configurazione lo legge da lì.

```bash
printf '%s' '<token>' > ~/.config/openscreen/mcp-token && chmod 600 ~/.config/openscreen/mcp-token
```

**OpenCode** — già configurato il 28 ottobre 2026 in `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "openscreen": {
      "type": "remote",
      "url": "http://127.0.0.1:47821/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {file:/home/aress/.config/openscreen/mcp-token}"
      }
    },
    "openscreen-cli": {
      "type": "local",
      "command": ["openscreen", "mcp"],
      "enabled": false
    }
  }
}
```

`type: "remote"` perché è un URL, non un processo figlio; `{file:…}` legge il token dal file (esiste anche `{env:VAR}`, ma il file funziona anche quando opencode parte da un lanciatore grafico che non eredita la shell). `headers` è un oggetto: lo schema `Bearer <token>` va scritto per intero.

**Codex** e **Claude Code** — stessi dati, token in una variabile d'ambiente:

```bash
export OPENSCREEN_MCP_TOKEN="$(cat ~/.config/openscreen/mcp-token)"

codex mcp add openscreen --url http://127.0.0.1:47821/mcp --bearer-token-env-var OPENSCREEN_MCP_TOKEN
claude mcp add --transport http openscreen http://127.0.0.1:47821/mcp \
  --header "Authorization: Bearer $OPENSCREEN_MCP_TOKEN"
```

**Il fallback senza app.** `openscreen mcp` è lo stesso server su stdio: funziona anche ad app chiusa, ma legge e scrive i file di progetto senza passare dall'editor — niente modifiche live, niente `Ctrl+Z`. Resta in configurazione come `openscreen-cli` con `enabled: false`: si accende solo se l'app non parte, e **mai insieme** al server remoto, altrimenti ogni strumento compare due volte.

Gli strumenti compaiono solo alla sessione successiva: aggiunto o cambiato il server, si riavvia opencode. Nella sessione in cui lo si aggiunge l'agente non li vede.

**Verifica dal terminale, senza aspettare una sessione:**

```bash
curl -s --max-time 15 -X POST http://127.0.0.1:47821/mcp \
  -H "Authorization: Bearer $(cat ~/.config/openscreen/mcp-token)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' | head -c 300
```

Risposta attesa (28/10/2026): `{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":…,"resources":…},"serverInfo":{"name":"openscreen","version":"2.1.2"},…`. Un `406` su `GET` senza `Accept: text/event-stream` è normale, non è un guasto.

I 55 strumenti si dividono così: sessione e file (`listProjects`, `createProject`, `importMedia`, `removeMedia`), registrazione (`listSources`, `startRecording`, `stopRecording`, `setPointerTrack`), montaggio (`addTrim`, `addTrims`, `addSpeed`, `addZoom`, `addAutoZooms`, `addAnnotation`, `setAspectRatio`, `addEffect`, `addAudio`, `restoreCheckpoint`), sottotitoli (`transcribe`, `setCaptionSettings`, `getCaptions`, `setVocabulary`) e uscita (`exportVideo`, `getFrames`). Se `tools/list` non contiene `startRecording`, `stopRecording`, `exportVideo` e `getFrames`, il server è la versione sbagliata o è un altro binario.

**Permessi.** Se un'operazione viene rifiutata con un messaggio che nomina *MCP edits*, va acceso *MCP edits* in *AI settings* → *MCP server*. Se il token è stato incollato in una chat o in un file condiviso, va rigenerato dall'app e riscritto in `~/.config/openscreen/mcp-token`: è l'unica cosa che protegge la porta.

## Registrare su Linux (Wayland)

Due cose non funzionano come su macOS, e vanno sapute prima di premere record.

**Il selettore decide, i flag no.** La CLI lo dice: `Recording source: chosen in the system picker (--display and --window do not apply)`. Su Linux `--display` e `--window` sono ignorati: la sorgente la scegli nel dialogo del desktop (`Condividi schermo con Openscreen`, gestito da `xdg-desktop-portal-kde`). Per questo `listSources` restituisce display vuoti e una finestra senza nome: non è rotta, è il portale che non espone i titoli finché non apri una sessione.

**Chi apre la richiesta cambia l'affidabilità.** Registrare **dall'app**, con il suo pulsante, è il modo stabile: il dialogo compare e la finestra la scegli tu. Da un processo senza finestra (CLI, `startRecording` via MCP) il dialogo può non comparire affatto: la CLI resta appesa all'infinito e `startRecording` molla dopo **30 secondi** con `Recording did not start within 30s`. Se succede, `systemctl --user restart xdg-desktop-portal-kde xdg-desktop-portal` e si riprova.

**I click: senza accesso a `/dev/input` non ci sono zoom automatici.** Il messaggio è `click-capture-unavailable: no readable /dev/input pointer device … cursor samples will otherwise all be moves`. Su Fedora `70-uaccess.rules` concede `uaccess` solo a joystick e mouse 3D, non a mouse e touchpad, quindi il problema è sistematico. Qui i device sono `event5` (`ID_INPUT_MOUSE=1`) e `event6` (`ID_INPUT_TOUCHPAD=1`), touchpad ELAN.

La regola che serve — mirata sui soli dispositivi di puntamento, la tastiera resta chiusa (il gruppo `input` invece darebbe lettura di tutto):

```bash
printf 'SUBSYSTEM=="input", KERNEL=="event*", ENV{ID_INPUT_MOUSE}=="1", TAG+="uaccess"\nSUBSYSTEM=="input", KERNEL=="event*", ENV{ID_INPUT_TOUCHPAD}=="1", TAG+="uaccess"\n' \
  | sudo tee /etc/udev/rules.d/71-openscreen-pointer.rules
sudo udevadm control --reload-rules && sudo udevadm trigger --subsystem-match=input
```

La sintassi si controlla prima, senza root: `udevadm verify /etc/udev/rules.d/71-openscreen-pointer.rules` (28/10/2026: `Success: 1, Fail: 0`).

Verifica: `getfacl -p /dev/input/event6` deve mostrare una riga `user:aress:rw-`. Oggi mostra solo `user::rw-`, cioè il proprietario `root`: è esattamente il motivo per cui la telemetria manca. Se l'ACL non compare, riavvia la sessione grafica (si applica al login).

Senza quella regola si può comunque lavorare: si registra, e gli **zoom si mettono a mano** con `addZooms` guardando i frame — più lento, ma il risultato è identico. La telemetria serve solo a farli proporre in automatico.

## L'AI dentro l'app (OpenRouter e altri)

L'app ha un suo provider LLM, e non passa da opencode: in *AI settings* si sceglie il provider, si incolla la chiave, e la chat dell'editor monta il progetto da lì (la stessa chat ha il collegamento diretto alle impostazioni del provider).

| Provider | Chiave d'ambiente | Modello di default |
|---|---|---|
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_LLM_API_KEY` | `anthropic/claude-3.5-sonnet` |
| Claude API | `ANTHROPIC_API_KEY` | `claude-haiku-4-5` |
| OpenAI API | `OPENAI_API_KEY` | `gpt-4o` |
| Gemini API | `GEMINI_API_KEY` | `gemini-3-flash-preview` |
| Mistral API | `MISTRAL_API_KEY` | `mistral-large-latest` |
| OpenAI Compatible | `OPENAI_COMPATIBLE_API_KEY` | base URL obbligatorio (Ollama, vLLM, LM Studio) |

Con OpenRouter la base URL è `https://openrouter.ai/api/v1`: qualsiasi modello del catalogo, una chiave sola. La chiave incollata finisce in `llm-config.json` nella cartella dati, cifrata con la keyring di sistema (`safeStorage`): su questa macchina `org.freedesktop.secrets` risponde su KWallet (`ksecretd` + `kwalletd6`), quindi non resta in chiaro. In alternativa, nessuna chiave nel file: si esporta la variabile d'ambiente prima di lanciare l'app.

**Sono due credenziali diverse, e non si sostituiscono.**

| Cosa | Credenziale | A cosa serve |
|---|---|---|
| Chat dentro l'app | chiave OpenRouter (o altro provider) | monti il video parlando con l'editor; nessun agente esterno |
| MCP `127.0.0.1:47821` | bearer token in `~/.config/openscreen/mcp-token` | io (opencode, Codex, Claude Code) monto il progetto |

Con la sola chiave OpenRouter si lavora interamente in GUI. Con il solo MCP si lavora dall'agente. Averle entrambe è comodo: la chat dell'app per le rifiniture al volo, l'agente per i passaggi in blocco (tagli dai sottotitoli, zoom su tutti i click, export). La chiave OpenRouter è denaro vero speso a token sul proprio account: non va nel repo, e va rigenerata se passa in una chat.

## Flusso di una demo di marketing

Regola sopra tutte: **un messaggio solo**. Cosa deve restare in testa dopo 3 secondi? Il primo beat mostra il risultato, non la schermata di setup.

1. **Storyboard, prima di registrare.** 3–6 beat, 20–60 secondi, una callout di massimo 6 parole per beat. X riproduce muto: il testo sullo schermo porta la storia, non la voce. Si mostra all'utente in poche righe e si procede.
2. **Preparare la scena.** App avviata sullo stato iniziale, una finestra pulita ~1600×1000. Per una web app senza chrome del browser: `chrome --app=http://localhost:3000 --window-size=1600,1000 --user-data-dir=/tmp/demo`. Niente toolbar, barra indirizzi, notifiche, percorsi di file locali.
3. **`listSources`**, poi `startRecording` con `window` (la parte unica del titolo). `microphone: true` solo se qualcuno parla; `camera` solo se la persona deve comparire.
4. **Recitare lo storyboard** con pause di circa un secondo dopo ogni risultato, poi `stopRecording` con un `title`. Conservare `projectId`, `checkpointId`, `videoPath`.
5. **`getFrames`** su ~6 frame: è la finestra giusta? c'è roba privata? tutti i beat sono successi? Se no, si registra di nuovo — costa meno che sistemare in montaggio.
6. **Montare** sempre in secondi del righello, con il `projectId`: `setAspectRatio 16:9` per X, poi tagli (`addTrims`), velocizzazioni (`addSpeed`), zoom sui click (`addZooms`, `setZoom`), callout (`addAnnotation`) e blur su email/token/nomi (`addAnnotation` con `type: "blur"`). Un `restoreCheckpoint` riporta al take grezzo.
7. **Esportare** con un percorso assoluto (`exportVideo`), poi rileggere i frame dei beat sul progetto esportato. Callout leggibili, zoom sulla cosa che cambia, nessun frame nero o testo tagliato.
8. **Il video non si committa.** Va nella PR, nella landing o nel post, non nel repo (`*.mp4` è già in `.gitignore`).

## CLI, quando l'agente non serve

```bash
openscreen sources --json                      # display, finestre, microfoni, camere
openscreen record --window "Titolo" \
  --duration 30 --project demo.openscreen      # registra e scrive un progetto pronto
openscreen export demo.openscreen -o demo.mp4 --quality medium
openscreen captions demo.openscreen            # Whisper on-device + sottotitoli
openscreen info demo.openscreen --json         # ispeziona un progetto
openscreen pack demo.openscreen --out demo/    # progetto + media in una cartella portabile
```

`record` è sincrono: si ferma con `--duration`, con `SIGINT`/`SIGTERM` o scrivendo `stop` su stdin. Come per `npm run render`, non va messo in background con `nohup … &`. Su Linux `--window` e `--display` **non hanno effetto**: la sorgente la scegli nel selettore (vedi *Registrare su Linux (Wayland)*).

## Regole di progetto

- **Dati credibili, non reali.** L'app va riempita con contenuti plausibili; nessun dato di cliente vero, nessun token, nessuna notifica personale in scena. Se qualcosa di privato finisce nel frame, si copre con un blur e si ricontrolla con `getFrames`.
- **I claim restano quelli verificabili.** OpenScreen riprende ciò che l'app fa davvero: è il posto giusto per mostrare una funzione, non per suggerirne una che non esiste (vedi `docs/copy.md`).
- **Un video per messaggio.** Due funzioni in un clip da 30 secondi si annullano.
- **Il video finito si guarda.** `getFrames` sui beat è il minimo; per il resto vale la stessa regola del deck: uno screenshot non è una prova che sia bello.
- **Niente rete nei materiali.** Il video esportato è un file, ma la scena registrata non deve mostrare CDN, analytics o prompt di traduzione.

## Problemi noti

| Sintomo | Causa e rimedio |
|---|---|
| `Recording did not start within 30s` | Il dialogo del portale non è comparso o nessuno ha scelto in tempo: registra dall'app, non da CLI/MCP. Poi `systemctl --user restart xdg-desktop-portal-kde xdg-desktop-portal` |
| La CLI resta appesa senza dialogo | Il dialogo è già stato aperto e chiuso, o il portale è impallato: `pkill -f "openscreen record"`, riavvia il portale, riprova |
| `click-capture-unavailable` | Manca l'accesso a `/dev/input`: regola udev in *Registrare su Linux (Wayland)* |
| Nessun cursore nel video | L'app è stata guidata da uno script (Playwright/CDP): il puntatore non si muove. Registrare il log delle azioni e passarlo a `setPointerTrack` |
| Nessuno zoom sul primo click | I primi 2,5 s restano larghi di proposito: iniziare la prima azione dopo |
| `transcribe` risponde `no-audio` | Il take non ha microfono né audio di sistema: registrare di nuovo con uno dei due |
| Modifica rifiutata, nomina *MCP edits* | Accendere *MCP edits* in *AI settings* → *MCP server* |
| `unknown flag: --attach` | `gh` più vecchio di 2.99.0, serve per allegare il video a una PR |
| `openscreen sources` senza display | Su Wayland di questa macchina (`2026-10-28`) l'elenco display è vuoto e resta una finestra senza nome: la finestra va scelta dal selettore del desktop, non facendo match sul titolo |
| `406` sull'endpoint MCP | `GET` senza `Accept: text/event-stream`: normale. Si usa `POST` con `Content-Type: application/json` |
