# Jurnal de modificări

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
