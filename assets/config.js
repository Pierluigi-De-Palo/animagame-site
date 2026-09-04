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

  // ── LA STANZA «GUARDA FUORI» (nome di lavoro, ECHO/PAROLE-AURA-2077.md §g) ─
  // Il giocatore guarda il cielo un minuto e lo confronta con AURA. Diversa
  // dalla stanza delle verifiche: qui il giocatore si riconosce con un TOKEN
  // (header Authorization: Bearer <token>), non con un cookie — lo gestisce
  // assets/sessione.js. Il token nasce da una rotta del Worker del gioco che
  // esiste già:
  //   POST {BACKEND_URL}/sessione   corpo { carta, codice } → { token, scade }
  //
  // Le rotte di AURA (contratto del Worker, già scritto e provato — non si
  // cambia da qui):
  //   POST {BACKEND_URL}/aura/osservazione
  //        corpo  { localita, lat, lon, cielo, vento, testo }
  //        esito  201 { punti_assegnati, perche: [...],
  //                      modello_che_ci_ha_preso: {modello,giuste,totali} | null }
  //        errori 401 sessione_assente · 409 gia_guardato_oggi ·
  //               400 testo_non_ammesso | osservazione_incompleta | luogo_mancante
  //   GET  {BACKEND_URL}/aura/osservazioni/mie   le occhiate di chi ha la carta
  //   GET  {BACKEND_URL}/aura/previsione         la previsione che il modello impara
  //
  // ⚠️ LOCALITA non è nel contratto originale del Worker: è una rotta di
  // comodo per suggerire il posto mentre si scrive (`?q=`). Dichiarata qui
  // per lo stesso motivo delle altre — se non risponde, la stanza usa quattro
  // località di casa come ripiego (assets/guarda-fuori.js), niente si rompe.
  AURA: {
    ACCESE: false,           // true solo quando le rotte sopra rispondono
    ROTTE: {
      OSSERVAZIONE: '/aura/osservazione',
      MIE: '/aura/osservazioni/mie',
      PREVISIONE: '/aura/previsione',
      LOCALITA: '/aura/localita',
    },
  },
};
