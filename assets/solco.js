/* IL SOLCO — la firma vivente di SYSTEMA 77
 *
 * Una creatura che non si vede mai attraversa la banda e lascia una traccia.
 * La traccia è un cingolato: due file di trattini, come il solco che la
 * tartaruga lascia sulla sabbia — «simile al passaggio di un piccolo
 * cingolato» (Centro visite di Torre Guaceto, verificato dalla stanza
 * delle verifiche).
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
 *   data-solco-vita   secondi di vita di un cingolo (default: ricavato dalla
 *                     banda, così il solco è lungo uguale a ogni larghezza)
 *
 * Regole di casa rispettate: il nero beve la luce · mai più del 10% acceso ·
 * si ferma da solo se il visitatore ha chiesto meno movimento o se la banda
 * non è sullo schermo.
 *
 * — creato da JUDY, 2026-08-10 · riparato e misurato da JUDY, 2026-08-30
 *
 * ┌─ COSA È CAMBIATO IL 30/08, E PERCHÉ ────────────────────────────────────┐
 * │ 1. LA SBIADITA NON SBIADIVA. La versione del 10/08 richiudeva la sabbia │
 * │    con `destination-out` a `rgba(0,0,0,0.018)`. Su un canvas a 8 bit    │
 * │    quella è una moltiplicazione: alpha ← round(alpha × 0.982). Sotto    │
 * │    alpha ≈ 28 il decremento arrotonda a ZERO e il pixel non scende più. │
 * │    Misurato in Chromium: **plateau esatto ad alpha 25/255**, identico   │
 * │    a tutte e quattro le larghezze. Conseguenza: l'inchiostro si somma   │
 * │    e non si toglie mai — 390px passava da 4,5% (5s) a 49,6% (90s),      │
 * │    cioè cinque volte oltre il tetto di casa del 10%, e saliva ancora.   │
 * │    Non era un colore sbagliato: era una banda che si riempiva di verde. │
 * │ 2. LA CORREZIONE. La sbiadita esce dal canvas ed entra nella memoria:   │
 * │    la traccia è un elenco di cingoli con l'ora di nascita; ogni fotogr. │
 * │    si pulisce e si ridisegna, e il cingolo che ha superato la sua vita  │
 * │    esce dall'elenco. Non c'è arrotondamento che tenga: quando è morto   │
 * │    è morto. L'inchiostro si assesta su un altopiano invece di salire,   │
 * │    e l'altopiano si calcola: cingoli-al-secondo × vita.                 │
 * │    In più una cintura: l'elenco ha un tetto duro (`maxTracce`), quindi  │
 * │    nemmeno il dito del visitatore — che accelera di 1,6× — può          │
 * │    sfondare il 10%.                                                     │
 * │ 3. `unaPassata()` NON ATTRAVERSAVA. Faceva 260 passi da 1,6px = 416px   │
 * │    di corsa massima su una banda che ne misura 1080, senza la sterzata  │
 * │    che tiene la creatura dentro i bordi: chi ha chiesto meno movimento  │
 * │    vedeva un moncone in alto a sinistra. Ora cammina finché non è       │
 * │    uscita davvero dal bordo destro, con la stessa densità e la stessa   │
 * │    sterzata della versione viva.                                        │
 * │ 4. IL DEFAULT ERA #F2E205, il giallo dell'agenzia — vietato dentro il   │
 * │    gioco. Il default ora è il verde del gioco; ogni casa passa il suo   │
 * │    con `data-solco`.                                                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
(function () {
  'use strict';

  var FERMO = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERDE_GIOCO = '#38E08A';   // mai il giallo dell'agenzia qui dentro
  // Quanto è LUNGO il solco, contato in cingoli. Non in secondi: una banda
  // larga e una stretta stampano cingoli a ritmi diversi, e a secondi fissi
  // il telefono si riempiva mentre il desktop restava quasi vuoto — misurato
  // il 30/08: 3,7% contro 0,6%. Contando i cingoli invece che i secondi, la
  // banda è lunga uguale ovunque e la VITA si ricava (vedi `misura`).
  var CINGOLI = 88;

  function Solco(host) {
    var colore = host.getAttribute('data-solco') || VERDE_GIOCO;
    var ratio = parseFloat(host.getAttribute('data-solco-ratio')) || 2.35;
    var vel = parseFloat(host.getAttribute('data-solco-vel')) || 1;
    var vitaDetta = parseFloat(host.getAttribute('data-solco-vita')) || 0;
    var vita = 12;            // ricavata dalla banda in `misura()`, se non è detta

    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');

    var L = 0, A = 0, dpr = 1;
    // la creatura: posizione, direzione, e il conto di quanto ha camminato
    var x = 0, y = 0, ang = 0, t = Math.random() * 1000, percorso = 0;
    var mira = null;          // dove punta il dito del visitatore, se c'è
    var vivo = true, inCorsa = false;

    // il solco: l'elenco dei cingoli vivi, ciascuno con l'ora in cui è nato.
    // È QUI che sta la sbiadita, non nel canvas: la memoria non arrotonda.
    var tracce = [];
    var distanza = 5;         // ogni quanti px si stampa un cingolo
    var maxTracce = 400;      // cintura: il tetto duro all'inchiostro

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

      distanza = Math.max(5, A * 0.05);
      // La creatura va a ≈69 px/s di crociera, quindi stampa 69/distanza
      // cingoli al secondo: perché ne restino vivi CINGOLI, ognuno deve
      // vivere CINGOLI × distanza / 69 secondi. Estremi tenuti a bada.
      vita = vitaDetta || Math.min(30, Math.max(6, CINGOLI * distanza / 69));
      // cintura: il tetto duro all'inchiostro, col margine per il dito del
      // visitatore che accelera la creatura di 1,6×.
      maxTracce = Math.ceil(CINGOLI * 1.7) + 20;
      tracce.length = 0;

      // entra dal bordo sinistro, all'altezza della battigia
      x = -20; y = A * 0.62; ang = -0.15; percorso = 0;
      return true;
    }

    // rumore povero ma organico: somma di seni incommensurabili, niente librerie
    function deriva(k) {
      return Math.sin(k * 0.7) * 0.6 + Math.sin(k * 0.31 + 1.3) * 0.3 +
             Math.sin(k * 1.7 + 2.6) * 0.1;
    }

    // sterzata dolce verso casa quando la creatura si avvicina al bordo.
    // Serve alla versione viva E a quella ferma: senza, `unaPassata()` usciva
    // dalla banda al terzo respiro e non tornava.
    function sterza() {
      var mx = L * 0.5, my = A * 0.55;
      var bordo = Math.min(x, L - x, y * 1.6, (A - y) * 1.6);
      if (bordo >= A * 0.28) return;
      var verso = Math.atan2(my - y, mx - x) - ang;
      while (verso > Math.PI) verso -= Math.PI * 2;
      while (verso < -Math.PI) verso += Math.PI * 2;
      ang += verso * 0.035;
    }

    // due trattini perpendicolari: è il cingolato.
    // `alone` accende il bagliore: costa caro, quindi lo porta solo la testa
    // del solco — dietro resta sabbia opaca, che è anche più vera.
    function cingolo(px, py, dir, forza, alone) {
      var nx = Math.cos(dir + Math.PI / 2), ny = Math.sin(dir + Math.PI / 2);
      var largo = Math.max(3, A * 0.022);   // la carreggiata
      var lungo = largo * 0.72;             // il singolo trattino
      var sb = Math.cos(dir), sy = Math.sin(dir);

      ctx.strokeStyle = colore;
      ctx.lineCap = 'round';
      ctx.shadowColor = colore;
      ctx.shadowBlur = alone ? 6 : 0;

      for (var s = -1; s <= 1; s += 2) {
        var cx = px + nx * largo * s, cy = py + ny * largo * s;
        ctx.globalAlpha = 0.75 * forza;
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

    function lascia(px, py, dir) {
      tracce.push({ x: px, y: py, a: dir, n: t });
      while (tracce.length > maxTracce) tracce.shift();
    }

    // il vento della Torre richiude la sabbia: si ridisegna tutto il solco
    // vivo e si buttano i cingoli scaduti. Nessun arrotondamento, nessun
    // residuo: quando la forza arriva a zero il pixel è nero davvero.
    function disegna() {
      ctx.clearRect(0, 0, L, A);
      var vivi = 0;
      for (var i = 0; i < tracce.length; i++) {
        var c = tracce[i];
        var eta = t - c.n;
        if (eta >= vita) continue;
        if (vivi !== i) tracce[vivi] = c;
        vivi++;
        var u = eta / vita;
        cingolo(c.x, c.y, c.a, (1 - u) * (1 - u * 0.35), u < 0.2);
      }
      tracce.length = vivi;
    }

    function passo() {
      if (!vivo) { inCorsa = false; return; }
      if (!misura()) { requestAnimationFrame(passo); return; }  // aspetta il layout
      t += 0.016 * vel;

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
        sterza();
      }

      x += Math.cos(ang) * v;
      y += Math.sin(ang) * v;

      // se esce davvero, rientra dall'altra parte: non muore mai
      if (x < -40) x = L + 30; if (x > L + 40) x = -30;
      if (y < -40) y = A + 30; if (y > A + 40) y = -30;

      percorso += v;
      if (percorso >= distanza) {
        percorso = 0;
        lascia(x, y, ang);
      }

      disegna();
      requestAnimationFrame(passo);
    }

    // versione ferma, per chi ha chiesto meno movimento: il solco già lasciato.
    // Qui la creatura non vagabonda: ha già ATTRAVERSATO, e quello che si vede
    // è la traccia di una traversata sola, da bordo a bordo.
    // ⚠️ 10/08: erano 260 passi da 1,6px = 416px di corsa massima, su bande
    // che ne misurano fino a 1080 — e senza nessuna rotta, quindi la deriva
    // la faceva girare in tondo. Misurato: attraversava il 5–34% della banda.
    // Ora la deriva resta (l'onda è la firma) ma sopra c'è una rotta verso il
    // bordo destro, e una battigia che tiene la creatura dentro l'inquadratura.
    function unaPassata() {
      var passi = 0;
      var tetto = Math.ceil(L / 0.7) + 500;   // sicurezza, non progetto
      percorso = distanza;                    // il primo cingolo si stampa subito
      while (passi++ < tetto) {
        t += 0.016;
        ang += deriva(t) * 0.035;

        // la rotta: l'angolo torna sempre verso levante, piano
        while (ang > Math.PI) ang -= Math.PI * 2;
        while (ang < -Math.PI) ang += Math.PI * 2;
        ang -= ang * 0.05;

        // la battigia: sopra e sotto non si esce
        if (y < A * 0.22) ang += (0.5 - ang) * 0.08;
        if (y > A * 0.86) ang += (-0.5 - ang) * 0.08;

        var v = 1.15 + Math.sin(t * 0.9) * 0.25;
        x += Math.cos(ang) * v;
        y += Math.sin(ang) * v;
        percorso += v;
        if (percorso >= distanza) {
          percorso = 0;
          cingolo(x, y, ang, 0.85, false);
        }
        if (x > L + 30) break;
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

    function accendi() {
      if (inCorsa) return;
      inCorsa = true;
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
