/* IL SOLCO — la firma vivente di SYSTEMA 77
 *
 * Una creatura che non si vede mai attraversa la banda e lascia una traccia.
 * La traccia è un cingolato: due file di trattini, come il solco che la
 * tartaruga lascia sulla sabbia — «simile al passaggio di un piccolo
 * cingolato» (Centro visite di Torre Guaceto, verificato da BRAINDANCE).
 *
 * Zero dipendenze. Un file. Un colore per casa.
 *
 *   <div class="solco" data-solco="#F2E205"></div>
 *   <script src="solco.js"></script>
 *
 * Attributi:
 *   data-solco        colore della casa (default giallo agenzia)
 *   data-solco-ratio  proporzione della banda (default 2.35 — il cinema)
 *   data-solco-vel    velocità (default 1)
 *
 * Regole di casa rispettate: il nero beve la luce · mai più del 10% acceso ·
 * si ferma da solo se il visitatore ha chiesto meno movimento o se la banda
 * non è sullo schermo.
 *
 * — creato da JUDY, 2026-08-10
 */
(function () {
  'use strict';

  var FERMO = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Solco(host) {
    var colore = host.getAttribute('data-solco') || '#F2E205';
    var ratio = parseFloat(host.getAttribute('data-solco-ratio')) || 2.35;
    var vel = parseFloat(host.getAttribute('data-solco-vel')) || 1;

    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');

    var L = 0, A = 0, dpr = 1;
    // la creatura: posizione, direzione, e il conto di quanto ha camminato
    var x = 0, y = 0, ang = 0, t = Math.random() * 1000, percorso = 0;
    var mira = null;          // dove punta il dito del visitatore, se c'è
    var vivo = true, girando = false;

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
      // entra dal bordo sinistro, all'altezza della battigia
      x = -20; y = A * 0.62; ang = -0.15; percorso = 0;
      return true;
    }

    // rumore povero ma organico: somma di seni incommensurabili, niente librerie
    function deriva(k) {
      return Math.sin(k * 0.7) * 0.6 + Math.sin(k * 0.31 + 1.3) * 0.3 +
             Math.sin(k * 1.7 + 2.6) * 0.1;
    }

    // due trattini perpendicolari: è il cingolato
    function cingolo(px, py, dir, forza) {
      var nx = Math.cos(dir + Math.PI / 2), ny = Math.sin(dir + Math.PI / 2);
      var largo = Math.max(3, A * 0.022);   // la carreggiata
      var lungo = largo * 0.72;             // il singolo trattino
      var sb = Math.cos(dir), sy = Math.sin(dir);

      ctx.strokeStyle = colore;
      ctx.lineCap = 'round';
      ctx.shadowColor = colore;

      for (var s = -1; s <= 1; s += 2) {
        var cx = px + nx * largo * s, cy = py + ny * largo * s;
        ctx.globalAlpha = 0.75 * forza;
        ctx.shadowBlur = 6;
        ctx.lineWidth = Math.max(1, largo * 0.16);
        ctx.beginPath();
        ctx.moveTo(cx - sb * lungo / 2, cy - sy * lungo / 2);
        ctx.lineTo(cx + sb * lungo / 2, cy + sy * lungo / 2);
        ctx.stroke();
      }
      // la linea di mezzo: il ventre che striscia, tenue
      ctx.globalAlpha = 0.16 * forza;
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - sb * 4, py - sy * 4);
      ctx.lineTo(px + sb * 4, py + sy * 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function passo() {
      if (!vivo) return;
      if (!misura()) { requestAnimationFrame(passo); return; }  // aspetta il layout
      t += 0.016 * vel;

      // il vento della Torre richiude la sabbia: tutto sbiadisce, sempre
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.018)';
      ctx.fillRect(0, 0, L, A);
      ctx.globalCompositeOperation = 'source-over';

      var v = (1.15 + Math.sin(t * 0.9) * 0.25) * vel;

      if (mira) {
        // il visitatore è passato di qui: adesso il solco è suo
        var da = Math.atan2(mira.y - y, mira.x - x) - ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        ang += da * 0.09;
        v *= 1.6;
      } else {
        ang += deriva(t) * 0.035;
        // sterzata dolce verso casa quando si avvicina al bordo
        var mx = L * 0.5, my = A * 0.55;
        var bordo = Math.min(x, L - x, y * 1.6, (A - y) * 1.6);
        if (bordo < A * 0.28) {
          var verso = Math.atan2(my - y, mx - x) - ang;
          while (verso > Math.PI) verso -= Math.PI * 2;
          while (verso < -Math.PI) verso += Math.PI * 2;
          ang += verso * 0.035;
        }
      }

      x += Math.cos(ang) * v;
      y += Math.sin(ang) * v;

      // se esce davvero, rientra dall'altra parte: non muore mai
      if (x < -40) x = L + 30; if (x > L + 40) x = -30;
      if (y < -40) y = A + 30; if (y > A + 40) y = -30;

      percorso += v;
      var distanza = Math.max(5, A * 0.05);   // ogni quanto stampa un cingolo
      if (percorso >= distanza) {
        percorso = 0;
        cingolo(x, y, ang, 1);
      }

      requestAnimationFrame(passo);
    }

    function unaPassata() {
      // versione ferma, per chi ha chiesto meno movimento: il solco già lasciato
      for (var i = 0; i < 260; i++) {
        t += 0.016;
        ang += deriva(t) * 0.035;
        x += Math.cos(ang) * 1.6;
        y += Math.sin(ang) * 1.6;
        if (x > L + 40) break;
        if (i % 3 === 0) cingolo(x, y, ang, 0.85);
      }
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
      // niente giostra: si disegna il solco già lasciato, e ci si ferma
      requestAnimationFrame(function attendi() {
        if (misura()) unaPassata(); else requestAnimationFrame(attendi);
      });
      return;
    }

    host.addEventListener('pointermove', tocco);
    host.addEventListener('pointerleave', function () { mira = null; });

    // non gira se non la sta guardando nessuno
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (voci) {
        var visibile = voci[0].isIntersecting;
        if (visibile && !vivo) { vivo = true; requestAnimationFrame(passo); }
        vivo = visibile;
      }, { threshold: 0.01 }).observe(host);
    }
    requestAnimationFrame(passo);
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
