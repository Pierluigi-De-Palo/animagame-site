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
};
