/* ANIMA GAME — la porta.
 *
 * Legge il codice stampato dietro la tessera e lo manda a chi lo sa
 * verificare. Oggi non lo manda a nessuno, perche' la rotta non esiste:
 * l'impianto e' di SQUELCH e il contratto sta in `assets/config.js`.
 *
 * DUE REGOLE, e non sono negoziabili.
 *
 * 1. IL CONTROLLO NON VIVE QUI, E NON CI VIVRA' MAI.
 *    Nessun elenco di codici, nessuna impronta, nessun confronto scritto in
 *    questo file: qualunque controllo dentro una pagina statica e' un
 *    controllo che chiunque apre il sorgente supera. Se un giorno serve una
 *    porta che dice davvero di no, la dice il backend — non il browser.
 *
 * 2. IL CODICE NON SI SCRIVE SUL DISPOSITIVO.
 *    Il resto del gioco tiene le bozze in `localStorage` (la scheda, il banco
 *    delle verifiche) perche' sono roba del giocatore. Il codice della carta
 *    no: e' il segreto che apre, non una preferenza. Si digita, si spedisce,
 *    si dimentica. Qui infatti non c'e' nessuna riga che lo salvi.
 *
 * — creato da JUDY, 2026-09-04
 */
(function () {
  'use strict';

  var form = document.getElementById('porta');
  var codice = document.getElementById('codice');
  var risposta = document.getElementById('risposta');
  if (!form || !codice || !risposta) return;

  var CFG = window.AnimaConfig || {};
  var P = CFG.PORTA || {};
  // Due condizioni, non una: il Worker puo' essere in piedi mentre /porta
  // non c'e' ancora.
  var APERTA = !!(CFG.BACKEND_URL && P.ACCESA);

  function dillo(html) {
    risposta.innerHTML = html;
    risposta.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!codice.value.trim()) {
      dillo('<strong>Manca il codice.</strong> Sta dietro la tessera, stampato.');
      codice.focus();
      return;
    }

    if (!APERTA) {
      dillo('<strong>La porta non risponde ancora.</strong> ' +
            'Il banco che legge i codici si accende quando lo accende SQUELCH: ' +
            'non &egrave; una cosa che pu&ograve; fare questa pagina, ed &egrave; giusto cos&igrave;. ' +
            '<br><br>Se hai una carta, <span class="verde">tienila</span>: ' +
            'il tuo posto non va da nessuna parte, e non c&rsquo;&egrave; una fila in cui perderlo.');
      return;
    }

    // Con la porta accesa: POST {BACKEND_URL}/porta con { codice }, e il
    // gettone che torna tiene aperta la sessione. In DEV non si passa mai
    // di qui — e finche' non ci si passa, non si scrive una riga che finga
    // di averlo fatto.
    dillo('<strong>Un momento.</strong> Sto bussando.');
  });
})();
