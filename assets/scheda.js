/* ANIMA GAME — logica della scheda giocatore.
   La regola: i dati sono del giocatore. Ogni campo ha il suo interruttore
   "visibile agli altri"; quello che non è acceso, gli altri non lo vedono.
   ANCHE IL NOME è un campo come gli altri (direzione JUDY, 01/08): spento,
   gli altri vedono «GIOCATORE NN». L'unica cosa pubblica per definizione
   è il punteggio: è il gioco.
   In fase DEV (backend spento) tutto resta sul dispositivo: localStorage.
   Quando SQUELCH accende il Worker, si compila BACKEND_URL in config.js
   e queste stesse funzioni parlano con lui.
   — creato da ECHO, 2026-08-01 · nome-come-campo su direzione JUDY, 2026-08-02

   ─────────────────────────────────────────────────────────────────────────
   COSA FA — tiene la scheda sul dispositivo del giocatore, sempre; e quando
     BACKEND_URL è acceso la tiene anche sul systema, parlando con GET e PUT
     su {BACKEND_URL}/schede/mia.
   PERCHÉ ESISTE — fino al 04/09 le due chiamate erano COMMENTI dentro un `if`.
     Con BACKEND_URL valorizzato, leggi() tornava `null` e scrivi() usciva senza
     scrivere da nessuna parte: né in rete né sul dispositivo. Misurato il 04/09
     caricando questa pagina in un DOM vero, con BACKEND_URL finto: il giocatore
     entra, scrive, vede tutto al suo posto — e `localStorage` resta VUOTO, con
     zero chiamate di rete. Cioè: il giorno in cui il Direttore avesse acceso il
     Worker, ogni scheda si sarebbe svuotata al ricaricamento, in silenzio, e la
     colpa sarebbe sembrata del backend appena nato. Il commento prometteva
     «queste stesse funzioni parlano con lui»: sotto non c'era impianto.
   FIN DOVE ARRIVA — parla una rotta sola, `/schede/mia`, e nessun'altra.
     NON cancella dal systema (il contratto non ha una DELETE: «Esci» toglie la
     copia locale e lo dice). NON gestisce due dispositivi che scrivono insieme:
     l'ultimo PUT vince. NON manda su punteggio, contenuti e arcano — non sono
     del browser. L'identità la mette la porta, non questo file: qui dentro non
     c'è e non deve entrare nessuna chiave.
   USO — si carica da scheda.html dopo assets/config.js. Per accenderlo si tocca
     solo BACKEND_URL in assets/config.js: qui non si riscrive una riga.
   — SQUELCH · giro 1 · dispatch D.R.A.G.O. · 2026-09-04
*/

(function () {
  'use strict';

  var CHIAVE = 'anima.scheda';
  var ROTTA = '/schede/mia';   // l'unica rotta di questa stanza: GET e PUT
  var ATTESA = 8000;           // ms oltre i quali il systema è «non risponde»
  var RINVIO = 900;            // ms: un PUT a ogni tasto sarebbe un abuso

  /* Campi che il giocatore scrive. "visibile" nasce spento su tutto:
     privacy prima di tutto, il nome compreso. */
  var CAMPI = [
    { id: 'nome',      nome: 'Nome mostrato',       segnaposto: 'il nome con cui giochi' },
    { id: 'motto',     nome: 'Motto',               segnaposto: 'una riga che ti somiglia' },
    { id: 'cerchio',   nome: 'Cerchio',             segnaposto: 'chi ti ha portato dentro' },
    { id: 'luogo',     nome: 'Luogo',               segnaposto: 'dove giochi, come vuoi dirlo' },
    /* ⬜ NOME-DEFINITIVO: qui il segnaposto citava per nome due stanze che
       oggi sono una sola e il cui nome è sotto revisione. Resta neutro. */
    { id: 'strumento', nome: 'Stanza preferita',    segnaposto: 'le verifiche, la radio…' },
    { id: 'contatto',  nome: 'Contatto',            segnaposto: 'come raggiungerti (resta tuo)' }
  ];

  function nomeSlot(slot) {
    return 'GIOCATORE ' + ('0' + slot).slice(-2);
  }

  /* ── il systema: c'è o non c'è ────────────────────────────────── */

  /* Una sola domanda, un solo posto dove si risponde. BACKEND_URL può essere
     null (fase DEV), ma anche '' o un valore storto se qualcuno lo compila di
     fretta: tutto ciò che non è una stringa piena vale «spento». Meglio restare
     in locale che comporre indirizzi come "null/schede/mia". */
  function radice() {
    var u = (window.AnimaConfig || {}).BACKEND_URL;
    if (typeof u !== 'string' || !u.trim()) return null;
    return u.trim().replace(/\/+$/, '');
  }

  var collegato = radice() !== null;

  /* ── magazzino ────────────────────────────────────────────────────

     LOCAL-FIRST, ANCHE COL SYSTEMA ACCESO. Il dispositivo non è il ripiego
     della fase DEV: è dove la scheda sta comunque, e il systema è una copia
     in più — non il padrone. Così una rete che cade è un fastidio e non una
     scheda persa, e i dati del giocatore viaggiano solo quando serve. */

  function leggiLocale() {
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

  function scriviLocale(s) {
    try {
      localStorage.setItem(CHIAVE, JSON.stringify(s));
      return true;
    } catch (e) {
      // Magazzino pieno, o navigazione privata che lo nega. Non si finge:
      // se questa è l'unica copia (systema spento) il giocatore deve saperlo.
      dillo(collegato ? 'senza-magazzino' : 'senza-magazzino-solo');
      return false;
    }
  }

  /* leggi() resta SINCRONA e resta locale: la pagina si disegna subito con
     quello che c'è sul dispositivo, e la richiesta al systema parte dopo.
     Se fosse asincrona, con la rete lenta il giocatore guarderebbe il vuoto. */
  function leggi() {
    return leggiLocale();
  }

  /* scrivi() salva SEMPRE sul dispositivo, e solo dopo, se il systema c'è,
     programma la spedizione. `_daSpedire` è roba del client (l'underscore lo
     dice) e non esce mai da qui: segna che c'è una modifica che il systema non
     ha ancora preso. Sopravvive alla chiusura della pagina apposta — è quello
     che permette di non perdere ciò che si è scritto con la rete giù. */
  function scrivi(scheda) {
    if (collegato) scheda._daSpedire = true;
    scriviLocale(scheda);
    if (collegato) programmaSpinta(scheda);
  }

  function cancella() {
    try { localStorage.removeItem(CHIAVE); } catch (e) { /* già non c'è */ }
  }

  /* ── la linea col systema ─────────────────────────────────────── */

  /* Una sola porta verso la rete. Il tempo massimo è dichiarato: senza, un
     systema che accetta la connessione e poi tace lascia la pagina in «sto
     chiedendo…» per sempre, che è il modo più educato di mentire. */
  function chiama(metodo, corpo) {
    var taglia = new AbortController();
    var scaduto = setTimeout(function () { taglia.abort(); }, ATTESA);
    function libera(x) { clearTimeout(scaduto); return x; }

    return fetch(radice() + ROTTA, {
      method: metodo,
      // L'identità la mette la porta del gioco (il cookie di sessione), non
      // questa pagina: un sito statico non può custodire un segreto, e una
      // chiave scritta qui sarebbe leggibile da chiunque apra il sorgente.
      credentials: 'include',
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: taglia.signal
    }).then(libera, function (err) { libera(); throw err; });
  }

  /* Si spedisce SOLO ciò che è del giocatore: il posto e i campi che ha scritto.
     punteggio, contenuti e arcano li scrive il systema — se glieli mandasse su
     il browser, il gioco poggerebbe su numeri dichiarati da chi ci gioca. */
  function corpoDaSpedire(s) {
    return { slot: s.slot, campi: s.campi };
  }

  var rinvio;
  function programmaSpinta(s) {
    clearTimeout(rinvio);
    rinvio = setTimeout(function () { spingi(s); }, RINVIO);
  }

  function spingi(s) {
    dillo('in-corso');
    return chiama('PUT', corpoDaSpedire(s)).then(function (r) {
      if (r.status === 401 || r.status === 403) { dillo('porta'); return; }
      if (!r.ok) { dillo('sola', 'ha risposto ' + r.status); return; }
      delete s._daSpedire;          // il systema l'ha presa: il locale non è più avanti
      scriviLocale(s);
      dillo('collegata');
    }, function (err) {
      dillo('sola', motivo(err));
    });
  }

  function motivo(err) {
    if (err && err.name === 'AbortError') return 'non ha risposto entro ' + (ATTESA / 1000) + ' secondi';
    return 'non riesco a raggiungerlo';
  }

  /* ── quello che torna dal systema si controlla PRIMA di disegnarlo ──

     Non per sfiducia nel Worker: perché una risposta storta — un proxy che
     restituisce una pagina HTML, una rotta che cambia forma, un campo in meno
     dopo un aggiornamento — non deve svuotare la scheda di chi sta giocando.
     Regola dura su `visibile`: è acceso SOLO se vale esattamente true. Un
     "true" di stringa, un 1, un undefined valgono SPENTO. Nel dubbio non si
     mostra: sbagliare da questa parte costa un campo nascosto, sbagliare
     dall'altra costa il contatto di una persona mostrato a chi non doveva. */
  function normalizza(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    var dentro = (s.campi && typeof s.campi === 'object' && !Array.isArray(s.campi)) ? s.campi : {};
    var fuori = {
      slot: intero(s.slot, 0, 0, 99),
      campi: {},
      arcano: typeof s.arcano === 'string' && s.arcano ? s.arcano : null,
      punteggio: intero(s.punteggio, 0, 0, 1e9),
      contenuti: intero(s.contenuti, 0, 0, 1e9),
      ingresso: /^\d{4}-\d{2}-\d{2}$/.test(s.ingresso) ? s.ingresso : oggi()
    };
    CAMPI.forEach(function (c) {
      var v = (dentro[c.id] && typeof dentro[c.id] === 'object') ? dentro[c.id] : {};
      fuori.campi[c.id] = {
        valore: typeof v.valore === 'string' ? v.valore.slice(0, 240) : '',
        visibile: v.visibile === true
      };
    });
    return fuori;
  }

  function intero(v, difetto, min, max) {
    var n = (typeof v === 'number' && isFinite(v)) ? Math.floor(v) : NaN;
    if (isNaN(n) || n < min || n > max) return difetto;
    return n;
  }

  function oggi() { return new Date().toISOString().slice(0, 10); }

  /* CHI VINCE, QUANDO LE DUE COPIE NON COINCIDONO.
     - i numeri del systema (punteggio, contenuti, arcano) vengono SEMPRE da
       lassù: non sono del browser, e il browser non li discute;
     - i campi scritti dal giocatore vengono da lassù SOLO se qui non era
       rimasto niente da spedire. Se era rimasto — ha scritto mentre la rete
       era giù — vince il locale, che poi viene spinto su. Nessuna riga scritta
       a mano sparisce perché una rete è tornata. */
  function unisci(locale, remota) {
    if (!remota) return locale;
    if (!locale || !locale._daSpedire) return remota;
    locale.punteggio = remota.punteggio;
    locale.contenuti = remota.contenuti;
    locale.arcano = remota.arcano;
    return locale;
  }

  /* ── la striscia dice dove stanno davvero i dati ───────────────────

     In fase DEV NON si tocca: il testo che c'è in scheda.html è di ECHO e dice
     già la verità. Si riscrive solo negli stati che quel testo non poteva
     prevedere — cioè quando il systema è acceso. Una striscia che dice «il
     backend non è ancora acceso» mentre il backend risponde sarebbe una scritta
     che racconta una cosa e un impianto che ne fa un'altra. */
  var VOCI = {
    'in-corso':
      'Sto chiedendo la tua scheda al systema. Intanto vedi la copia che sta ' +
      'su questo dispositivo.',
    'collegata':
      '<strong>Scheda sul systema.</strong> Una copia resta su questo dispositivo, ' +
      'così non la perdi se la rete cade. Punteggio e contenuti li scrive il ' +
      'systema: questa pagina non li spedisce.',
    'sola':
      '<strong>Il systema non risponde</strong> (%s). La scheda non è persa: ' +
      'resta su questo dispositivo. Quello che scrivi adesso viene spedito ' +
      'appena il systema torna.',
    'porta':
      '<strong>La porta non ti riconosce.</strong> Il systema c’è ma non sa ' +
      'chi sei, e la scheda non viene spedita: resta su questo dispositivo. ' +
      'Rientra dalla porta del gioco, poi ricarica questa pagina.',
    'illeggibile':
      '<strong>Il systema ha risposto qualcosa che non so leggere.</strong> ' +
      'Non ci scrivo sopra la tua scheda: resta quella su questo dispositivo.',
    'senza-magazzino':
      '<strong>Questo dispositivo non mi lascia salvare</strong> (magazzino pieno ' +
      'o navigazione privata). La scheda va sul systema, ma qui non resta copia: ' +
      'se la rete cade, quello che scrivi ora si perde.',
    'senza-magazzino-solo':
      '<strong>Questo dispositivo non mi lascia salvare</strong> (magazzino pieno ' +
      'o navigazione privata). In fase DEV questa è l’unica copia possibile: ' +
      'quello che scrivi si perde chiudendo la pagina.'
  };

  function dillo(stato, dettaglio) {
    var p = document.querySelector('.striscia-dev p');
    if (!p || !VOCI[stato]) return;
    // dettaglio lo compongo io (un numero di stato, un tempo): ripulito lo stesso,
    // perché una stringa che arriva dalla rete non entra mai in innerHTML.
    var d = String(dettaglio == null ? '' : dettaglio).replace(/[<>&"]/g, '');
    p.innerHTML = VOCI[stato].replace('%s', d);
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

  /* Staccata da disegnaScheda perché quando torna il systema cambiano SOLO
     questi numeri: si aggiornano senza rifare i campi sotto le dita di chi
     sta scrivendo. */
  function disegnaSystema(s, comeAltri) {
    $('#scheda-slot').textContent = ('0' + s.slot).slice(-2);
    $('#scheda-nome').textContent = nomeInTesta(s, comeAltri);
    $('#scheda-punteggio').textContent = s.punteggio;
    $('#scheda-contenuti').textContent = s.contenuti;
    $('#scheda-arcano').textContent = s.arcano || '—';
    $('#scheda-ingresso').textContent = testoData(s.ingresso);
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
      ingresso: oggi()
    };
  }

  function disegnaScheda(s, comeAltri) {
    disegnaSystema(s, comeAltri);

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

  /* ── il primo saluto al systema ───────────────────────────────── */

  /* Si chiama una volta sola, all'avvio, e la pagina è già disegnata quando
     parte. `poi` riceve la scheda da tenere, oppure null se non ce n'è nessuna
     né qui né lassù. Ogni strada che non porta a una scheda buona lascia in
     piedi quella locale: il systema può dire di no, non può cancellare. */
  function sincronizza(locale, poi) {
    dillo('in-corso');
    chiama('GET').then(function (r) {
      if (r.status === 401 || r.status === 403) { dillo('porta'); poi(locale); return; }
      if (r.status === 404) {
        // Il systema non ha ancora una scheda mia. Se qui ce n'è una, gliela do.
        if (locale) { locale._daSpedire = true; spingi(locale); }
        else dillo('collegata');
        poi(locale);
        return;
      }
      if (!r.ok) { dillo('sola', 'ha risposto ' + r.status); poi(locale); return; }

      return r.json().then(function (grezza) {
        var remota = normalizza(grezza);
        if (!remota) { dillo('illeggibile'); poi(locale); return; }
        var unita = unisci(locale, remota);
        // La copia che arriva dal systema si posa SUBITO sul dispositivo. Senza
        // questa riga il local-first sarebbe una promessa: al primo avvio con la
        // rete giù il giocatore si ritroverebbe davanti la porta d'ingresso come
        // se non avesse mai giocato. Trovato il 04/09 dalle prove, non a mente.
        if (unita) scriviLocale(unita);
        if (unita && unita._daSpedire) { spingi(unita); } else { dillo('collegata'); }
        poi(unita);
      }, function () {
        // corpo non leggibile come JSON: non ci si costruisce sopra niente
        dillo('illeggibile');
        poi(locale);
      });
    }, function (err) {
      dillo('sola', motivo(err));
      poi(locale);
    });
  }

  /* ── avvio ───────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    var scheda = leggi();
    var comeAltri = false;

    function ridisegna() {
      if (scheda) {
        mostra('#scheda');
        disegnaScheda(scheda, comeAltri);
      } else {
        mostra('#entra');
      }
    }

    ridisegna();

    if (collegato) {
      sincronizza(scheda, function (s) {
        if (!s) return;
        var eraLoStesso = (s === scheda);
        scheda = s;
        // Se il systema ha solo aggiornato i numeri, non si rifanno i campi:
        // il giocatore potrebbe avere le dita dentro uno di essi.
        if (eraLoStesso) disegnaSystema(scheda, comeAltri);
        else ridisegna();
      });
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
      // Col systema acceso la frase di ECHO non sarebbe più vera: il contratto
      // non ha una DELETE, quindi da qui la copia di lassù non si tocca. Si
      // dice, invece di lasciarlo credere.
      var domanda = collegato
        ? 'Uscire? La copia su questo dispositivo si cancella. Quella sul systema resta: ' +
          'da qui non c’è modo di cancellarla.'
        : 'Uscire? In fase DEV la scheda si cancella da questo dispositivo.';
      if (!confirm(domanda)) return;
      clearTimeout(rinvio);          // niente PUT in volo per una scheda uscita
      cancella();
      scheda = null;
      comeAltri = false;
      document.body.classList.remove('vista-altri');
      mostra('#entra');
    });
  });
})();
