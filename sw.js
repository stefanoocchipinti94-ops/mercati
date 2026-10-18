/* Service worker dell'app Mercati: funzionamento offline e notifiche push. */

const VERSIONE = "mercati-1.0.0";
const GUSCIO = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icone/apple-touch-icon.png",
  "./icone/icona-192.png",
  "./icone/icona-512.png",
];
const CACHE_CARATTERI = "mercati-caratteri";

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSIONE).then((cache) => cache.addAll(GUSCIO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== VERSIONE && n !== CACHE_CARATTERI).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== "GET") return;
  const url = new URL(richiesta.url);

  // I dati arrivano da GitHub con il token: mai in cache qui (l'app tiene l'ultima copia per l'offline)
  if (url.hostname === "api.github.com") return;

  // Caratteri di Google Fonts: dalla cache, aggiornati in background
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    evento.respondWith(
      caches.open(CACHE_CARATTERI).then(async (cache) => {
        const salvata = await cache.match(richiesta);
        const rete = fetch(richiesta).then((risposta) => {
          if (risposta.ok || risposta.type === "opaque") cache.put(richiesta, risposta.clone());
          return risposta;
        }).catch(() => salvata);
        return salvata || rete;
      })
    );
    return;
  }

  // Guscio dell'app: prima la rete (così gli aggiornamenti arrivano subito), poi la cache se si è offline
  if (url.origin === self.location.origin) {
    evento.respondWith(
      fetch(richiesta)
        .then((risposta) => {
          if (risposta.ok) {
            const copia = risposta.clone();
            caches.open(VERSIONE).then((cache) => cache.put(richiesta, copia));
          }
          return risposta;
        })
        .catch(async () => (await caches.match(richiesta, { ignoreSearch: true })) ||
          (richiesta.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    );
  }
});

self.addEventListener("push", (evento) => {
  let dati = {};
  try {
    dati = evento.data ? evento.data.json() : {};
  } catch (e) {
    dati = { title: "Mercati", body: evento.data ? evento.data.text() : "" };
  }
  const titolo = dati.title || "Mercati";
  const opzioni = {
    body: dati.body || "",
    tag: dati.tag || undefined,
    icon: "icone/icona-192.png",
    badge: "icone/icona-192.png",
    data: { url: dati.url || "./#oggi", ts: dati.ts || null },
  };
  evento.waitUntil(
    Promise.all([
      self.registration.showNotification(titolo, opzioni),
      self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(1).catch(() => {}) : Promise.resolve(),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((finestre) =>
        finestre.forEach((f) => f.postMessage({ tipo: "push", ts: dati.ts || null }))),
    ])
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const dati = evento.notification.data || {};
  const destinazione = new URL(dati.url || "./#oggi", self.registration.scope);
  if (dati.ts) destinazione.searchParams.set("ts", dati.ts);
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (finestre) => {
      for (const finestra of finestre) {
        if (finestra.url.startsWith(self.registration.scope)) {
          await finestra.focus();
          finestra.postMessage({ tipo: "apri", url: destinazione.href, ts: dati.ts || null });
          return;
        }
      }
      return self.clients.openWindow(destinazione.href);
    })
  );
});
