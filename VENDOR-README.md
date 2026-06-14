# LocalMind — vendorizat (biblioteci găzduite local)

Acest pachet rezolvă riscul de **supply-chain** pentru LocalMind: codul JavaScript care
rulează în pagina ta (și are acces total la DOM, `localStorage`, etc.) nu mai e
împrumutat de pe un CDN terț la fiecare deschidere, ci e servit din folderul tău.

> Pornit de la `index.html` deja securizat (fix XSS `_sanitizeSvg` + `conv.title`,
> plus CSP) din pachetul de remediere. Aici s-au adăugat **doar** modificările de
> vendorizare.

---

## Deploy (turnkey — zero pași)

Copiază folderul `LocalMind/` peste cel din repo (cu tot cu `vendor/`) și gata.
Structura:

```
LocalMind/
├─ index.html                          ← cele 3 importuri arată acum local
└─ vendor/
   ├─ transformers/
   │  └─ transformers.min.js           (545 KB)
   └─ pdfjs/
      ├─ pdf.min.mjs                    (319 KB)
      └─ pdf.worker.min.mjs            (1329 KB)
```

Importurile fiind ESM (`<script type=module>` implicit, prin `import` la nivel de top),
căile `./vendor/...` se rezolvă relativ la `index.html` — funcționează identic pe
`chiuta.github.io/LocalMind/` și pe orice subdomeniu.

---

## Ce s-a modificat exact (3 linii)

**1. transformers.js** — `index.html` linia ~2331
```diff
  import { pipeline, TextStreamer, env, ModelRegistry }
-   from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js';
+   from './vendor/transformers/transformers.min.js';
```

**2. PDF.js (modul)** — linia ~3731
```diff
-     _pdfMod = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
+     _pdfMod = await import('./vendor/pdfjs/pdf.min.mjs');
```

**3. PDF.js (worker)** — linia ~3733
```diff
      _pdfMod.GlobalWorkerOptions.workerSrc =
-       'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
+       './vendor/pdfjs/pdf.worker.min.mjs';
```

De unde provin fișierele (jsDelivr servește pachetele npm verbatim, deci sunt identice
bit-cu-bit cu ce încărca codul înainte):
- `transformers.min.js` ← npm `@huggingface/transformers@4.2.0`, `dist/transformers.min.js`
- `pdf.min.mjs` + `pdf.worker.min.mjs` ← npm `pdfjs-dist@4.4.168`, `build/`

---

## Ce încă vine de pe rețea (intenționat)

| Resursă | De unde | De ce rămâne remote |
|---|---|---|
| **Binarul ONNX Runtime (`.wasm`)** | `cdn.jsdelivr.net/npm/onnxruntime-web@…` | transformers.js îl cere singur la prima inferență; calea e construită intern. |
| **Modelele LLM** (sute de MB fiecare) | `huggingface.co` | Sunt prea mari/multe ca să le incluzi; `env.allowLocalModels=false` le ia la cerere. |

Ambele sunt **deja permise** în CSP-ul actual (`connect-src`/`script-src` includ
`cdn.jsdelivr.net` și `huggingface.co`). Deci pachetul merge ca atare: UI + bibliotecile
sunt locale, WASM-ul ONNX și modelele se descarcă (și se cache-uiesc în browser) la prima
folosire.

---

## (Opțional, avansat) Offline 100% — vendorizează și WASM-ul ONNX

Rulează **pe mașina ta** (ai bandă și acces la jsDelivr; eu nu am avut, din mediul de
lucru). Versiunea de onnxruntime-web pe care o cere transformers@4.2.0 este
`1.26.0-dev.20260416-b7804b056c`.

```bash
cd LocalMind/vendor
mkdir -p ort && cd ort
V="1.26.0-dev.20260416-b7804b056c"
# fișierele cerute (non-Safari folosește varianta .asyncify; pune-le pe ambele ca să meargă peste tot)
for f in ort-wasm-simd-threaded.asyncify.mjs ort-wasm-simd-threaded.asyncify.wasm \
         ort-wasm-simd-threaded.mjs ort-wasm-simd-threaded.wasm \
         ort-wasm-simd-threaded.jsep.mjs ort-wasm-simd-threaded.jsep.wasm; do
  curl -fsSL "https://cdn.jsdelivr.net/npm/onnxruntime-web@${V}/dist/${f}" -o "$f" && echo "✓ $f" || echo "—  $f (poate lipsi pentru versiunea ta)"
done
```

Apoi spune-i lui transformers.js să le ia local — adaugă **după** `env.useBrowserCache`
(în jurul liniei 2334 din `index.html`):
```js
env.backends.onnx.wasm.wasmPaths = './vendor/ort/';
```

**Răsplata:** poți strânge CSP-ul. În meta CSP din `<head>`, scoate
`https://cdn.jsdelivr.net` din `script-src` și din `connect-src`. Dacă vendorizezi și
modelele (vezi mai jos), scoți și `huggingface.co` → rămâne `connect-src 'self'` curat.

> **Modele offline (extra):** descarcă un model din HuggingFace (ex. format ONNX),
> pune-l în `vendor/models/<org>/<model>/`, setează `env.allowLocalModels = true` și
> `env.localModelPath = './vendor/models/'`. Atenție la dimensiune (sute de MB).

---

## Verificare

```bash
# cele 3 biblioteci sunt locale (zero rezultate = corect)
grep -nE "jsdelivr.*(transformers@|pdfjs-dist@)" LocalMind/index.html || echo "OK: biblioteci locale"
# fișierele vendor există
ls -l LocalMind/vendor/transformers/ LocalMind/vendor/pdfjs/
```
Test funcțional: deschide pagina, încarcă un model mic (se descarcă o dată, apoi merge
din cache), trimite un mesaj, încarcă un PDF — toate fără ca importurile de bibliotecă
să mai atingă jsDelivr (vizibil în tab-ul Network al DevTools).
