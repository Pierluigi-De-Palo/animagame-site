#!/usr/bin/env node
/* ◉ IL GUARDIANO — il collaudo della casa, in un file solo.
 *
 *   node strumenti/collaudo.mjs
 *
 * ── PERCHÉ ESISTE ────────────────────────────────────────────────────────
 * Fra agosto e settembre 2026 lo stesso errore è tornato quattro volte, e
 * ogni volta con una faccia diversa:
 *
 *   · un'animazione dichiarata pronta e ferma venti giorni, perché nessuno
 *     l'aveva mai vista muoversi;
 *   · un meteo dato per «funziona già» mentre la sua cornice era spenta;
 *   · una radio e un dominio scritti in pagina come vivi, mai aperti da
 *     nessuno;
 *   · una chiave a pagamento lasciata in chiaro in un repo pubblico.
 *
 * Nessuno di questi era distrazione. Erano tutti la stessa cosa: qualcuno
 * ha DICHIARATO invece di MISURARE, e nessuno dopo di lui ha avuto un modo
 * rapido per accorgersene.
 *
 * Questo file è quel modo. Non sostituisce l'occhio di nessuno: fa le
 * domande che ci siamo dimenticati di farci, e le fa sempre, a chiunque
 * lanci il comando — persona o agente.
 *
 * ── COME È FATTO ─────────────────────────────────────────────────────────
 * Nessuna dipendenza per la parte statica: gira con Node e basta.
 * La parte col browser (scivolamento laterale, errori in console) usa
 * Playwright SE c'è; se non c'è, il collaudo NON finge di averla fatta —
 * lo dice e passa oltre. È la stessa regola che vale per le pagine.
 *
 * ── LA REGOLA CHE NON PUÒ CONTROLLARE ────────────────────────────────────
 * L'ultima sezione elenca ogni punto in cui il sito dichiara che qualcosa
 * è acceso, attivo o vivo. Non le verifica: non può. Le mette in fila
 * perché qualcuno le apra con i propri occhi.
 * È l'unica sezione che non fallisce mai, ed è la più importante.
 *
 * — lasciato da JUDY al systema, 2026-09-05
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ═══ LE REGOLE DI QUESTA CASA ══════════════════════════════════════════
   Ogni casa della galassia ha le sue: se copi questo file altrove, cambia
   SOLO questo blocco. Il resto è uguale ovunque. */
const CASA = {
  nome: 'ANIMA GAME · animagame.io',

  // Nomi sotto revisione o vietati. Si cercano OVUNQUE nei file spediti,
  // commenti HTML compresi: anche quelli viaggiano, sul sito e su raw.
  nomiVietati: [
    { cosa: 'kiroshi',    perche: 'nome preso da un videogioco altrui — rischio di marchio' },
    { cosa: 'braindance', perche: 'nome preso da un videogioco altrui — rischio di marchio' },
  ],

  // I colori delle altre case. Qui il gioco è VERDE #38E08A su nero, e il
  // verde è accento — mai fondale. Il giallo è dell'agenzia e il ciano è di
  // SYSTEMA 77: dentro il gioco non entrano.
  coloriVietati: [
    { cosa: '#F2E205', perche: 'il giallo dell\'agenzia — vietato dentro il gioco' },
    { cosa: '#16E0DC', perche: 'il ciano di SYSTEMA 77 — privato dell\'agenzia' },
  ],

  // Le parole del mondo social, vietate dal Direttore. Cercate solo nel
  // testo VISIBILE: nei commenti si possono nominare per dire che non si usano.
  // ⚠️ «mi piace» NON è in elenco di proposito: il gioco lo nomina apposta,
  //    per dire che qui non c'è. Vietare una parola che serve a rifiutarla
  //    sarebbe un controllo che non capisce cosa sta leggendo.
  lessicoVietato: [
    { cosa: 'forum',      perche: 'si dice: il falò' },
    { cosa: 'thread',     perche: 'si dice: il falò' },
    { cosa: 'feed',       perche: 'qui non scorre niente' },
    { cosa: 'social',     perche: 'ANIMA GAME non è un social' },
    { cosa: 'follower',   perche: 'si dice: giocatori, cerchi' },
    { cosa: 'utente',     perche: 'si dice: giocatore' },
    { cosa: 'utenti',     perche: 'si dice: giocatori' },
    { cosa: 'profilo',    perche: 'si dice: scheda' },
    { cosa: 'account',    perche: 'si dice: carta' },
    { cosa: 'moderatori', perche: 'nel falò a spegnere è uno solo' },
  ],

  // Cartelle e file che il collaudo non guarda.
  saltare: ['.git', 'node_modules', 'strumenti'],
};

/* ═══ attrezzi ══════════════════════════════════════════════════════════ */

const G = { verde: '\x1b[32m', rosso: '\x1b[31m', giallo: '\x1b[33m',
            muto: '\x1b[90m', forte: '\x1b[1m', fine: '\x1b[0m' };
let guai = 0;
const ok   = (t) => console.log(`  ${G.verde}✓${G.fine} ${t}`);
const male = (t) => { guai++; console.log(`  ${G.rosso}✗${G.fine} ${t}`); };
const nota = (t) => console.log(`  ${G.muto}·${G.fine} ${t}`);
const titolo = (t) => console.log(`\n${G.forte}── ${t} ──${G.fine}`);

function tuttiIFile(dir = RADICE, trovati = []) {
  for (const voce of readdirSync(dir)) {
    if (CASA.saltare.includes(voce)) continue;
    const p = join(dir, voce);
    if (statSync(p).isDirectory()) tuttiIFile(p, trovati);
    else trovati.push(p);
  }
  return trovati;
}

const relativo = (p) => p.slice(RADICE.length + 1);
const spediti = tuttiIFile().filter((p) => /\.(html|css|js|mjs|json|xml|txt|md)$/i.test(p));
const pagine  = spediti.filter((p) => p.endsWith('.html'));

/* Il testo che un visitatore legge davvero: via script, stili e commenti. */
function testoVisibile(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

console.log(`\n${G.forte}◉ IL GUARDIANO${G.fine} ${G.muto}— ${CASA.nome}${G.fine}`);
console.log(`${G.muto}  ${pagine.length} pagine, ${spediti.length} file spediti${G.fine}`);

/* ═══ 1 · I NOMI CHE NON SI PUBBLICANO ══════════════════════════════════
   Compresi i commenti HTML: questo repo è pubblico due volte, dal sito e
   da raw.githubusercontent.com. Un nome in un commento è un nome
   pubblicato. */
titolo('1 · i nomi che non si pubblicano');
if (!CASA.nomiVietati.length) nota('nessun nome in elenco per questa casa');
for (const { cosa, perche } of CASA.nomiVietati) {
  const dentro = spediti.filter((p) => new RegExp(cosa, 'i').test(readFileSync(p, 'utf8')));
  if (dentro.length) male(`«${cosa}» in ${dentro.map(relativo).join(', ')} — ${perche}`);
  else ok(`«${cosa}» non compare in nessun file`);
}

/* ═══ 2 · I SEGRETI ═════════════════════════════════════════════════════
   Una pagina statica che chiama un'API dal browser NON PUÒ tenere segreta
   una chiave: chiunque apra il sorgente la legge. Se qui sotto compare
   qualcosa, non è «da nascondere meglio» — è da limitare per dominio o da
   spostare dietro un worker. */
titolo('2 · chiavi e segreti in chiaro');
const CHIAVE = /(api[-_]?key|apikey|secret|token|password|passwd|bearer)\s*[:=]\s*['"`]([^'"`\s]{12,})['"`]/gi;
let segreti = 0;
for (const p of spediti) {
  const testo = readFileSync(p, 'utf8');
  for (const m of testo.matchAll(CHIAVE)) {
    // Un valore vuoto o palesemente finto non è un segreto.
    if (/^(null|undefined|xxx+|tuo|your|<.*>|\.\.\.|inserisci)/i.test(m[2])) continue;
    segreti++;
    const riga = testo.slice(0, m.index).split('\n').length;
    male(`${relativo(p)}:${riga} — sembra una chiave in chiaro (${m[1]})`);
  }
}
if (!segreti) ok('nessuna chiave in chiaro nei file spediti');
else nota('una chiave nel browser non si può nascondere: si limita per dominio, o passa da un worker');

/* ═══ 3 · GLI INDIRIZZI CHE NON PORTANO DA NESSUNA PARTE ════════════════ */
titolo('3 · link interni e ancore');
let rotti = 0, ancoreMorte = 0;
for (const p of pagine) {
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/href=["']([^"']+)["']/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|tel:|#|\/\/)/i.test(href)) continue;
    const [file, ancora] = href.split('#');
    if (file) {
      const meta = join(RADICE, file);
      if (!existsSync(meta)) { rotti++; male(`${relativo(p)} → ${href} (il file non c'è)`); continue; }
      if (ancora && meta.endsWith('.html')) {
        const dentro = readFileSync(meta, 'utf8');
        if (!new RegExp(`id=["']${ancora}["']`).test(dentro)) {
          ancoreMorte++; male(`${relativo(p)} → ${href} (l'ancora non esiste)`);
        }
      }
    }
  }
}
if (!rotti && !ancoreMorte) ok('ogni link interno porta a un file che esiste, ogni ancora a un id che esiste');

/* ═══ 4 · I COLORI DI UN'ALTRA CASA ═════════════════════════════════════ */
titolo('4 · colori vietati');
if (!CASA.coloriVietati.length) nota('nessun colore vietato in questa casa');
for (const { cosa, perche } of CASA.coloriVietati) {
  // Solo dove il colore è USATO, non dove è spiegato in un commento.
  const dentro = spediti.filter((p) => {
    const t = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
    return new RegExp(cosa, 'i').test(t);
  });
  if (dentro.length) male(`${cosa} usato in ${dentro.map(relativo).join(', ')} — ${perche}`);
  else ok(`${cosa} non è usato da nessuna parte`);
}

/* ═══ 5 · LE PAROLE CHE QUESTA CASA NON DICE ════════════════════════════ */
titolo('5 · lessico');
if (!CASA.lessicoVietato.length) nota('nessuna parola vietata in questa casa');
for (const { cosa, perche } of CASA.lessicoVietato) {
  const dentro = pagine.filter((p) =>
    new RegExp(`\\b${cosa}\\b`, 'i').test(testoVisibile(readFileSync(p, 'utf8'))));
  if (dentro.length) male(`«${cosa}» visibile in ${dentro.map(relativo).join(', ')} — ${perche}`);
  else ok(`«${cosa}» non si legge in nessuna pagina`);
}

/* ═══ 6 · QUELLO CHE IL SITO DICHIARA VIVO ══════════════════════════════
   Questa sezione non fallisce mai, e va letta lo stesso — anzi, va letta
   per prima. Ogni riga è una promessa fatta a chi arriva: qualcuno deve
   averla aperta con i propri occhi, oggi, prima di diffondere il link.
   È esattamente il passo che è mancato quattro volte — e in questa casa
   ci sono anche i due strumenti spenti che aspettano SQUELCH.
   Pesca larga di proposito: prende anche qualche «vivo» innocente di
   passaggio. Una riga in più da scorrere costa dieci secondi; una promessa
   sfuggita costa la fiducia del primo sconosciuto che ci clicca sopra. */
titolo('6 · quello che dichiariamo vivo — da aprire a mano');
const VIVO = /\b(acces[oa]|attiv[oa]|viv[oa]|funziona gi[àa]|si guarda adesso|guardalo adesso)\b/gi;
const promesse = [];
for (const p of pagine) {
  const testo = testoVisibile(readFileSync(p, 'utf8'));
  for (const m of testo.matchAll(VIVO)) {
    const attorno = testo.slice(Math.max(0, m.index - 60), m.index + 70).trim();
    promesse.push(`${relativo(p)} — «…${attorno}…»`);
  }
}
if (!promesse.length) nota('il sito non dichiara vivo niente');
else {
  console.log(`  ${G.giallo}${promesse.length} promesse di funzionamento.${G.fine} Aprile una per una:`);
  for (const r of promesse) nota(r);
}

/* ═══ 7 · IL BROWSER, SE C'È ════════════════════════════════════════════ */
titolo('7 · scivolamento laterale ed errori in console');
const LARGHEZZE = [320, 390, 768, 1024, 1280, 1600];
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { /* non installato */ }

if (!chromium) {
  console.log(`  ${G.giallo}NON COLLAUDATO${G.fine} — Playwright non c'è in questo ambiente.`);
  nota('per farlo: npm i -D playwright  ·  e poi rilancia');
  nota('questo collaudo non finge di aver guardato: dice che non ha guardato');
} else {
  const eseguibile = process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium';
  const b = await chromium.launch(existsSync(eseguibile) ? { executablePath: eseguibile } : {});
  for (const p of pagine) {
    const male_a = [], solco_a = [];
    for (const L of LARGHEZZE) {
      const ctx = await b.newContext({ viewport: { width: L, height: 900 } });
      // Fuori non si esce: il collaudo misura le pagine, non la rete.
      await ctx.route('**', (r) => r.request().url().startsWith('file:') ? r.continue() : r.abort());
      const pg = await ctx.newPage();
      const errori = [];
      pg.on('pageerror', (e) => errori.push(e.message));
      pg.on('console', (m) => {
        if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errori.push(m.text());
      });
      await pg.goto('file://' + p, { waitUntil: 'load' });
      await pg.waitForTimeout(400);
      const misura = await pg.evaluate(() => ({
        largo: document.documentElement.scrollWidth, vista: window.innerWidth,
      }));
      if (misura.largo > misura.vista + 1) male_a.push(`${L}px scivola (${misura.largo}>${misura.vista})`);
      // IL SOLCO, SENZA GUARDARLO (05/09). La banda scrive tre numeri una volta
      // al secondo: dopo tre secondi si leggono. Luce sopra il 10% = rosso.
      if (relativo(p) === 'index.html' && (L === 390 || L === 1280)) {
        await pg.waitForTimeout(3200);
        const s = await pg.evaluate(() => (window.SOLCO && window.SOLCO[0]) || null);
        if (!s) male_a.push(`${L}px il solco non scrive i suoi numeri`);
        else if (s.luce > 10) male_a.push(`${L}px il solco accende il ${s.luce}% della banda (tetto 10%)`);
        else solco_a.push(`${L}px luce ${s.luce}% · cingoli ${s.cingoli} · fps ${s.fps}`);
      }
      if (errori.length) male_a.push(`${L}px ${errori[0].slice(0, 50)}`);
      await ctx.close();
    }
    if (male_a.length) male(`${relativo(p)} — ${male_a.join(' · ')}`);
    else ok(`${relativo(p)} — pulita a ${LARGHEZZE.join('/')}px`);
    for (const r of solco_a) ok(`il solco, misurato a ${r}`);
  }
  await b.close();
}

/* ═══ il verdetto ═══════════════════════════════════════════════════════ */
console.log();
if (guai) {
  const c = guai === 1 ? 'cosa da sistemare' : 'cose da sistemare';
  console.log(`${G.rosso}${G.forte}✗ ${guai} ${c} prima di spingere.${G.fine}\n`);
  process.exit(1);
}
console.log(`${G.verde}${G.forte}✓ Il guardiano non ha trovato niente.${G.fine}`);
console.log(`${G.muto}  Restano le promesse della sezione 6: quelle le apre una persona.${G.fine}\n`);
