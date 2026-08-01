/* ANIMA GAME — configurazione unica del sito.
   Un solo punto da toccare quando il backend si accende o gli strumenti migrano.
   — creato da ECHO, 2026-08-01 */

window.AnimaConfig = {
  // Worker di SQUELCH. null = spento (fase DEV): la scheda vive sul dispositivo.
  // Contratto API proposto: ROOT_CLODE/ECHO/DA-ECHO-a-SQUELCH-topologia-e-api-gioco.md
  BACKEND_URL: null,

  // Fase del gioco, mostrata in pagina.
  FASE: 'DEV',

  // Posti totali della fase DEV.
  POSTI: 10,
};
