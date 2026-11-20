# Jurnal de modificări

## 2.4.4 — 2026-11-20

- Reparat: așezarea mesajelor în conversație. Ora, butoanele (✏ 🔊 ☆ 📌), timpul de citire și „Răspunsuri rapide” sunt copii ai aceluiași rând flex ca avatarul și corpul mesajului, deci îl strângeau: într-o conversație încărcată, corpul mesajului AI avea 278 px la 1280 px, 83 px la 768 px și 0 px la 375 px (mesajul nu se vedea), iar chip-urile „Răspunsuri rapide” erau întinse pe toată înălțimea mesajului. Acum avatarul stă pe margine, corpul are rândul lui pe toată lățimea, iar ora, butoanele, timpul de citire și chip-urile trec pe rândurile următoare, aliniate cu corpul (modul compact și modul de citire au indentări proprii). Test nou: `tests/message-layout.test.mjs` (63 de verificări la 375, 768, 1280 și 1920 px și în modul compact; pe versiunea 2.4.3 pică 28 dintre ele).
- KaTeX actualizat de la 0.16.9 la 0.16.47: noile fișiere (`katex.min.js`, `katex.min.css`, cele 20 de fonturi `woff2` și `LICENSE`) sunt în `vendor/katex@0.16.47/`, iar căile și sumele de control SRI din `index.html`, lista de precache din `sw.js`, `NOTICE.md` (SHA-256), `VENDOR-README.md` și descrierile stării curente din cele 8 `README`-uri au fost puse în pas. Motiv: `npm audit` raportează pentru 0.16.9 șase avize (cinci moderate, unul scăzut: GHSA-3wc5-fcw2-2329, GHSA-f98w-7cxr-ff2h, GHSA-cvr6-37gx-v8wc, GHSA-cg87-wmx4-v546, GHSA-64fm-8hw2-v72w, GHSA-238p-pmpm-9mq7); pentru 0.16.47 rămâne doar unul scăzut (GHSA-238p-pmpm-9mq7, remediat abia în 0.18.2, care nu e adoptat). Opțiunea `trust` a KaTeX nu este activată în aplicație.
- Verificat (KaTeX): fișierele 0.16.9 din depozit erau identice cu cele din pachetul oficial, iar cele noi provin din pachetul npm 0.16.47 (integritate verificată față de registru). Pe 42 de formule randate în Chrome cu ambele versiuni, 28 ies identice la nivel de pixel, iar 14 diferă cu sub-pixeli sau cel mult 5 px în înălțime, fără diferențe vizibile la inspecție. Într-o conversație încărcată, în pagina servită prin http, KaTeX 0.16.47 se încarcă la nevoie cu SRI acceptat, formulele se randează (9 elemente `.katex`, la fel ca pe 0.16.9), fonturile vin din `vendor/`, o formulă greșită dă „⚠ KaTeX: …” fără excepție, iar `\href{javascript:…}` nu produce legătură; captura paginii e identică la pixel cu cea de pe 0.16.9 (înainte de reparația de așezare). Testele proprii ale aplicației trec.
- Neverificat: exploatabilitatea avizelor în această aplicație (cu sarcinile de probă încercate nu s-a reprodus nicio blocare pe 0.16.9: ambele versiuni se opresc cu „Too many expansions”); mesaje generate de un model real (WebGPU/WASM indisponibile în mediul de verificare: conversațiile au fost încărcate din stocarea locală, prin același `appendMsg` ca la mesajele generate); rularea pe browsere vechi reale (Chrome 55, Firefox 52, Safari 10.1) și pe dispozitive reale.

## 2.4.3 — 2026-11-20

- fff-kit 1.8.1: când `localStorage`/`sessionStorage` aruncă sau lipsesc (cookie-uri și date de site blocate, WebView fără stocare, `<iframe sandbox>`), kitul pune în loc o stocare în memorie, iar pagina pornește în loc să se oprească; datele nu se păstrează după închiderea paginii
- fff-kit 1.8.1: ghidajul care mărește controalele mici la 44 px măsoară acum și lățimea corpului paginii și a părintelui, deci un rând de butoane nu mai poate ieși din ecran (grupul rămâne neatins când mărirea l-ar depăși)

## 2.4.2 — 2026-11-17

- Compatibilitate cu browsere mai vechi (Chrome/Edge 55+, Firefox 52+, Safari 10.1+/iOS 10.3+): kitul 1.8.0 aduce stratul de compatibilitate (rezerve pentru API-urile care lipsesc în motoarele vechi), iar sintaxa JavaScript mai nouă decât ES2017 a fost înlocuită cu forme echivalente acolo unde exista; expresiile regulate noi și `import()` trec prin rezerve. Fără modificări de funcționalitate intenționate. Verificat cu parser ES2017 și într-un motor vechi simulat, nu pe dispozitive reale.

## 2.4.1 — 2026-11-15

- Nou: butoane de distribuire pe rețele sociale (vertical, pe marginea din stânga; fără scripturi externe, doar linkuri deschise la clic); bara de zoom cu lupă și „potrivire ecran” revine pe marginea din dreapta, centrată pe verticală; corectat afișarea suprapusă la zoom mare (panourile cu înălțimi în vh/vw nu mai ies din ecran).

## 2.4.0 — 2026-11-15

- Nou: accesibilitate pe toate ecranele — butonul „Aa” (mărimea textului, contrast ridicat, fără animații, text lizibil, linkuri subliniate, citire cu voce), săgeata „Înapoi sus” și „Sari la conținut”; fereastra se potrivește mereu ecranului; zoom-ul cu lupă și „potrivire ecran” stau acum pe marginea din stânga (fff-kit 1.6.0).

## 2.3.8 — 2026-11-15

- Nou: texturi fractale hiper-detaliate (fff-texturi 1.1.2) — fundalul și suprafețele mari (carduri, panouri, antete, butoane; filele și dialogurile ascunse la încărcare, când se deschid) primesc un material generat local (WebGL2, fără rețea și fără imagini), care se repetă fără cusătură; culorile aplicației rămân ale ei. Se oprește din dialogul „Transparență” sau cu `?notex=1`.

## 2.3.1 — 2026-11-03

- Corectat: modelele Llama 3.2 1B și 3B au fost redenumite la sursă (`onnx-community/Llama-3.2-1B-Instruct-ONNX`, `…-3B-Instruct-ONNX`); lista de modele, verificarea de integritate și comenzile rapide Alt+4/Alt+5 folosesc numele noi (cele vechi nu se mai descărcau). Descoperit de monitorizarea surselor (issue #16 din hub).

## 2.3.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.3.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — după orice export de fișier (GPX, ICS, CSV, Markdown) apare butonul «Trimite la…» către aplicațiile compatibile, iar importul de fișiere al aplicației primește plicuri .fff.json trimise de ele, cu confirmare înainte de import. Fără rețea, fără telemetrie.

## 2.2.0 — 2026-10-27

### Adăugat
- **Dimensiune măsurată la descărcare**: la încărcarea unui model, aplicația însumează `total` raportat de transformers.js pentru fiecare fișier descărcat efectiv în browserul tău (dublurile se numără o dată) și o păstrează local (`localmind.measured_sizes`, cu try/catch). Pentru modelul selectat apare sub butonul „Încarcă Modelul”: „Dimensiune măsurată la descărcarea ta pentru …: X MB (N fișiere, data)”. Este o măsurătoare locală, nu o valoare oficială.
- Mesajul este în 8 limbi (fr/it/es/pt/de/hu: traducere automată).
- Test nou: `tests/measured-size.test.mjs` (12 verificări, fără rețea; evenimentele de progres sunt simulate): sumare, dubluri, persistare, afișare, 8 limbi, stocare coruptă/care aruncă, model nemăsurat → nimic afișat.

### Neschimbat / rămâne „de verificat”
- **Dimensiunile din listă rămân estimări „de verificat”**: serverele Hugging Face nu au fost accesibile din mediul de lucru (proxy 403), iar paginile oficiale ale depozitelor `onnx-community/...` nu au putut fi citite; cele două surse din aplicație (card și lista Descoperă) continuă să difere și nu au fost „corectate” pe nepusă masă.
- Performanța pe CPU/WASM: nemăsurată.
- Modelul preselectat rămâne Qwen3 4B; CSP/jsDelivr neatinse.

## 2.1.0 — 2026-10-27

**Anterior: v121** (121.0.0, 2026-10-26). De la această versiune LocalMind folosește SemVer (MAJOR.MINOR.PATCH); numerele 120.x/121.x din istoricul din README rămân ca atare.

Recenzie 2026-10-27.

### Adăugat
- Mesaj clar când WebGPU nu este disponibil: notă sub butonul „Încarcă Modelul” cu motivul (fără `navigator.gpu`, fără adaptor, context nesecurizat, politica Android / iOS<18, Chrome pe Android blocat), ce înseamnă (CPU/WASM, mai lent), ce model nu poate rula (LFM2 1.2B) și cu ce să începi (Qwen3 0.6B). Traduceri în cele 8 limbi (neverificate nativ).
- Notă despre dimensiuni: sunt estimări de verificat, format q4f16, descărcare unică de pe huggingface.co, apoi cache în browser.
- README (en/ro): secțiunea „Ce model, cât se descarcă și ce se întâmplă fără WebGPU” cu tabel (modele, dimensiuni din două surse care nu coincid — de verificat — și comportament fără WebGPU), alegerea dispozitivului, versionarea și Stare/Offline.
- Test nou `tests/webgpu-note.test.mjs`; linii „Stare” și „Offline” în metadate (`app-status`, `app-offline`).

### Modificat
- Versiune coerentă peste tot: titlu, antet, subsol, meta, app.json, sw.js și exporturi (TXT/MD/JSON/HTML/PDF) afișau 120.2.13 sau 121.0.0; acum toate: 2.1.0. Hash-urile CSP ale scripturilor inline au fost recalculate.

### Neschimbat
- Nimic șters; modelul preselectat (Qwen3 4B), lista de modele, dependențele și gazdele din CSP rămân neschimbate.
