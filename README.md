# Mercati

Web app per iPhone che mostra il report sui mercati: il giornaliero prima dell'apertura, gli aggiornamenti orari, le idee aperte e l'archivio. Funziona anche offline e manda le notifiche push.

Questo repository contiene solo il codice dell'app, pubblicato con GitHub Pages: https://stefanoocchipinti94-ops.github.io/mercati/

I dati restano nel repository privato `report-mercati`. L'app li legge con un token personale di GitHub, che resta salvato solo sul dispositivo.

## Installazione sull'iPhone

1. Apri l'indirizzo dell'app in Safari.
2. Tocca Condividi e poi «Aggiungi alla schermata Home».
3. Apri Mercati dall'icona e segui le istruzioni per collegare il repository. Servono un token *fine-grained* limitato a `report-mercati`, con **Contents: Read and write**.
4. In Impostazioni tocca «Attiva le notifiche», poi «Invia una notifica di prova».

## Come funziona

- `index.html`: l'app. Legge `data/app/feed.json` dal repository privato tramite l'API di GitHub.
- `sw.js`: service worker. Gestisce il funzionamento offline e le notifiche push.
- `manifest.webmanifest` e `icone/`: installazione sulla schermata Home.

Le notifiche le invia il workflow di `report-mercati` con il protocollo Web Push, firmate con chiavi VAPID. Non passano da servizi a pagamento. Quando attivi le notifiche, l'app iscrive il dispositivo scrivendo un file in `data/app/iscrizioni/` del repository privato.

Il sorgente di riferimento sta nella cartella `app/` di `report-mercati`; questo repository ne è la copia pubblicata.
