// sw.js — Guarda la app en el celular para que funcione sin internet
const CACHE = "conversor-xyz-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./estilos.css",
  "./parser.js",
  "./exportar.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

// Al instalar: guardar todos los archivos
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

// Al activar: borrar versiones viejas
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(claves =>
      Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Al pedir un archivo: primero internet (versión más nueva);
// si no hay señal, usar la copia guardada
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});