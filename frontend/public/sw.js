// Service worker do app: guarda a "casca" do app para abrir rápido e funcionar sem internet.
// A conversa (API e WebSocket) nunca passa pelo cache — sempre vem do mensageiro.
const CACHE = "basile-app-v1";
const CASCA = ["/", "/chat", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;   // API do mensageiro: direto

  // páginas: rede primeiro (versão nova), cache se estiver sem internet
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // arquivos do app (js, css, ícones): cache primeiro, atualizando por trás
  event.respondWith(
    caches.match(req).then((guardado) => {
      const rede = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() => guardado);
      return guardado || rede;
    })
  );
});
