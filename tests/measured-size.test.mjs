// Teste 2.2.0: dimensiunea MĂSURATĂ la descărcare (suma `total` raportată de progress_callback), păstrată local; nicio dimensiune inventată.
// Nu se descarcă niciun model (rețea blocată): evenimentele de progres sunt simulate direct prin window.lmSz. Rulează: node tests/measured-size.test.mjs
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url)); const URL_ = "file://" + path.resolve(here, "../index.html");
let fail = 0; const ok = (c, m, x) => { console.log((c ? "  ok  " : "FAIL  ") + m + (!c && x !== undefined ? "  -> " + JSON.stringify(x) : "")); if (!c) fail++; };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const ctx = await browser.newContext({locale: "ro-RO", viewport: {width: 1280, height: 900}}); const reqs = [], errs = [];
await ctx.route(/^https?:/, r => { reqs.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
await p.addInitScript(() => { try { localStorage.setItem("localmind.onboarded", "1"); } catch (_) {} });
await p.goto(URL_); await p.waitForFunction(() => window.lmSz && document.querySelector('.mc[data-model="onnx-community/Qwen3-0.6B-ONNX"]'));
const M = "onnx-community/Qwen3-0.6B-ONNX";
ok(await p.evaluate(() => document.getElementById("dl-measured").hidden), "înainte de orice descărcare: nicio dimensiune măsurată afișată");
ok((await p.textContent("#dl-note")).includes("estimări (de verificat)"), "nota despre estimări rămâne");
// 1. simulăm evenimentele: același fișier raportat de mai multe ori (loaded crește, total constant) + alt fișier
const r = await p.evaluate(m => { lmSz.reset(); lmSz.track("onnx/model_q4f16.onnx", 1000000); lmSz.track("onnx/model_q4f16.onnx", 1000000); lmSz.track("tokenizer.json", 2000000); lmSz.track("config.json", 0); lmSz.track(undefined, 5); return lmSz.commit(m); }, M);
ok(r && r.bytes === 3000000 && r.files === 2 && /^\d{4}-\d{2}-\d{2}$/.test(r.at), "suma = 3 000 000 B din 2 fișiere (dublurile, total=0 și fără nume ignorate)", r);
const sv = await p.evaluate(() => JSON.parse(localStorage.getItem("localmind.measured_sizes") || "null"));
ok(sv && sv[M] && sv[M].bytes === 3000000, "valoarea e păstrată în localStorage", sv);
// 2. selectarea cardului arată textul (ro), apoi traducerea
await p.evaluate(m => selMdl(document.querySelector('.mc[data-model="' + m + '"]')), M);
let t = await p.textContent("#dl-measured");
ok(!(await p.evaluate(() => document.getElementById("dl-measured").hidden)) && /Dimensiune măsurată/.test(t) && /3 MB/.test(t) && /Qwen3-0\.6B-ONNX/.test(t) && /2 fișiere/.test(t), "cardul selectat afișează dimensiunea măsurată", t);
const trs = await p.evaluate(async () => { const o = {}; for (const l of ["en", "fr", "it", "es", "pt", "de", "hu", "ro"]) { LMI.setLang(l, false); await new Promise(r => setTimeout(r, 250)); o[l] = document.getElementById("dl-measured").textContent; } return o; });
ok(/Size measured/.test(trs.en) && /Taille mesurée/.test(trs.fr) && /Dimensione misurata/.test(trs.it) && /Tamaño medido/.test(trs.es) && /Tamanho medido/.test(trs.pt) && /gemessene Größe/.test(trs.de) && /mért méret/.test(trs.hu) && /Dimensiune măsurată/.test(trs.ro), "mesajul e tradus în toate cele 8 limbi", trs);
ok(Object.values(trs).every(x => !/\{\d\}/.test(x) && /Qwen3-0\.6B-ONNX/.test(x) && /3/.test(x)), "fără substituenți neînlocuiți; numele modelului și valoarea apar", trs);
// 3. alt model: nimic afișat
await p.evaluate(() => { const c = [...document.querySelectorAll(".mc")].find(x => x.dataset.model && x.dataset.model !== "onnx-community/Qwen3-0.6B-ONNX"); selMdl(c); });
ok(await p.evaluate(() => document.getElementById("dl-measured").hidden), "alt model, nemăsurat: nimic afișat (nu se inventează)");
// 4. robustețe: stocare coruptă / care aruncă / fără fișiere
const rb = await p.evaluate(m => {
  const o = {}; localStorage.setItem("localmind.measured_sizes", "{nu-e-json"); o.read = JSON.stringify(lmSz.read());
  localStorage.setItem("localmind.measured_sizes", "[1,2]"); o.arr = JSON.stringify(lmSz.read());
  lmSz.reset(); o.empty = lmSz.commit(m);
  lmSz.track("a", 10); const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new Error("blocat"); };
  try { o.thr = lmSz.commit(m).bytes; } catch (e) { o.thr = "EXC " + e.message; } finally { Storage.prototype.setItem = orig; }
  return o; }, M);
ok(rb.read === "{}" && rb.arr === "{}", "JSON corupt / tip greșit → obiect gol, fără excepții", rb);
ok(rb.empty === null, "fără evenimente de progres → nu se salvează nimic", rb);
ok(rb.thr === 10, "stocare care aruncă → fără excepție, valoarea curentă se întoarce", rb);
ok(errs.length === 0, "fără erori de pagină", errs); ok(reqs.length === 0, "0 cereri de rețea", reqs);
await browser.close(); console.log(fail ? fail + " eșuate" : "toate trec"); process.exit(fail ? 1 : 0);
