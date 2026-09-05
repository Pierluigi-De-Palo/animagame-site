/* ANIMA GAME — configurazione unica del sito.
   Un solo punto da toccare quando il backend si accende o gli strumenti migrano.
   — creato da ECHO, 2026-08-01 */

window.AnimaConfig = {
  // Worker di SQUELCH. null = spento (fase DEV): la scheda vive sul dispositivo.
  // Contratto API: ROOT_CLODE/SQUELCH/CONTRATTO-PUNTI-v1.html — scritto il 09/08.
  // (Il percorso citato qui dall'01/08 rimandava a un file che non e' mai esistito:
  //  per otto giorni chi apriva questa riga ha creduto che la specifica ci fosse.)
  BACKEND_URL: null,

  // Fase del gioco, mostrata in pagina.
  FASE: 'DEV',

  // Posti totali della fase DEV.
  POSTI: 10,

  // ── LA STANZA DELLE VERIFICHE ────────────────────────────────────────
  // ⬜ NOME-DEFINITIVO: in pagina la stanza porta un segnaposto neutro.
  //    Il nome vero lo sceglie il Direttore; qui la chiave resta funzionale
  //    (VERIFICHE) apposta, così il nome può cambiare senza toccare il codice.
  //
  // Le rotte NON esistono ancora: l'impianto e' di SQUELCH. Sono dichiarate
  // qui, e qui si accendono — la pagina non va toccata.
  //
  //   POST {BACKEND_URL}/verifiche              deposita una richiesta al banco
  //        corpo  { cosa: string, dove: string|null }
  //        esito  { id: string }                 il numero della richiesta
  //   GET  {BACKEND_URL}/verifiche/{id}         stato della richiesta, o il referto
  //        esito  { id, stato: 'al-banco'|'in-lavorazione'|'chiuso', referto? }
  //   GET  {BACKEND_URL}/verifiche              i referti messi nel cerchio (lo scaffale)
  //        esito  { referti: [ { id, cosa, verdetto, punteggio, fonti[], data, carta } ] }
  //   POST {BACKEND_URL}/verifiche/{id}/cerchio mette il referto nel cerchio
  //        → e' il punto in cui si aggancia il CONTRATTO-PUNTI-v1 (+10, x2, +1)
  //
  // Nessun dato di questa stanza viene da cyberboomer.io: quello e' il banco
  // privato del Direttore, non una sorgente del gioco.
  VERIFICHE: {
    ACCESE: false,          // true solo quando le quattro rotte rispondono
  },

  // ── LA PORTA ─────────────────────────────────────────────────────────
  // Dal 04/09 animagame.io e' una SOGLIA: la home mostra pochissimo e il
  // gioco (gioco.html, le stanze, la scheda) sta dietro. Ordine del
  // Direttore: «se hai una carta hai le info; se no, solo qualcosa per
  // incuriosire — non puoi giocare, e' a invito».
  //
  // Il codice stampato dietro la tessera si legge QUI e si verifica LA'.
  // Nessuna validazione vive in questa pagina, e non ci vivra' mai: un
  // controllo scritto nel sito e' un controllo che chiunque legge nel
  // sorgente e supera. Serve una rotta:
  //
  //   POST {BACKEND_URL}/porta                   apre con il codice della carta
  //        corpo  { codice: string }
  //        esito  200 { slot: number, gettone: string }   la carta e' valida
  //               401 { }                                 non lo e'
  //        → il gettone e' quello che tiene aperta la sessione del giocatore
  //
  // ⛔ Il codice NON si scrive mai su questo dispositivo: e' il segreto
  //    della carta, non una preferenza. Si digita, si spedisce, si dimentica.
  PORTA: {
    ACCESA: false,          // true solo quando POST /porta risponde
  },
};
