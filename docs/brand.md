# Brand — token e regole tipografiche

Fonte di verità: `landing/css/styles.css` (`:root`) e i token inline in `index.html` del deck. Se i due divergono, vince la landing e il deck va allineato.

## Colori

| Ruolo | Landing | Deck | Valore |
|---|---|---|---|
| Carta / fondo | `--paper` | `--ground` | `#F9F9FF` |
| Superficie | `--card` | `--surface` | `#FFFFFF` |
| Testo | `--ink` | `--ink` | `#191C20` |
| Testo secondario | `--muted` | `--muted` | `#44474F` |
| Linea | `--line` | `--line` | `#C4C6D0` |
| Linea tenue | `--line-soft` | — | `rgba(196,198,208,.55)` |
| Brand | `--brand` | `--accent` | `#1B448A` |
| Brand hover | `--brand-hover` | — | `#163A78` |
| Brand tenue | `--brand-soft` | `--accent-soft` | `#D9E2FF` / `#DDE6FF` |
| Brand profondo | `--brand-deep` | — | `#001945` |
| Banda scura | `--band` | — | `#0A1730` |
| Errore | `--error` | — | `#BA1A1A` |

Nomi diversi, valori uguali: sono lo stesso brand. Non introdurre un terzo nome.

## Font

| Uso | Font | File |
|---|---|---|
| Testo | Inter variable (100–900) | `landing/assets/fonts/Inter-var-latin.woff2` |
| Etichette, eyebrow, bottoni | Public Sans 600 | `PublicSans-600.woff2` (una copia per landing e deck) |
| Codice / mono nel deck | JetBrains Mono | non incluso: fallback di sistema |

Nota: il deck non ha il file Inter, quindi in render usa il fallback (`Helvetica Neue`, Arial). Se il render deve essere identico alla landing, aggiungere `Inter-var-latin.woff2` in `assets/fonts/` e il relativo `@font-face`.

## Regole non negoziabili

1. **Il canvas del deck è 1536×864 e non si scala.** Nessun `transform: scale()` su un layer che contiene testo: il testo si rimpicciolisce con il layer e perde la metrica. Per far entrare più testo si riduce il corpo o si spezza la riga.
2. **La landing non riusa il canvas del deck.** Layout fluido, `--container: 1200px`, `--gutter: 24px` (20px sotto 640).
3. **Contrasto AA.** Il check del deck lo verifica (29/29 coppie a norma); per la landing non c'è automazione: se cambi un colore di testo, ricontrolla a mano su `--paper`, `--card` e `--band`.
4. **Nessun font di rete.** Solo `@font-face` locali; nessuna richiesta a Google Fonts, nessun CDN.
5. **Un solo raggio:** `--radius: 10px`. Schermate e card usano quello, il telefono nell'hero usa 30px per scelta esplicita.
6. **Mozione:** `--ease: cubic-bezier(.22, 1, .36, 1)`; tutto disattivato sotto `prefers-reduced-motion: reduce`.
