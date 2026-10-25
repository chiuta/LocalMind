/* fff-pwa v1 · generat de fff-kit/pwa/pwa.mjs · fără cereri externe, fără importScripts */
'use strict';
var SLUG = "localmind", VERSION = "120.2.14";
var PREFIX = 'fff-' + SLUG + '-', CACHE = PREFIX + VERSION;   // versiunea nu conține '-', deci sufixul de după ultimul '-' e versiunea
var SHELL = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  /* biblioteci vendorizate sub 1,5 MB (offline după prima vizită); mermaid (3,3 MB) intră în cache la prima folosire */
  './vendor/transformers/transformers.min.js',
  './vendor/pdfjs/pdf.min.mjs',
  './vendor/pdfjs/pdf.worker.min.mjs',
  './vendor/qrcode.min.js',
  './vendor/katex@0.16.9/katex.min.js',
  './vendor/katex@0.16.9/katex.min.css',
  './vendor/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/ort-wasm-simd-threaded.asyncify.mjs',
  './vendor/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/ort-wasm-simd-threaded.mjs',
  './vendor/katex@0.16.9/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Caligraphic-Bold.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Caligraphic-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Fraktur-Bold.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Fraktur-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Main-BoldItalic.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Math-BoldItalic.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_SansSerif-Bold.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_SansSerif-Italic.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_SansSerif-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Script-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Size4-Regular.woff2',
  './vendor/katex@0.16.9/fonts/KaTeX_Typewriter-Regular.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    var c = await caches.open(CACHE);
    var r = await fetch('./index.html', {cache: 'reload'});
    if (!r.ok) throw new Error('index.html ' + r.status);
    await c.put('./index.html', r.clone());
    await c.put('./', r);
    await Promise.all(SHELL.map(function (u) { return c.add(new Request(u, {cache: 'reload'})).catch(function () {}); }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) {
      var i = k.lastIndexOf('-');
      return i >= 0 && k.slice(0, i + 1) === PREFIX && k !== CACHE;   // doar cache-urile acestei aplicații
    }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

// Cache-first cu revalidare în fundal (stale-while-revalidate) pentru resursele de aceeași origine.
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || /\/sw\.js$/.test(u.pathname)) return;
  var nav = r.mode === 'navigate';
  var key = nav ? new Request(u.origin + u.pathname) : r;
  function update() {
    return fetch(nav ? u.href : r, {cache: 'no-cache'}).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic' && !res.redirected) {
        var cp = res.clone();
        return caches.open(CACHE).then(function (c) { return c.put(key, cp); }).then(function () { return res; });
      }
      return res;
    });
  }
  e.respondWith(caches.open(CACHE).then(function (c) { return c.match(key); }).then(function (hit) {
    if (hit) { e.waitUntil(update().catch(function () {})); return hit; }
    return update().catch(function () {
      if (nav && /(\/|index\.html)$/.test(u.pathname)) return caches.open(CACHE).then(function (c) { return c.match('./index.html'); });
      return Response.error();
    });
  }));
});
