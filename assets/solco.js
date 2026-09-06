/* IL SOLCO — la firma vivente di SYSTEMA 77
 *
 * Una creatura che non si vede mai attraversa la banda e lascia una traccia.
 * Dal 05/09 la creatura ha una forma nuova, per ordine del Direttore: è il
 * serpente dei vecchi telefoni. Cammina su una griglia, gira solo ad angolo
 * retto, ha una lunghezza fissa e la coda segue la testa. La traccia che
 * lascia — il solco — è il suo corpo che si spegne dietro di lui.
 *
 * Zero dipendenze. Un file. Un colore per casa.
 *
 *   <div class="solco" data-solco="#38E08A"></div>
 *   <script src="solco.js"></script>
 *
 * Attributi:
 *   data-solco        colore della casa (default: il verde del gioco)
 *   data-solco-ratio  proporzione della banda (default 2.35 — il cinema)
 *   data-solco-vel    velocità (default 1)
 *   data-solco-lungo  lunghezza del serpente in celle (default 60)
 *
 * ── I TRE NUMERI, PER CHI NON LO GUARDA ─────────────────────────────────
 * Rilievo del Direttore, 05/09: «va reso verificabile senza guardarlo».
 * Una volta al secondo il solco scrive tre numeri, sulla banda e in pagina:
 *
 *   data-solco-misure="luce=5.4% cingoli=60 fps=60"
 *   window.SOLCO = [{ luce, cingoli, fps, cella, larghezza, altezza }]
 *
 *   luce     quanta banda è accesa, in percentuale: celle vive × area di una
 *            cella ÷ area della banda. È il tetto di casa (10%), e non è una
 *            stima: è un conto, perché la luce sta su una griglia.
 *   cingoli  le celle vive in questo istante — la lunghezza del serpente.
 *   fps      i fotogrammi nell'ultimo secondo.
 *
 * Il guardiano (strumenti/collaudo.mjs) li legge dopo tre secondi e si
 * arrabbia se la luce supera il 10%. Nessuno deve più «vederlo muoversi»
 * per sapere se rispetta le regole: l'animazione ferma venti giorni del
 * 10/08 non si ripete.
 *
 * ── IL TETTO DELLA LUCE, CON LA GRIGLIA ─────────────────────────────────
 * La cella è il 6% dell'altezza della banda, il quadrato dentro la cella
 * il 78% del lato. Con la banda al cinema (2,35:1) una cella accesa vale
 * lo 0,094% della banda: 60 celle = 5,6%, il massimo è fisso perché il
 * serpente è lungo fisso. Il dito del visitatore lo fa correre più veloce,
 * non più lungo: il tetto non si sfonda nemmeno volendo.
 *
 * Regole di casa rispettate: il nero beve la luce · mai più del 10% acceso ·
 * si ferma da solo se il visitatore ha chiesto meno movimento o se la banda
 * non è sullo schermo.
 *
 * — creato da JUDY, 2026-08-10 · riparato e misurato 2026-08-30 ·
 *   il serpente e i tre numeri, 2026-09-05
 */
(function () {
  'use strict';

  var FERMO = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERDE_GIOCO = '#38E08A';   // mai il giallo dell'agenzia qui dentro
  var LUNGO = 60;                // celle: la lunghezza del serpente
  var CROCIERA = 69;             // px al secondo, come prima del 05/09
  var PIENO = 0.78;              // il quadrato dentro la cella, per lato

  // est · sud · ovest · nord — il serpente conosce solo queste quattro
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];

  window.SOLCO = window.SOLCO || [];

  function Solco(host) {
    var colore = host.getAttribute('data-solco') || VERDE_GIOCO;
    var ratio = parseFloat(host.getAttribute('data-solco-ratio')) || 2.35;
    var vel = parseFloat(host.getAttribute('data-solco-vel')) || 1;
    var lungo = parseInt(host.getAttribute('data-solco-lungo'), 10) || LUNGO;

    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');

    var L = 0, A = 0, dpr = 1;
    var cella = 12, colonne = 0, righe = 0;
    // la testa: cella e direzione; il conto dei passi fatti (per le curve)
    var cx = 0, cy = 0, dir = 0, passi = 0;
    var mira = null;          // dove punta il dito del visitatore, se c'è
    var vivo = true, inCorsa = false;
    var seme = Math.random() * 1000;

    // il corpo: le celle vive, dalla coda alla testa. La sbiadita sta qui.
    var corpo = [];

    // i tre numeri
    var misure = { luce: 0, cingoli: 0, fps: 0, cella: 0, larghezza: 0, altezza: 0 };
    window.SOLCO.push(misure);
    var fotogrammi = 0, ultimoConto = 0;

    // Ritorna true solo quando la banda ha una misura vera.
    // ⚠️ pagato al collaudo del 10/08: misurando subito si prende 0×0 —
    // il browser non ha ancora impaginato (i font stanno arrivando) e la
    // banda resta nera per sempre. Si misura DOPO, e si rimisura sempre.
    function misura() {
      var r = host.getBoundingClientRect();
      var nL = Math.round(r.width);
      var nA = Math.round(r.height || nL / ratio);
      if (nL < 2 || nA < 2) return false;
      if (nL === L && nA === A) return true;

      L = nL; A = nA;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = L * dpr;
      cv.height = A * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, L, A);

      cella = Math.max(6, Math.round(A * 0.06));
      colonne = Math.ceil(L / cella);
      righe = Math.ceil(A / cella);
      corpo.length = 0;

      // entra dal bordo sinistro, all'altezza della battigia, verso est
      cx = -1; cy = Math.round(righe * 0.62); dir = 0; passi = 0;

      misure.cella = cella; misure.larghezza = L; misure.altezza = A;
      return true;
    }

    // rumore povero ma organico: somma di seni incommensurabili, niente librerie
    function deriva(k) {
      return Math.sin(k * 0.7) * 0.6 + Math.sin(k * 0.31 + 1.3) * 0.3 +
             Math.sin(k * 1.7 + 2.6) * 0.1;
    }

    // Il serpente decide dove girare. Tre voci, in ordine di forza:
    //   1. il muro: a due celle dal bordo si gira dalla parte opposta;
    //   2. il dito del visitatore: si va verso di lui, un angolo alla volta;
    //   3. la deriva: ogni tanto una curva, come il serpente che vagabonda.
    // Mai una retromarcia: il serpente non torna su se stesso.
    function gira() {
      var margine = 2;
      var sx = cx < margine, dx_ = cx > colonne - 1 - margine;
      var su = cy < margine, giu = cy > righe - 1 - margine;

      if ((dir === 0 && dx_) || (dir === 2 && sx)) {
        dir = (cy > righe / 2) ? 3 : 1;           // via dal muro, verso il centro
        return;
      }
      if ((dir === 1 && giu) || (dir === 3 && su)) {
        dir = (cx > colonne / 2) ? 2 : 0;
        return;
      }

      if (mira) {
        var mx = Math.floor(mira.x / cella), my = Math.floor(mira.y / cella);
        var ddx = mx - cx, ddy = my - cy;
        var voglia = (Math.abs(ddx) >= Math.abs(ddy))
          ? (ddx > 0 ? 0 : 2) : (ddy > 0 ? 1 : 3);
        if (voglia !== dir && voglia !== (dir + 2) % 4 && spazio(voglia) > margine) dir = voglia;
        return;
      }

      // la deriva: una curva quando il rumore cambia segno con decisione.
      // Non si gira verso un muro vicino: altrimenti il serpente finiva a
      // strisciare lungo i bordi (misurato il 05/09 nella versione ferma).
      var d = deriva(seme + passi * 0.23);
      if (Math.abs(d) > 0.55 && passi % 3 === 0) {
        var nuova = (dir + (d > 0 ? 1 : 3)) % 4;
        if (spazio(nuova) <= margine + 2) nuova = (dir + (d > 0 ? 3 : 1)) % 4;
        if (spazio(nuova) > margine + 2) dir = nuova;
      }
    }

    // quante celle libere ci sono davanti, in quella direzione
    function spazio(verso) {
      if (verso === 0) return colonne - 1 - cx;
      if (verso === 2) return cx;
      if (verso === 1) return righe - 1 - cy;
      return cy;
    }

    function avanza() {
      gira();
      cx += DX[dir]; cy += DY[dir];
      passi++;

      // se esce davvero, rientra dall'altra parte: non muore mai
      if (cx < -1) cx = colonne; if (cx > colonne) cx = -1;
      if (cy < -1) cy = righe;   if (cy > righe) cy = -1;

      corpo.push({ x: cx, y: cy });
      while (corpo.length > lungo) corpo.shift();
    }

    // una cella accesa: un quadrato, e la testa porta il bagliore
    function quadrato(gx, gy, forza, testa) {
      var lato = cella * PIENO, off = (cella - lato) / 2;
      ctx.globalAlpha = forza;
      ctx.fillStyle = colore;
      ctx.shadowColor = colore;
      ctx.shadowBlur = testa ? 8 : 0;
      ctx.fillRect(gx * cella + off, gy * cella + off, lato, lato);
    }

    // si ridisegna tutto il corpo: la coda si spegne, la testa brilla
    function disegna() {
      ctx.clearRect(0, 0, L, A);
      var n = corpo.length;
      for (var i = 0; i < n; i++) {
        var u = (n - 1 - i) / Math.max(1, lungo - 1);   // 0 = testa, 1 = coda
        var forza = 0.9 * (1 - u) * (1 - u * 0.4) + 0.06;
        quadrato(corpo[i].x, corpo[i].y, forza, i === n - 1);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // i tre numeri, una volta al secondo
    function conta(ora) {
      fotogrammi++;
      if (ora - ultimoConto < 1000) return;
      var areaCella = (cella * PIENO) * (cella * PIENO);
      misure.luce = Math.round(corpo.length * areaCella / (L * A) * 1000) / 10;
      misure.cingoli = corpo.length;
      misure.fps = fotogrammi;
      fotogrammi = 0; ultimoConto = ora;
      host.setAttribute('data-solco-misure',
        'luce=' + misure.luce + '% cingoli=' + misure.cingoli + ' fps=' + misure.fps);
    }

    var accumulo = 0, prima = 0;
    function passo(ora) {
      if (!vivo) { inCorsa = false; return; }
      if (!misura()) { requestAnimationFrame(passo); return; }  // aspetta il layout
      if (!prima) prima = ora;
      var dt = Math.min(100, ora - prima); prima = ora;

      // a crociera fa CROCIERA px/s; il dito lo fa correre 1,6×
      var v = CROCIERA * vel * (mira ? 1.6 : 1);
      accumulo += dt * v / 1000;
      while (accumulo >= cella) { accumulo -= cella; avanza(); }

      disegna();
      conta(ora);
      requestAnimationFrame(passo);
    }

    // versione ferma, per chi ha chiesto meno movimento: il serpente ha già
    // attraversato, e quello che si vede è il suo corpo fermo, da bordo a bordo.
    function unaPassata() {
      var tetto = colonne * 6 + 200;   // sicurezza, non progetto
      var n = 0;
      corpo.length = 0;
      cx = -1; cy = Math.round(righe * 0.62); dir = 0; passi = 0; mira = null;
      while (n++ < tetto) {
        avanza();
        if (cx >= colonne - 1) break;
      }
      disegna();
      var areaCella = (cella * PIENO) * (cella * PIENO);
      misure.luce = Math.round(corpo.length * areaCella / (L * A) * 1000) / 10;
      misure.cingoli = corpo.length; misure.fps = 0;
      host.setAttribute('data-solco-misure',
        'luce=' + misure.luce + '% cingoli=' + misure.cingoli + ' fps=0');
    }

    function tocco(e) {
      var r = host.getBoundingClientRect();
      mira = { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // La misura si rifà da sola a ogni cambio: font che arrivano, finestra
    // che cambia, contenitore che si apre. Meglio del solo `resize`.
    function riMisura() {
      var cambiata = (Math.round(host.getBoundingClientRect().width) !== L);
      if (misura() && FERMO && cambiata) unaPassata();
    }
    if (window.ResizeObserver) {
      new ResizeObserver(riMisura).observe(host);
    } else {
      var rid;
      window.addEventListener('resize', function () {
        clearTimeout(rid); rid = setTimeout(riMisura, 180);
      });
    }

    if (FERMO) {
      // niente giostra: si disegna il serpente già passato, e ci si ferma
      requestAnimationFrame(function attendi() {
        if (misura()) unaPassata(); else requestAnimationFrame(attendi);
      });
      return;
    }

    host.addEventListener('pointermove', tocco);
    host.addEventListener('pointerleave', function () { mira = null; });

    function accendi() {
      if (inCorsa) return;
      inCorsa = true;
      prima = 0;
      requestAnimationFrame(passo);
    }

    // non gira se non la sta guardando nessuno
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (voci) {
        vivo = voci[0].isIntersecting;
        if (vivo) accendi();
      }, { threshold: 0.01 }).observe(host);
    }
    accendi();
  }

  function avvia() {
    var bande = document.querySelectorAll('[data-solco]');
    for (var i = 0; i < bande.length; i++) Solco(bande[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }
})();
