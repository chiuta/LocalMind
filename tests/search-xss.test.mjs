// LocalMind — căutarea globală (#gsrch-inp) și căutarea în conversația curentă nu inserează HTML din interogare / conținut.
// Rulare: node tests/search-xss.test.mjs [index.html]
import {createRequire} from "module"; import path from "path"; import {fileURLToPath} from "url";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = "file://" + path.resolve(process.argv[2] || path.join(HERE, "..", "index.html"));
let fails = 0, passes = 0; const check = (n, c, x) => { c ? (passes++, console.log("  ok  " + n)) : (fails++, console.log("FAIL  " + n + (x !== undefined ? "  -> " + JSON.stringify(x) : ""))); };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const ctx = await b.newContext({locale: "ro-RO", viewport: {width: 1280, height: 800}, serviceWorkers: "block"}); await ctx.route(/^https?:/, r => r.abort());
const EVIL = '<img src=x id=pwn1 onerror="window.__x=1">';
await ctx.addInitScript(evil => { try { localStorage.setItem("localmind.onboarded", "1"); localStorage.setItem("localmind.conv_list", JSON.stringify([{title: "T<b id=pwnT>x</b>", ts: Date.now(), msgs: 1, data: [{role: "user", content: "salut " + evil + " lume amp lt"}]}])); } catch (e) {} }, EVIL);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e)));
await p.goto(FILE); await p.waitForTimeout(3800);
await p.evaluate(() => window.toggleGlobSearch()); await p.waitForTimeout(300);
await p.fill("#gsrch-inp", EVIL + "zzz"); await p.waitForTimeout(300);
let r = await p.evaluate(() => ({imgs: document.querySelectorAll("#gsrch-results img").length, txt: document.getElementById("gsrch-results").textContent}));
check("1. «Niciun rezultat»: fără element injectat din interogare", r.imgs === 0 && !(await p.$("#pwn1")), r);
check("1. mesajul conține interogarea ca text", r.txt.includes("<img src=x") && r.txt.includes("Niciun rezultat"), r.txt);
await p.fill("#gsrch-inp", "salut"); await p.waitForTimeout(300);
r = await p.evaluate(() => ({imgs: document.querySelectorAll("#gsrch-results img,#gsrch-results b").length, n: document.querySelectorAll("#gsrch-results .gsrch-result").length, m: [...document.querySelectorAll("#gsrch-results .gsrch-match")].map(x => x.textContent), txt: document.getElementById("gsrch-results").textContent}));
check("2. rezultat: titlul/snippetul cu HTML rămân text (0 elemente injectate)", r.imgs === 0 && r.n === 1 && r.txt.includes("<img src=x") && r.txt.includes("T<b id=pwnT>x</b>"), r);
check("2. potrivirea e evidențiată", r.m.length === 1 && r.m[0] === "salut", r.m);
await p.fill("#gsrch-inp", "amp"); await p.waitForTimeout(300);
r = await p.evaluate(() => document.querySelector("#gsrch-results .gsrch-snippet").textContent);
check("3. interogare «amp»: fără entități rupte", r.includes("lume amp lt"), r);
await p.fill("#gsrch-inp", "a.*(["); await p.waitForTimeout(300);
check("4. caractere regex în interogare: fără excepție", errs.length === 0, errs);
// căutarea în conversația curentă
await p.evaluate(() => window.loadConv(0)).catch(() => {}); await p.waitForTimeout(800);
const ir = await p.evaluate(() => { if (!document.getElementById("search-results")) { const e = document.createElement("div"); e.id = "search-results"; document.body.appendChild(e); } window.renderSearchResults("salut lume"); const r = document.getElementById("search-results"); return {imgs: r.querySelectorAll("img").length, marks: r.querySelectorAll("mark").length, txt: r.textContent}; }).catch(e => ({err: e.message}));
check("5. renderSearchResults: conținutul mesajului nu devine HTML", ir.imgs === 0 && ir.marks > 0 && ir.txt.includes("<img src=x"), ir);
check("0 erori JS", errs.length === 0, errs);
await b.close(); console.log(`\n${passes} reușite, ${fails} eșuate`); process.exit(fails ? 1 : 0);
