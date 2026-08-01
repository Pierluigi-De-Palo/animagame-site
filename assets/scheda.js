/* ANIMA GAME — logica della scheda giocatore.
   La regola: i dati sono del giocatore. Ogni campo ha il suo interruttore
   "visibile agli altri"; quello che non è acceso, gli altri non lo vedono.
   ANCHE IL NOME è un campo come gli altri (direzione JUDY, 01/08): spento,
   gli altri vedono «GIOCATORE NN». L'unica cosa pubblica per definizione
   è il punteggio: è il gioco.
   In fase DEV (backend spento) tutto resta sul dispositivo: localStorage.
   Quando SQUELCH accende il Worker, si compila BACKEND_URL in config.js
   e queste stesse funzioni parlano con lui.
   — creato da ECHO, 2026-08-01 · nome-come-campo su direzione JUDY, 2026-08-02 */

(function () {
  'use strict';

  var CHIAVE = 'anima.scheda';

  /* Campi che il giocatore scrive. "visibile" nasce spento su tutto:
     privacy prima di tutto, il nome compreso. */
  var CAMPI = [
    { id: 'nome',      nome: 'Nome mostrato',       segnaposto: 'il nome con cui giochi' },
    { id: 'motto',     nome: 'Motto',               segnaposto: 'una riga che ti somiglia' },
    { id: 'cerchio',   nome: 'Cerchio',             segnaposto: 'chi ti ha portato dentro' },
    { id: 'luogo',     nome: 'Luogo',               segnaposto: 'dove giochi, come vuoi dirlo' },
    { id: 'strumento', nome: 'Stanza preferita',    segnaposto: 'braindance, fake checker…' },
    { id: 'contatto',  nome: 'Contatto',            segnaposto: 'come raggiungerti (resta tuo)' }
  ];

  function nomeSlot(slot) {
    return 'GIOCATORE ' + ('0' + slot).slice(-2);
  }

  /* ── magazzino: localStorage ora, Worker poi ─────────────────── */

  function leggi() {
    if (window.AnimaConfig.BACKEND_URL) {
      // Col backend acceso: GET {BACKEND_URL}/schede/mia (vedi contratto API).
      // In DEV non si passa mai di qui.
      return null;
    }
    var s;
    try {
      s = JSON.parse(localStorage.getItem(CHIAVE));
    } catch (e) {
      return null;
    }
    // schede della prima DEV: il nome viveva fuori dai campi
    if (s && s.campi && !s.campi.nome) {
      s.campi.nome = { valore: s.nome || '', visibile: false };
      delete s.nome;
    }
    return s;
  }

  function scrivi(scheda) {
    if (window.AnimaConfig.BACKEND_URL) {
      // Col backend acceso: PUT {BACKEND_URL}/schede/mia.
      return;
    }
    localStorage.setItem(CHIAVE, JSON.stringify(scheda));
  }

  function cancella() {
    localStorage.removeItem(CHIAVE);
  }

  function schedaNuova(slot, nome) {
    var campi = {};
    CAMPI.forEach(function (c) {
      campi[c.id] = { valore: '', visibile: false };
    });
    campi.nome.valore = nome;
    return {
      slot: slot,
      campi: campi,
      /* Dal systema (li scrive il backend, qui stati onesti a zero): */
      arcano: null,        // il tarocco arriva a settembre, con la Porta
      punteggio: 0,
      contenuti: 0,
      ingresso: new Date().toISOString().slice(0, 10)
    };
  }

  /* ── viste ───────────────────────────────────────────────────── */

  var $ = function (sel) { return document.querySelector(sel); };

  function mostra(vista) {
    ['#entra', '#scheda'].forEach(function (v) { $(v).hidden = (v !== vista); });
  }

  function testoData(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function nomeInTesta(s, comeAltri) {
    var dato = s.campi.nome;
    if (comeAltri && !dato.visibile) return nomeSlot(s.slot);
    return dato.valore || nomeSlot(s.slot);
  }

  function disegnaScheda(s, comeAltri) {
    $('#scheda-slot').textContent = ('0' + s.slot).slice(-2);
    $('#scheda-nome').textContent = nomeInTesta(s, comeAltri);
    $('#scheda-punteggio').textContent = s.punteggio;
    $('#scheda-contenuti').textContent = s.contenuti;
    $('#scheda-arcano').textContent = s.arcano || '—';
    $('#scheda-ingresso').textContent = testoData(s.ingresso);

    var lista = $('#campi');
    lista.innerHTML = '';
    CAMPI.forEach(function (c) {
      var dato = s.campi[c.id];
      if (comeAltri) {
        if (c.id === 'nome') return;           // il nome sta già in testa
        if (!dato.visibile) return;            // gli altri non lo vedono
      }

      var riga = document.createElement('div');
      riga.className = 'campo';

      var testa = document.createElement('div');
      testa.className = 'campo-testa';
      var nome = document.createElement('span');
      nome.className = 'campo-nome';
      nome.textContent = c.nome;
      testa.appendChild(nome);

      if (!comeAltri) {
        var interr = document.createElement('label');
        interr.className = 'interruttore' + (dato.visibile ? ' acceso' : '');
        var box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = dato.visibile;
        box.setAttribute('aria-label', 'Visibile agli altri: ' + c.nome);
        var scritta = document.createElement('span');
        scritta.textContent = dato.visibile ? 'visibile agli altri' : 'solo tuo';
        box.addEventListener('change', function () {
          dato.visibile = box.checked;
          interr.classList.toggle('acceso', box.checked);
          scritta.textContent = box.checked ? 'visibile agli altri' : 'solo tuo';
          scrivi(s);
        });
        interr.appendChild(box);
        interr.appendChild(scritta);
        testa.appendChild(interr);
      }
      riga.appendChild(testa);

      if (comeAltri) {
        var valore = document.createElement('div');
        valore.className = 'campo-valore';
        valore.textContent = dato.valore || '—';
        riga.appendChild(valore);
      } else {
        var campo = document.createElement('input');
        campo.type = 'text';
        campo.className = 'campo-input';
        campo.value = dato.valore;
        campo.placeholder = c.segnaposto;
        if (c.id === 'nome') campo.maxLength = 24;
        campo.addEventListener('input', function () {
          dato.valore = campo.value;
          if (c.id === 'nome') $('#scheda-nome').textContent = nomeInTesta(s, false);
          scrivi(s);
        });
        riga.appendChild(campo);
      }
      lista.appendChild(riga);
    });

    if (comeAltri && !lista.children.length) {
      var vuoto = document.createElement('p');
      vuoto.className = 'campo-vuoto';
      vuoto.textContent = 'Questo giocatore mostra solo il suo numero e il punteggio. Sua scelta, buona scelta.';
      lista.appendChild(vuoto);
    }
  }

  /* ── avvio ───────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    var scheda = leggi();
    var comeAltri = false;

    if (scheda) {
      mostra('#scheda');
      disegnaScheda(scheda, comeAltri);
    } else {
      mostra('#entra');
    }

    $('#entra-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nome = $('#entra-nome').value.trim();
      var slot = parseInt($('#entra-slot').value, 10);
      if (!nome) return;
      scheda = schedaNuova(slot, nome);
      scrivi(scheda);
      mostra('#scheda');
      disegnaScheda(scheda, comeAltri);
    });

    $('#vista-altri').addEventListener('click', function () {
      comeAltri = !comeAltri;
      this.textContent = comeAltri ? 'Torna alla tua vista' : 'Come ti vedono gli altri';
      document.body.classList.toggle('vista-altri', comeAltri);
      disegnaScheda(scheda, comeAltri);
    });

    $('#esci').addEventListener('click', function () {
      if (!confirm('Uscire? In fase DEV la scheda si cancella da questo dispositivo.')) return;
      cancella();
      scheda = null;
      comeAltri = false;
      document.body.classList.remove('vista-altri');
      mostra('#entra');
    });
  });
})();
