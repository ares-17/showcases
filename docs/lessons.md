# Lezioni — trappole già pagate

Ognuna è costata tempo reale in un progetto vero. Non sono consigli: sono cose che sono andate storte.

## 1. Le immagini vivono in due alberi, e nessuno lo dice

La landing usa `landing/assets/screens/` (PNG master + WebP). Il video usa `assets/screens/` (ritagli `--hero`, `--pane`, `--band`), che sono **copie separate** degli stessi screenshot.

Ho corretto un nome proprio nelle schermate della landing, ho cancellato quelle che sembravano inutili… e il video renderizzato mostrava ancora il nome vecchio. Costo: un render da 5 minuti buttato e un file sbagliato in mano.

**Difesa:** un manifest dichiara master → derivate → consumatori; un check elenca gli orfani da entrambi i lati (vedi `docs/playbook.md`, fase 2).

## 2. Il render in background muore

`nohup npm run render &` esce con `render_cancelled_parent_exited`: il figlio resta orfano e il lavoro si perde. Il render va lanciato **in primo piano**, con timeout ampio (3 minuti di video ≈ 5 minuti di render).

## 3. `sub_timeline_readiness_timeout` non è un errore

Il render stampa "Sub-composition timelines did not become ready within 45000ms (still unregistered: s01…s15)" anche quando **riesce**: le scene sono guidate da CSS/rAF e registrano la timeline a valle. Non aggiungere `data-no-timeline` per far sparire il messaggio: rompe il deck.

## 4. `position` e `display` non si duplicano tra contenitore e componente

Il FAB aveva `.fab-right { position: fixed; display: none }`, ma `.fab-btn { position: relative; display: flex }`: la seconda regola vinceva e il FAB finiva in fondo al documento, visibile anche su mobile. Il `[hidden]` da solo non basta se una regola successiva impone `display`. Difesa: una sola regola per `position`/`display` per lo stesso elemento e verifica con `getComputedStyle` + `getBoundingClientRect`, non solo con l'attributo.

## 5. `scroll-behavior: smooth` falsa i test a tempo

Uno script che misura "il FAB è nascosto dentro `#demo`" dopo uno `scrollIntoView` può misurare **durante** lo scroll animato e riportare il contrario. Nei test: disattivare lo smooth (`html { scroll-behavior: auto !important }`) e attendere `scrollY === 0`.

## 6. I nomi propri stanno nei pixel

Il dataset demo dell'app conteneva il nome del vecchio pubblico. Nel testo non c'era più, ma era dentro sette PNG. `grep` non lo vede: serve OCR.

```bash
for f in assets/screens/*.png landing/assets/screens/*.png; do
  magick "$f" -resize 200% -colorspace Gray /tmp/ocr.png
  tesseract /tmp/ocr.png stdout 2>/dev/null | grep -i "<parola-vietata>" && echo "^^ $f"
done
```

## 7. `check` verde non significa "si vede bene"

Il controllo del video verifica contratto, layout, movimento, contrasto. Non dice se il fotogramma è leggibile o se l'immagine è quella giusta. Dopo ogni modifica: `snapshot --at <secondo>` e **guarda**.

## 8. Le derivate morte si accumulano

Ogni generazione di WebP lascia dietro file che nessuno cita più (larghezze abbandonate, schermate rimosse dal layout). Non rompono niente, quindi restano per mesi. Un check che esce 1 sulle WebP orfane le tiene a zero.

## 9. Playwright spesso non è in questo repo

Gli script QA finiscono per cercare il browser in `node_modules` che non esiste. Cercarlo in ordine — repo, variabile d'ambiente, installazione nota sulla macchina — evita di reinstallarlo ogni volta.

## 10. La documentazione che mente è peggio di nessuna

Un documento con prezzi, moduli o numeri di telefono invecchia in una settimana. **Regola:** nei markdown solo invarianti e ricette; i fatti che cambiano stanno in un manifest o in un config, e i documenti ci puntano.

## 11. Il `CLAUDE.md` duplicato dell'`AGENTS.md`

Due file con lo stesso contenuto divergono in pochi giorni. Uno è la fonte, l'altro è un puntatore di tre righe.

## 12. Il segnaposto silenzioso

Numero WhatsApp vuoto, dominio inventato nel canonical, "demo navigabile" citata nel copy ma inesistente, informativa privacy con `[RAGIONE SOCIALE]`. Nessuno di questi rompe un test. Vanno elencati **tutti** in un punto solo, con il nome di chi li deve fornire, altrimenti arrivano in produzione.
