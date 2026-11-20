// Teste 2.4.4: așezarea mesajelor în conversație. Corpul mesajului are rândul lui pe toată lățimea; ora, butoanele, timpul de citire și „Răspunsuri rapide”
// stau pe rândurile următoare, aliniate cu corpul (înainte erau în același rând flex: corpul AI avea ~278 px la 1280 px, ~83 px la 768 px și 0 px la 375 px).
// Rulează din directorul aplicației: node tests/message-layout.test.mjs   (PW_ROOT=cale/package.json, CHROMIUM_PATH=cale/chromium)
// Rețea blocată; nu se încarcă niciun model; conversația se pune în stocarea locală și se încarcă cu loadConv(0).
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(here, ".."); const URL_ = "file://" + path.join(ROOT, "index.html");
let fail = 0, pass = 0; const ok = (c, m, x) => { if (c) pass++; console.log((c ? "  ok  " : "FAIL  ") + m + (!c && x !== undefined ? "  -> " + JSON.stringify(x) : "")); if (!c) fail++; };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const LONG = "Un paragraf destul de lung ca să se vadă dacă lățimea coloanei de mesaje e normală sau îngustă: ".repeat(3);

async function measure(vp, {compact = false} = {}) {
  const ctx = await browser.newContext({locale: "ro-RO", viewport: vp, serviceWorkers: "block"});
  await ctx.route(/^https?:/, r => r.abort());
  await ctx.addInitScript(c => { try { localStorage.setItem("localmind.onboarded", "1"); localStorage.setItem("localmind.conv_list", JSON.stringify([{title: "T", ts: 1700000000000, msgs: 2, data: [{role: "user", content: "salut"}, {role: "assistant", content: c}]}])); } catch (e) {} }, LONG);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 150)));
  await p.goto(URL_); await p.waitForTimeout(2500);
  await p.evaluate(() => window.loadConv(0)); await p.waitForTimeout(1500);
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  if (compact) { await p.evaluate(() => document.body.classList.add("compact-mode")); await p.waitForTimeout(300); }
  const r = await p.evaluate(() => {
    const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width}; };
    const out = {n: document.querySelectorAll("#ca .msg").length};
    for (const [k, i] of [["user", 0], ["ai", 1]]) {
      const m = document.querySelectorAll("#ca .msg")[i]; if (!m) continue;
      const mb = m.querySelector(".mb"), av = m.querySelector(".av"), ts = m.querySelector(".msg-ts"), qr = m.querySelector(".quick-replies");
      const cs = getComputedStyle(m);
      out[k] = {msg: box(m), mb: box(mb), av: box(av), ts: ts && box(ts), qr: qr && box(qr), pl: parseFloat(cs.paddingLeft), over: m.scrollWidth - m.clientWidth,
        qrs: qr ? [...qr.children].map(c => box(c)) : [], kids: [...m.children].map(c => c.className.split(" ")[0])};
    }
    return out;
  });
  await ctx.close(); return {r, errs};
}

for (const vp of [{width: 375, height: 800}, {width: 768, height: 900}, {width: 1280, height: 800}, {width: 1920, height: 1080}]) {
  const tag = vp.width + " px: ";
  const {r, errs} = await measure(vp);
  ok(r.n === 2 && r.user && r.ai, tag + "conversația se încarcă (2 mesaje)", r.n);
  if (!(r.user && r.ai)) continue;
  for (const k of ["user", "ai"]) {
    const x = r[k], inner = x.msg.w - x.pl;
    ok(x.mb.w >= inner - 2, tag + "corpul mesajului " + (k === "ai" ? "AI" : "utilizator") + " are tot rândul (" + Math.round(x.mb.w) + " din " + Math.round(inner) + " px)", {mb: x.mb.w, inner});
    ok(x.mb.w >= Math.min(300, vp.width * 0.8), tag + "corpul mesajului " + (k === "ai" ? "AI" : "utilizator") + " nu e îngust (" + Math.round(x.mb.w) + " px)", x.mb.w);
    ok(x.av.r <= x.mb.l + 1, tag + "avatarul nu se suprapune cu corpul (" + k + ")", {avR: x.av.r, mbL: x.mb.l});
    ok(x.ts && x.ts.t >= x.mb.b - 1 && Math.abs(x.ts.l - x.mb.l) <= 1, tag + "ora de sub mesaj e sub corp, aliniată la stânga cu el (" + k + ")", {ts: x.ts, mb: x.mb});
    ok(x.over <= 1, tag + "fără depășire orizontală în mesaj (" + k + ")", x.over);
  }
  const q = r.ai;
  ok(q.qr && q.qr.t >= q.mb.b - 1 && Math.abs(q.qr.l - q.mb.l) <= 1, tag + "„Răspunsuri rapide” sunt sub corp, aliniate cu el", {qr: q.qr, mb: q.mb});
  ok(q.qr && q.qr.b - q.qr.t < 120, tag + "„Răspunsuri rapide”: chip-urile nu sunt întinse pe înălțime (" + (q.qr ? Math.round(q.qr.b - q.qr.t) : "?") + " px)", q.qr);
  ok(q.qrs.length === 4 && q.qrs.every(c => c.r <= q.msg.r + 1), tag + "cele 4 chip-uri încap în mesaj", q.qrs);
  ok(errs.length === 0, tag + "fără erori de pagină", errs);
}

{ // modul compact: indentarea urmează avatarul mai mic (20 px + 5 px)
  const {r, errs} = await measure({width: 1280, height: 800}, {compact: true});
  ok(r.ai && Math.abs(r.ai.pl - 25) <= 0.5 && r.ai.mb.w >= r.ai.msg.w - 27, "modul compact: indentare 25 px, corpul are tot rândul (" + (r.ai && Math.round(r.ai.mb.w)) + " px)", r.ai && {pl: r.ai.pl, mb: r.ai.mb.w, msg: r.ai.msg.w});
  ok(r.ai && r.ai.av.r <= r.ai.mb.l + 1, "modul compact: avatarul nu se suprapune cu corpul", r.ai && {avR: r.ai.av.r, mbL: r.ai.mb.l});
  ok(errs.length === 0, "modul compact: fără erori de pagină", errs);
}

await browser.close(); console.log("\n" + pass + " reușite, " + fail + " eșuate"); process.exit(fail ? 1 : 0);
