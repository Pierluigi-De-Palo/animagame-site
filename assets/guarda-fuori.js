/* ANIMA GAME — la stanza «guarda fuori» (nome di lavoro, ECHO/PAROLE-AURA-2077.md §g).
 *
 * Cosa fa: invita a lasciare lo schermo un minuto, poi raccoglie cielo,
 * vento e — se vuole — una riga su cosa si vede, e li manda al Worker di
 * AURA. Il Worker li confronta con i tre modelli meteo e impara quale ha
 * ragione in quel posto.
 *
 * DEGRADO ONESTO (stesso principio di assets/verifiche.js): la stanza è
 * "accesa" solo se ESISTE una radice del backend E la rotta è dichiarata
 * accesa in assets/config.js. Se manca uno dei due, i bottoni funzionano
 * lo stesso (si può comunque scegliere cielo/vento/testo), ma «Manda» non
 * finge di spedire: salva la bozza sul dispositivo e nomina la rotta che
 * manca.
 *
 * SESSIONE: questa stanza (a differenza della stanza delle verifiche) ha
 * bisogno di sapere CHI sta guardando: usa assets/sessione.js, che parla
 * con un token (Authorization: Bearer), non con un cookie.
 *
 * ASSUNZIONE dichiarata (non nel contratto originale del Worker, che
 * specifica solo /sessione e /aura/osservazione): la rotta di comodo
 * `GET {BACKEND_URL}/aura/localita?q=` per i suggerimenti di posto è
 * opzionale. Se non risponde, o non è dichiarata, restano le quattro
 * località di casa come ripiego — niente si rompe, si perdono solo i
 * suggerimenti in più.
 *
 * — creato da JUDY, 2026-09-04
 */
(function () {
  'use strict';

  var CHIAVE_BOZZA = 'anima.guardafuori.bozza';
  var DURATA = 60; // secondi del minuto — l'unico numero di questa stanza che non è un punteggio

  var CFG = window.AnimaConfig || {};
  var AURA = CFG.AURA || {};
  var ROTTE = AURA.ROTTE || {};
  var ACCESO = !!(CFG.BACKEND_URL && AURA.ACCESE);

  function radice() {
    var u = CFG.BACKEND_URL;
    return (typeof u === 'string' && u.trim()) ? u.trim().replace(/\/+$/, '') : null;
  }

  var $ = function (sel) { return document.querySelector(sel); };

  var elEntra = $('#entra');
  var elStanza = $('#stanza');
  var elDegrado = $('#degrado');
  var elFaseInvito = $('#fase-invito');
  var elVai = $('#vai');
  var elConto = $('#conto');
  var elForm = $('#osservazione');
  var elEsito = $('#esito');
  var elEntraForm = $('#entra-form');
  var elErroreEntra = $('#errore-entra');
  var elLocalita = $('#localita');
  var elLocalitaSuggerimenti = $('#localita-suggerimenti');
  var elTesto = $('#testo');

  if (!elStanza) return; // pagina diversa da quella attesa: non si tocca nulla

  /* ── i messaggi d'errore, per chiave (parole di ECHO) ────────────── */
  var ERRORI = {
    sessione_assente: 'Non ti riconosco: rientra con la tua carta e riprova.',
    gia_guardato_oggi: 'Per questo posto hai già guardato fuori oggi. Torna domani — il cielo cambia, il conto no.',
    testo_non_ammesso: 'Qui racconta solo quello che vedi: niente numeri di telefono, indirizzi o link.',
    luogo_mancante: 'Manca il posto: dicci da dove guardi, prima di mandare.',
    osservazione_incompleta: 'Manca qualcosa: scegli almeno il cielo e il vento prima di mandare.'
  };

  function testoErrore(corpo, risposta) {
    if (corpo && ERRORI[corpo.errore]) return ERRORI[corpo.errore];
    if (corpo && typeof corpo.messaggio === 'string' && corpo.messaggio) return corpo.messaggio;
    if (risposta) return 'Il systema ha risposto ' + risposta.status + '.';
    return 'Non riesco a raggiungere il systema.';
  }

  /* ── la porta: entra con la carta (solo se la stanza è davvero accesa) ── */

  function mostraStanza() {
    if (elEntra) elEntra.hidden = true;
    elStanza.hidden = false;
  }

  if (ACCESO && window.Sessione && !window.Sessione.token()) {
    if (elEntra) elEntra.hidden = false;
    elStanza.hidden = true;
  } else {
    if (elEntra) elEntra.hidden = true;
    elStanza.hidden = false;
  }

  if (elEntraForm) {
    elEntraForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var carta = $('#entra-carta').value.trim();
      var codice = $('#entra-codice').value.trim();
      if (elErroreEntra) elErroreEntra.textContent = '';
      if (!carta || !codice) {
        if (elErroreEntra) elErroreEntra.textContent = 'Servono sia il numero della carta che il codice.';
        return;
      }
      var bottone = elEntraForm.querySelector('button[type=submit]');
      bottone.disabled = true;
      window.Sessione.entra(carta, codice).then(function () {
        bottone.disabled = false;
        mostraStanza();
      }, function (err) {
        bottone.disabled = false;
        if (elErroreEntra) elErroreEntra.textContent = err.message;
      });
    });
  }

  /* ── lo stato «in arrivo» ─────────────────────────────────────────── */
  if (elDegrado) elDegrado.hidden = ACCESO;

  /* ── il cronometro: parte a un tocco, non chiede di restare ──────── */
  var restano = DURATA;
  var giro = null;

  function aggiornaConto() {
    if (elConto) elConto.textContent = restano;
  }

  if (elVai) {
    elVai.addEventListener('click', function () {
      elVai.disabled = true;
      restano = DURATA;
      aggiornaConto();
      var pre = $('#pre-minuto');
      var durante = $('#durante-minuto');
      if (pre) pre.hidden = true;
      if (durante) durante.hidden = false;
      giro = setInterval(function () {
        restano -= 1;
        aggiornaConto();
        if (restano <= 0) {
          clearInterval(giro);
          if (elFaseInvito) elFaseInvito.hidden = true;
          if (elForm) {
            elForm.hidden = false;
            var primaScelta = elForm.querySelector('.scelta');
            if (primaScelta) primaScelta.focus();
          }
        }
      }, 1000);
    });
  }

  /* ── le scelte a bottoni: cielo e vento ───────────────────────────── */
  var cieloScelto = null;
  var ventoScelto = null;

  function agganciaGruppo(selettore, assegna) {
    var bottoni = document.querySelectorAll(selettore);
    for (var i = 0; i < bottoni.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          for (var j = 0; j < bottoni.length; j++) {
            bottoni[j].classList.remove('selezionato');
            bottoni[j].setAttribute('aria-pressed', 'false');
          }
          b.classList.add('selezionato');
          b.setAttribute('aria-pressed', 'true');
          assegna(b.getAttribute('data-valore'));
        });
      })(bottoni[i]);
    }
  }
  agganciaGruppo('.scelta-cielo', function (v) { cieloScelto = v; });
  agganciaGruppo('.scelta-vento', function (v) { ventoScelto = v; });

  /* ── la località: dalla scheda, o scelta al momento ──────────────── */

  // ripiego: quattro località di casa (coordinate da systema77-site/meteo.html)
  var RIPIEGO_LOCALITA = [
    { nome: 'Torre Guaceto', lat: 40.703, lon: 17.8105 },
    { nome: 'Brescia', lat: 45.556, lon: 10.222 },
    { nome: 'Dorio, Como', lat: 46.094, lon: 9.313 },
    { nome: 'Punta Trettu', lat: 39.113, lon: 8.437 }
  ];
  var mappaLocalita = {};

  function aggiungiSuggerimento(voce) {
    if (!voce || !voce.nome) return;
    mappaLocalita[voce.nome] = {
      lat: (typeof voce.lat === 'number') ? voce.lat : null,
      lon: (typeof voce.lon === 'number') ? voce.lon : null
    };
    if (!elLocalitaSuggerimenti) return;
    var giaCe = false;
    for (var i = 0; i < elLocalitaSuggerimenti.children.length; i++) {
      if (elLocalitaSuggerimenti.children[i].value === voce.nome) { giaCe = true; break; }
    }
    if (!giaCe) {
      var opt = document.createElement('option');
      opt.value = voce.nome;
      elLocalitaSuggerimenti.appendChild(opt);
    }
  }
  RIPIEGO_LOCALITA.forEach(aggiungiSuggerimento);

  // dalla scheda del giocatore, se c'è — si legge come fa assets/scheda.js,
  // senza toccarlo: stessa chiave, stesso posto (campi.luogo.valore).
  (function prefillDallaScheda() {
    try {
      var s = JSON.parse(localStorage.getItem('anima.scheda'));
      var luogo = s && s.campi && s.campi.luogo && s.campi.luogo.valore;
      if (luogo && elLocalita && !elLocalita.value) elLocalita.value = luogo;
    } catch (e) { /* nessuna scheda leggibile: si parte da un campo vuoto */ }
  })();

  var cercaRinvio;
  if (elLocalita && ACCESO && ROTTE.LOCALITA) {
    elLocalita.addEventListener('input', function () {
      clearTimeout(cercaRinvio);
      var q = elLocalita.value.trim();
      if (q.length < 2) return;
      cercaRinvio = setTimeout(function () {
        fetch(radice() + ROTTE.LOCALITA + '?q=' + encodeURIComponent(q))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (corpo) {
            // Il Worker risponde con un elenco nudo [{nome, regione, lat, lon}]; le altre due
            // forme restano per compatibilità con lo stub di prova. — D.R.A.G.O., 2026-09-04
            var lista = Array.isArray(corpo) ? corpo : ((corpo && (corpo.risultati || corpo.localita)) || []);
            lista.forEach(aggiungiSuggerimento);
          })
          .catch(function () { /* niente suggerimenti in più: restano i quattro di casa */ });
      }, 300);
    });
  }

  /* ── la bozza resta sul dispositivo (come nella stanza delle verifiche) ── */
  function scriviBozza() {
    var b = {
      cielo: cieloScelto,
      vento: ventoScelto,
      testo: elTesto ? elTesto.value : '',
      localita: elLocalita ? elLocalita.value : '',
      quando: new Date().toISOString()
    };
    try { localStorage.setItem(CHIAVE_BOZZA, JSON.stringify(b)); }
    catch (e) { /* magazzino pieno o negato: si perde solo la bozza, non la pagina */ }
  }

  (function leggiBozza() {
    var b;
    try { b = JSON.parse(localStorage.getItem(CHIAVE_BOZZA)); } catch (e) { b = null; }
    if (!b) return;
    if (elTesto && b.testo) elTesto.value = b.testo;
    if (elLocalita && b.localita && !elLocalita.value) elLocalita.value = b.localita;
    // cielo/vento restano da riscegliere: sono bottoni, non hanno uno stato
    // "letto" finché la stanza non è passata dal minuto — si ridichiarano.
  })();

  /* ── manda ────────────────────────────────────────────────────────── */
  function dillo(html) {
    if (!elEsito) return;
    elEsito.innerHTML = html;
    elEsito.hidden = false;
  }

  if (elForm) {
    elForm.addEventListener('submit', function (e) {
      e.preventDefault();
      scriviBozza();

      if (!ACCESO) {
        dillo('<strong>La stanza è ancora in arrivo, e la tua occhiata non è partita.</strong> ' +
              'Resta <strong>sul tuo dispositivo</strong>, e la ritrovi qui quando torni. ' +
              'Manca l&rsquo;impianto dietro il banco:' +
              '<span class="rotta">POST ' + (ROTTE.OSSERVAZIONE || '/aura/osservazione') + '</span>');
        return;
      }

      if (!window.Sessione || !window.Sessione.token()) {
        dillo(ERRORI.sessione_assente);
        if (elEntra) elEntra.hidden = false;
        elStanza.hidden = true;
        return;
      }

      var voce = mappaLocalita[(elLocalita ? elLocalita.value.trim() : '')] || { lat: null, lon: null };
      var corpo = {
        localita: elLocalita ? elLocalita.value.trim() : '',
        lat: voce.lat,
        lon: voce.lon,
        cielo: cieloScelto,
        vento: ventoScelto,
        testo: elTesto ? elTesto.value.trim() : ''
      };

      var bottone = elForm.querySelector('button[type=submit]');
      bottone.disabled = true;

      window.Sessione.fetch(radice() + ROTTE.OSSERVAZIONE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (dati) {
          bottone.disabled = false;

          if (r.status === 401) {
            dillo(testoErrore(dati, r));
            if (elEntra) elEntra.hidden = false;
            elStanza.hidden = true;
            return;
          }
          if (!r.ok) { dillo(testoErrore(dati, r)); return; }

          try { localStorage.removeItem(CHIAVE_BOZZA); } catch (ex) { /* pazienza */ }

          var m = dati && dati.modello_che_ci_ha_preso;
          var confronto = m
            ? 'Qui ' + m.modello + ' ci ha preso ' + m.giuste + ' volte su ' + m.totali + '.'
            : 'Qui non ci sono ancora abbastanza occhiate per dire chi ci prende di più. Ogni giorno che guardi, il conto cresce.';

          var html = '<strong>Fatto. +' + (dati ? dati.punti_assegnati : '') +
                      '. Grazie per aver guardato fuori.</strong><br>' + confronto;
          if (dati && Array.isArray(dati.perche) && dati.perche.length) {
            html += '<ul>' + dati.perche.map(function (riga) {
              return '<li>' + String(riga).replace(/[<>&]/g, '') + '</li>';
            }).join('') + '</ul>';
          }
          dillo(html);
        });
      }, function () {
        bottone.disabled = false;
        dillo('Non riesco a raggiungere il systema.');
      });
    });
  }
})();
