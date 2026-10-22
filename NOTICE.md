# Componente terțe și licențe

`index.html` conține codul propriu al LocalMind (MIT, vezi `LICENSE`). Bibliotecile terțe își păstrează licențele proprii.
Nicio bibliotecă nu se mai încarcă de pe un CDN fără verificare: ce poate sta pe disc este în `vendor/` (servit din aceeași origine; scripturile încărcate dinamic poartă `integrity`/SRI sha384), iar artefactele mari vin de la URL-uri imuabile și se verifică SHA-256 înainte de folosire.

## În depozit (`vendor/`)

Copii bit-cu-bit ale fișierelor din pachetele npm cu versiune fixată (același conținut pe care îl servește jsDelivr; sumele pot fi verificate cu `npm pack <pachet>@<versiune>`). Textele licențelor sunt în `vendor/<pachet>/LICENSE` unde pachetul le include.

| Componentă | Fișier | Licență | SHA-256 |
|---|---|---|---|
| [transformers.js](https://github.com/huggingface/transformers.js) 4.2.0 (`@huggingface/transformers`) | `vendor/transformers/transformers.min.js` | Apache-2.0 | `e74bd32ed4453369ebb0edcaa27f6bc6204004a949a0233cdb87b62dda8d6978` |
| [pdf.js](https://mozilla.github.io/pdf.js/) 4.4.168 (modul) | `vendor/pdfjs/pdf.min.mjs` | Apache-2.0 | `895c72c332dbd608a07ae54003e5e42741c566ade52ddbd2a00c8e57ffa35d9d` |
| pdf.js 4.4.168 (worker) | `vendor/pdfjs/pdf.worker.min.mjs` | Apache-2.0 | `a7cf858ab0bbe21a00ef438c24a4ef5833c3d05935a294382c8d0773a8958f50` |
| [qrcodejs](https://github.com/davidshimjs/qrcodejs) | `vendor/qrcode.min.js` | MIT | `c541ef06327885a8415bca8df6071e14189b4855336def4f36db54bde8484f36` |
| [KaTeX](https://katex.org/) 0.16.9 (JS) | `vendor/katex@0.16.9/katex.min.js` | MIT | `dc84b296ec3e884de093158f760fd9d45b6c7abe58b5381557f4e138f46a58ae` |
| KaTeX 0.16.9 (CSS; fonturile `fonts/*.woff2` sunt aceleași ca în pachetul npm) | `vendor/katex@0.16.9/katex.min.css` | MIT | `505d5f829022bb7b4f24dfee0aa1141cd7bba67afe411d1240335f820960b5c3` |
| [Mermaid](https://mermaid.js.org/) 11.15.0 | `vendor/mermaid@11.15.0/mermaid.min.js` | MIT | `70137e77bb273bb2ef972b86e8b0400cca8be53cb25bfc45911a186dc98665de` |
| onnxruntime-web 1.26.0-dev.20260416-b7804b056c (încărcător JS, build asyncify — Chrome/Firefox/Edge) | `vendor/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/ort-wasm-simd-threaded.asyncify.mjs` | MIT | `5959c6733039619c9af710d8e1bae8d6e84402787990637be987c2b1bd6c5fa9` |
| onnxruntime-web 1.26.0-dev.20260416-b7804b056c (încărcător JS — Safari) | `vendor/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/ort-wasm-simd-threaded.mjs` | MIT | `5f2cd914554830762579c372d0211614c1e3f40ab3f6c0cfcf0900343229071d` |

Fonturile KaTeX (`vendor/katex@0.16.9/fonts/*.woff2`, 20 de fișiere, ~296 KB; licență SIL OFL 1.1, vezi `vendor/katex@0.16.9/LICENSE` și pagina KaTeX) sunt doar în format woff2; formatele woff/ttf din CSS-ul upstream nu sunt incluse (toate browserele actuale folosesc woff2).

## Descărcate la cerere de la URL-uri imuabile, cu SHA-256 fixat în cod (verificate înainte de folosire; refuzate la nepotrivire)

| Componentă | URL (versiune fixată) | Licență | SHA-256 |
|---|---|---|---|
| ONNX Runtime Web `.wasm` (asyncify, 23,5 MB) | `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/dist/ort-wasm-simd-threaded.asyncify.wasm` | MIT | `e0c0c6d3e73d43b8a249972f8358f845b08cc16fec3c80efafdf8bed40366786` |
| ONNX Runtime Web `.wasm` (Safari, 12,9 MB) | `.../dist/ort-wasm-simd-threaded.wasm` | MIT | `f4f290847a4df02d0b93cdbf39b4b0e71acefbe80573e7e6b9342a7abd7b290a` |
| [Pyodide](https://pyodide.org/) 0.27.0 `pyodide.asm.wasm` (10,1 MB) | `https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.asm.wasm` | MPL-2.0 | `bde4193eb41f6356126d4b21077fee498cef393009eaf27a3a4ba798c571e591` |
| Pyodide 0.27.0 `python_stdlib.zip` (2,4 MB) | `.../full/python_stdlib.zip` | MPL-2.0 / PSF | `1c86cd198ab1de5d9e1ad7fea4c88f1eeca917f059c01764523e7b7acab81dde` |
| Pyodide 0.27.0 `pyodide-lock.json` | `.../full/pyodide-lock.json` | MPL-2.0 | `92bc66cf0095ea9dbbdab7f86dd6a1c51dc0e1a21f8ed90794304dc5f220dc64` |
| Pyodide 0.27.0 `pyodide.js` | `.../full/pyodide.js` (script cu SRI) | MPL-2.0 | sha384 `Jbsp01bfi5QMUu9TQeO+5kXvBTqk5CQkcSgbSP9rSEDuQnaamwBF7YDKrSsBmfXw` |
| Pyodide 0.27.0 `pyodide.asm.js` | `.../full/pyodide.asm.js` (script cu SRI) | MPL-2.0 | sha384 `x34aYlliAQSZQW/nb/j9oCMw6p5aOTZwZ667WQmIgzcGQvSOxxFXkyqJ/leu8EpD` |

Sumele Pyodide au fost obținute din pachetul npm `pyodide@0.27.0` și confirmate identice cu arhiva oficială `pyodide-core-0.27.0.tar.bz2` din release-ul GitHub; jsDelivr servește același release, dar descărcarea directă de pe jsDelivr nu a putut fi comparată din mediul de pregătire (fără acces la jsDelivr). Dacă hash-ul nu s-ar potrivi în producție, aplicația refuză fișierul (Python/ONNX nu pornesc) în loc să-l ruleze. După verificare, fișierele rămân în Cache Storage (`localmind.libs`) și sunt re-verificate la fiecare citire. CSP-ul din pagină permite doar aceste URL-uri exacte de pe `cdn.jsdelivr.net`. Pachete Pyodide suplimentare (numpy etc.) nu sunt permise.

## Descărcate la cerere, fără hash fixat

| Componentă | Când | Notă |
|---|---|---|
| Modele ONNX de la Hugging Face (`huggingface.co`, CDN-urile `*.hf.co`/`*.huggingface.co`) | La încărcarea unui model | Greutăți, tokenizatoare și configurări (date, nu cod). Utilizatorul poate alege orice model `onnx-community/*`, deci nu există o listă finită de hash-uri; la pregătirea acestei versiuni Hugging Face nu era accesibil pentru a fixa revizii. Licențele modelelor sunt cele de pe paginile lor. |
