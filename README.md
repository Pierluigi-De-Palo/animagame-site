# ANIMA GAME — animagame.io

Il sito del gioco del SYSTEMA 77. **Un gioco a invito, non un social.**

- `index.html` — la home: il gioco, le stanze, i dieci posti, il punteggio.
- `strumenti.html` — le stanze del gioco: le verifiche, il meteo, la radio, il falò.
  Ogni strumento è una stanza, non un link esterno.
- `verifiche.html` — **la prima stanza vera**: una porta sola, il banco, il referto,
  lo scaffale. Il banco è chiuso in fase DEV e lo dice; la bozza resta sul
  dispositivo del giocatore. Logica in `assets/verifiche.js`, rotte dichiarate
  (e spente) in `assets/config.js`.
- `scheda.html` — la scheda giocatore: ogni campo ha l'interruttore
  «visibile agli altri sì/no» — **il nome compreso** (spento, per gli altri
  sei il tuo numero). L'unica cosa sempre in vista è il punteggio.
  In fase DEV (backend spento) i dati restano sul dispositivo del giocatore.
- `assets/config.js` — l'unico punto da toccare quando il backend si accende.
  Contiene anche il contratto delle quattro rotte delle verifiche, dichiarate
  e spente: l'impianto è di SQUELCH.
- `assets/solco.js` — il solco: la firma vivente, **accesa il 30/08** in home fra
  la prima schermata e «la carta». Un canvas, zero dipendenze, un colore per casa.
- `CNAME` — `animagame.io` (GitHub Pages dalla radice, come le case sorelle).

## Regole del repo

1. **Nessun dato personale, mai.** Questo repo è pubblico due volte:
   dal sito e da `raw.githubusercontent.com`. I dati veri dei giocatori
   vivono nel backend di SQUELCH, non qui. Il giocatore 0 appare come
   «GIOCATORE 0» finché il Direttore non sceglie il suo nome pubblico.
2. **Lessico:** si dice *giocatori, schede, cerchi*. Le parole del mondo
   social sono vietate dal Direttore.
3. **Estetica (direzione JUDY):** il gioco è **VERDE `#38E08A` su nero** —
   il verde è accento (punteggi, stati, azioni, il cursore), mai fondale.
   Mono = macchina, serif = umano. Mai il cyan di SYSTEMA 77 (privato),
   mai il giallo dell'agenzia, mai l'ambra del mito.
4. La porta (`playanima.io`) è un redirect a questo dominio; si attiva
   a settembre coi tarocchi.
5. **Le sorgenti dei dati.** `cyberboomer.io` è il banco privato del Direttore:
   **non è una sorgente del gioco** e da lì non si legge niente, mai. Se una
   pagina ha bisogno di un dato, si dichiara la rotta in `assets/config.js`
   e ci si ferma lì — l'impianto lo fa SQUELCH.
6. **Il tetto della luce.** Nessuna animazione accende più del **10%** della sua
   banda. Non è un'opinione: si misura prima di accendere (vedi `solco.js`).

## Il nome della stanza delle verifiche — SOTTO REVISIONE

I due nomi usati finora vengono da un videogioco altrui e il Direttore teme un
rischio di marchio. Restano nomi **interni**: in pagina non compaiono più.
Al loro posto c'è un segnaposto neutro — «la stanza delle verifiche» — che
descrive la funzione e non impegna nessuno.

**Il nome definitivo lo sceglie il Direttore.** Quando arriva, si cambia in
questi punti e basta — sono tutti marcati, `grep -rn NOME-DEFINITIVO` li trova:

| dove | cosa |
|---|---|
| `verifiche.html` | il `<title>` e l'`<h1>` |
| `strumenti.html` | l'`<h2>` della stanza |
| `index.html` | l'`<h3>` della card |
| `assets/scheda.js` | il segnaposto del campo «Stanza preferita» |
| `assets/config.js` | solo il commento: la chiave resta `VERIFICHE`, funzionale apposta |

Il nome NON sta nei nomi dei file, negli `id` o nelle chiavi di configurazione:
sono funzionali di proposito, così cambiare nome non rompe nessun indirizzo.

Progetto: `ROOT_CLODE/JUDY/PROGETTO-COSTELLAZIONE-2026-08-01.md` (privato).

— creato da ECHO, 2026-08-01 · il solco acceso e la prima stanza, JUDY 2026-08-30
