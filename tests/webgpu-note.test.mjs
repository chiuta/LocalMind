// Teste 2.1.0: mesajul clar fără WebGPU (motiv + ce modele merg), nota despre dimensiuni, versiuni coerente. Rulează: node tests/webgpu-note.test.mjs
// Rețea blocată; nu se încarcă niciun model (nu există fișiere de model în test). Se simulează doar prezența/absența lui navigator.gpu și a user-agentului.
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path"; import fs from "fs";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(here, ".."); const URL_ = "file://" + path.join(ROOT, "index.html");
let fail = 0; const ok = (c, m, x) => { console.log((c ? "  ok  " : "FAIL  ") + m + (!c && x !== undefined ? "  -> " + JSON.stringify(x) : "")); if (!c) fail++; };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
async function open({gpu, ua, lang} = {}) {
  const ctx = await browser.newContext({locale: "ro-RO", viewport: {width: 1280, height: 900}, userAgent: ua});
  const reqs = []; await ctx.route(/^https?:/, r => { reqs.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(([g, l]) => {
    try { localStorage.setItem("localmind.onboarded", "1"); if (l) localStorage.setItem("localmind.ui_lang", l); } catch (_) {}
    if (g === "none") { try { Object.defineProperty(Navigator.prototype, "gpu", {get: () => undefined, configurable: true}); } catch (_) {} }
    if (g === "noadapter") Object.defineProperty(navigator, "gpu", {value: {requestAdapter: async () => null}, configurable: true});
    if (g === "adapter") Object.defineProperty(navigator, "gpu", {value: {requestAdapter: async () => ({requestDevice: async () => { throw new Error("test"); }, limits: {}, features: new Set()})}, configurable: true});
  }, [gpu, lang]);
  await p.goto(URL_); await p.waitForFunction(() => document.getElementById("dev-note") !== null && document.getElementById("s-d") && document.getElementById("s-d").textContent !== "" && document.getElementById("s-d").textContent !== "—", null, {timeout: 20000}).catch(() => {});
  await p.waitForTimeout(1200);
  return {ctx, p, errs, reqs};
}
const note = p => p.evaluate(() => { const e = document.getElementById("dev-note"); return {hidden: e.hidden, text: e.textContent}; });

console.log("A) fără navigator.gpu (desktop)");
{ const {p, errs, ctx} = await open({gpu: "none"}); const n = await note(p);
  ok(!n.hidden && /WebGPU indisponibil/.test(n.text) && /CPU \(WASM\)/.test(n.text), "nota apare, în română", n.text.slice(0, 120));
  ok(/browserul nu expune WebGPU/.test(n.text), "motiv: browserul nu expune WebGPU", n.text);
  ok(/LFM2 1\.2B nu poate rula fără WebGPU/.test(n.text) && /Qwen3 0\.6B/.test(n.text) && /de verificat/.test(n.text), "spune ce model nu merge, cu ce să înceapă și ce e de verificat");
  ok(/WASM/.test(await p.textContent("#dbdg")), "insigna de dispozitiv rămâne WASM");
  ok(/estimări \(de verificat\)/.test(await p.textContent("#dl-note")) && /q4f16/.test(await p.textContent("#dl-note")) && /huggingface\.co/.test(await p.textContent("#dl-note")), "nota despre dimensiuni: estimări, q4f16, huggingface.co");
  ok(errs.length === 0, "fără erori de pagină", errs); await ctx.close(); }
console.log("B) navigator.gpu există, dar fără adaptor");
{ const {p, ctx} = await open({gpu: "noadapter"}); const n = await note(p);
  ok(!n.hidden && /nu a găsit niciun adaptor grafic compatibil/.test(n.text), "motiv: niciun adaptor", n.text); await ctx.close(); }
console.log("C) WebGPU disponibil: nota dispare");
{ const {p, ctx} = await open({gpu: "adapter"}); const n = await note(p);
  ok(n.hidden && n.text === "", "nota ascunsă când există WebGPU", n); await ctx.close(); }
console.log("D) Android non-Chrome (Samsung Internet): modul CPU/WASM forțat");
{ const {p, ctx} = await open({gpu: "none", ua: "Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36"}); const n = await note(p);
  ok(!n.hidden && /pe Android aplicația forțează modul CPU\/WASM/.test(n.text), "motiv: Android", n.text); await ctx.close(); }
console.log("E) Chrome Android: browser incompatibil");
{ const {p, ctx} = await open({gpu: "none", ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"}); const n = await note(p);
  ok(!n.hidden && /Pe acest browser modelele nu se pot încărca/.test(n.text) && /limita de memorie pe filă/.test(n.text) && !/LFM2/.test(n.text), "mesaj de blocare, fără recomandarea CPU", n.text); await ctx.close(); }
console.log("F) traducere (engleză, franceză)");
{ const {p, ctx} = await open({gpu: "none", lang: "en"}); const n = await note(p);
  ok(/WebGPU unavailable — models run on the CPU \(WASM\)\./.test(n.text) && /Reason: the browser does not expose WebGPU/.test(n.text) && /It works, but more slowly/.test(n.text), "EN", n.text);
  ok(/The sizes in the list are estimates/.test(await p.textContent("#dl-note")), "EN: nota de dimensiuni"); await ctx.close(); }
{ const {p, ctx} = await open({gpu: "none", lang: "fr"}); const n = await note(p);
  ok(/WebGPU indisponible/.test(n.text) && /Raison : le navigateur n’expose pas WebGPU/.test(n.text), "FR", n.text); await ctx.close(); }
console.log("G) versiuni coerente");
{ const app = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8")); const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ok(app.version === "2.1.0" && /<title>LocalMind v2\.1\.0 /.test(html) && /name="application-version" content="2\.1\.0"/.test(html) && /v 2\.1\.0 · 2026-10-27/.test(html), "titlu, meta, subsol și app.json: 2.1.0");
  ok(!/v120\.2\.13|v121\.0\.0/.test(html), "nu mai rămân v120.2.13 / v121.0.0 în aplicație"); }
await browser.close(); console.log(fail ? "EȘEC: " + fail : "TOATE OK"); process.exit(fail ? 1 : 0);
