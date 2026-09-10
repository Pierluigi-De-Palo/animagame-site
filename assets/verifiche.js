/* ANIMA GAME — il banco della stanza delle verifiche.
 *
 * ⬜ NOME-DEFINITIVO: la stanza si chiama, in pagina, «la stanza delle
 *    verifiche» — segnaposto neutro. Il nome vero lo sceglie il Direttore.
 *
 * Cosa fa oggi: NIENTE DI FINTO. Le rotte non esistono (l'impianto è di
 * SQUELCH), quindi il banco non spedisce e non finge di aver spedito.
 * Dice che è chiuso, dice quale rotta gli manca, e tiene la bozza sul
 * dispositivo del giocatore — come la scheda in fase DEV. Quando SQUELCH
 * accende le rotte si tocca solo `assets/config.js`: qui non si riscrive niente.
 *
 * Cosa NON fa, e non farà: leggere da cyberboomer.io. Quello è il banco
 * privato del Direttore, non una sorgente del gioco.
 *
 * — creato da JUDY, 2026-08-30
 *
 * Impianto di JUDY e SQUELCH NON toccato: nessun `id`, nessuna classe,
 * nessuna logica, nessuna condizione. Qui è cambiato SOLO il testo che
 * legge il giocatore — le due frasi del banco (chiuso, e acceso).
 * — testo di ECHO, 2026-09-10 · su impianto JUDY
 */
(function () {
  'use strict';

  var CHIAVE = 'anima.verifiche.bozza';

  var form  = document.getElementById('banco');
  var cosa  = document.getElementById('cosa');
  var dove  = document.getElementById('dove');
  var esito = document.getElementById('esito');
  if (!form || !cosa || !dove || !esito) return;

  var CFG = (window.AnimaConfig || {});
  var V = CFG.VERIFICHE || {};
  // Il banco è acceso solo se ESISTE una radice del backend E le rotte delle
  // verifiche sono state dichiarate accese. Due condizioni, non una: il Worker
  // dei punti può essere in piedi mentre `/verifiche` non c'è ancora.
  var ACCESO = !!(CFG.BACKEND_URL && V.ACCESE);

  /* ── la bozza resta sul dispositivo ───────────────────────────── */

  function leggiBozza() {
    try { return JSON.parse(localStorage.getItem(CHIAVE)) || null; }
    catch (e) { return null; }
  }

  function scriviBozza() {
    var b = { cosa: cosa.value, dove: dove.value, quando: new Date().toISOString() };
    try {
      if (!b.cosa && !b.dove) localStorage.removeItem(CHIAVE);
      else localStorage.setItem(CHIAVE, JSON.stringify(b));
    } catch (e) { /* magazzino pieno o negato: la bozza si perde, la pagina no */ }
  }

  var b = leggiBozza();
  if (b) {
    cosa.value = b.cosa || '';
    dove.value = b.dove || '';
  }

  var rinvio;
  function segna() { clearTimeout(rinvio); rinvio = setTimeout(scriviBozza, 400); }
  cosa.addEventListener('input', segna);
  dove.addEventListener('input', segna);

  /* ── il banco ─────────────────────────────────────────────────── */

  function dillo(html) {
    esito.innerHTML = html;
    esito.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    scriviBozza();

    if (!cosa.value.trim()) {
      dillo('<strong>Il banco è vuoto.</strong> Scrivi la cosa che gira: una frase, ' +
            'un prodotto, il nome di chi promette. Anche solo com&rsquo;è arrivata a te.');
      cosa.focus();
      return;
    }

    if (!ACCESO) {
      dillo('<strong>Il banco non è ancora acceso, e la tua richiesta non è partita.</strong> ' +
            'Non è andata persa e non è andata da nessuna parte: quello che hai scritto ' +
            'resta <strong>sul tuo dispositivo</strong>, e lo ritrovi qui quando torni. ' +
            'Dietro il banco non c&rsquo;è ancora nessuno che possa prenderla in mano — ' +
            'e finché è così, questo bottone non finge di spedire.' +
            '<span class="rotta">quando il banco apre, quello che hai scritto è ancora qui</span>');
      return;
    }

    // Col banco acceso: POST {BACKEND_URL}/verifiche, poi si segue {id}.
    // In DEV non si passa mai di qui — e finché non ci si passa, non si
    // scrive una riga che finge di averlo fatto.
    //
    // ✍ Le parole di questo momento sono scritte ADESSO, spente, perché il
    //   giorno dell'accensione nessuno le improvvisi. Non promettono un tempo:
    //   a «quando» non si risponde con un numero che non possiamo mantenere.
    //   Il numero della richiesta lo conosce solo la risposta del banco: quando
    //   SQUELCH aggancia la rotta, si infila qui e la frase regge lo stesso.
    dillo('<strong>La tua richiesta è al banco.</strong> Ha un numero suo, e da adesso ' +
          'è quello a seguirla: la <strong>carta</strong> dice che è tua, il tuo nome ' +
          'non parte con lei. Il referto <strong>torna qui</strong>, in questa stanza — ' +
          'non altrove, e non per posta. Quanto ci mette dipende da cosa hai portato: ' +
          'le richieste che si chiudono con quello che è già in chiaro escono presto, ' +
          'le altre passano dal tavolo lungo.');
  });
})();
