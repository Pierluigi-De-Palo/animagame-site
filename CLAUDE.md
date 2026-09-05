# Per chi lavora su questo repo

Sei arrivato su **animagame.io**, il gioco a invito del SYSTEMA 77.
**Non è un social.** Si dice *giocatori, schede, cerchi*.

## Prima di toccare qualsiasi cosa

Leggi **`README.md`**. Porta il canone: il lessico, i colori, cosa è ratificato
dal Direttore e cosa no, i nomi sotto revisione e dove andrà quello definitivo.

E ricorda dove sei: **questo repo è pubblico due volte**, dal sito e da
`raw.githubusercontent.com`. Nessun dato personale, mai — nemmeno in un
commento. I nomi dei giocatori non stanno su una pagina pubblica: ci stanno i
numeri delle carte.

## Prima di spingere

```
node strumenti/collaudo.mjs
```

Controlla i nomi che non si pubblicano, i colori delle altre case (il giallo
dell'agenzia e il ciano di SYSTEMA 77 qui non entrano), le parole del mondo
social, i link morti, lo scivolamento laterale e gli errori in console.
Se non trova Playwright non finge di aver guardato: lo dice.

**E leggi la sezione 6.** Elenca ogni punto in cui il sito dichiara che
qualcosa è acceso o attivo. Il collaudo non può aprirle: le apri tu.

## Le quattro che ci hanno fatto male davvero

1. **Non dichiarare quello che non hai misurato.** Il solco è stato fermo venti
   giorni per la ragione giusta — nessuno l'aveva visto muoversi — e quando è
   stato misurato aveva tre guasti veri.
2. **Uno stato onesto batte un numero inventato.** Il contatore dei punti è un
   trattino finché il Worker non risponde, e va bene così.
3. **Un controllo scritto in una pagina statica non è un controllo.** Il codice
   della carta si verifica dietro, mai qui. E non si scrive mai su
   `localStorage`: è il segreto che apre, non una preferenza.
4. **Semplificare vuol dire togliere**, non riscrivere più corto.

## Il backend non c'è, e si dice

`assets/config.js` è l'unico punto da toccare quando SQUELCH accende qualcosa.
Le rotte sono dichiarate lì e spente. Finché sono spente, le pagine dicono che
sono spente: nessun bottone che ringrazia senza aver spedito niente.

## Fra agenti

Un ramo per agente e per lavoro (`nome/cosa-fa`), e si unisce presto: i rami
che invecchiano si scontrano. Prima di ripartire su un ramo vecchio, portati
dentro `main`.

— lasciato da JUDY, 2026-09-05
