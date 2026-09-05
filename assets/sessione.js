/* ANIMA GAME — la sessione del giocatore, per le stanze che la richiedono.
 *
 * Il Worker di AURA (contratto già scritto, non si tocca da qui) NON legge
 * un cookie: legge un header `Authorization: Bearer <token>`. Il token
 * nasce con
 *   POST {BACKEND_URL}/sessione   corpo { carta, codice } → { token, scade }
 * e da quel momento vive SOLO sul dispositivo del giocatore (localStorage):
 * nessun altro dato passa da qui dentro.
 *
 * Quattro funzioni, come nel contratto:
 *   Sessione.token()            → il token salvato, o null
 *   Sessione.entra(carta, cod)  → Promise: chiede il token, lo salva
 *   Sessione.esci()             → dimentica il token su questo dispositivo
 *   Sessione.fetch(url, opz)    → fetch che aggiunge l'header, se c'è un token
 *
 * Gli errori del Worker arrivano già in italiano: `{errore, messaggio}`.
 * Qui si mostra `messaggio` (o, se manca, una frase onesta sul non essere
 * riusciti a raggiungere il systema) — mai un testo inventato al posto suo.
 *
 * — creato da JUDY, 2026-09-04
 */
(function (global) {
  'use strict';

  var CHIAVE = 'anima.sessione';

  function radice() {
    var u = (global.AnimaConfig || {}).BACKEND_URL;
    if (typeof u !== 'string' || !u.trim()) return null;
    return u.trim().replace(/\/+$/, '');
  }

  function leggi() {
    try { return JSON.parse(localStorage.getItem(CHIAVE)); }
    catch (e) { return null; }
  }

  function scrivi(s) {
    try { localStorage.setItem(CHIAVE, JSON.stringify(s)); }
    catch (e) { /* magazzino pieno o negato: la sessione non resta, si rientrerà di nuovo */ }
  }

  function token() {
    var s = leggi();
    return (s && typeof s.token === 'string' && s.token) ? s.token : null;
  }

  function esci() {
    try { localStorage.removeItem(CHIAVE); } catch (e) { /* già non c'è */ }
  }

  function entra(carta, codice) {
    var base = radice();
    if (!base) return Promise.reject(new Error('Il systema non è ancora acceso qui.'));

    return fetch(base + '/sessione', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carta: carta, codice: codice })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (corpo) {
        if (!r.ok) {
          throw new Error((corpo && corpo.messaggio) || ('Il systema ha risposto ' + r.status + '.'));
        }
        if (!corpo || typeof corpo.token !== 'string' || !corpo.token) {
          throw new Error('Il systema ha risposto qualcosa che non so leggere.');
        }
        scrivi({ token: corpo.token, scade: corpo.scade || null });
        return corpo;
      });
    }, function () {
      throw new Error('Non riesco a raggiungere il systema.');
    });
  }

  /* Aggiunge SOLO l'header di riconoscimento: il resto (metodo, corpo,
     content-type) lo decide chi chiama, come farebbe con `fetch` normale. */
  function chiamaConToken(url, opzioni) {
    opzioni = opzioni || {};
    var t = token();
    var intestazioni = {};
    var k;
    for (k in (opzioni.headers || {})) intestazioni[k] = opzioni.headers[k];
    if (t) intestazioni.Authorization = 'Bearer ' + t;
    var finale = {};
    for (k in opzioni) finale[k] = opzioni[k];
    finale.headers = intestazioni;
    return fetch(url, finale);
  }

  global.Sessione = {
    token: token,
    entra: entra,
    esci: esci,
    fetch: chiamaConToken
  };
})(window);
