// LocalMind — chei localStorage corupte nu mai opresc inițializarea modulului (templates/personas/expanders erau parsate fără try/catch la nivel superior)
// și numele/descrierea personalităților din localStorage nu se inserează ca HTML. Rulare: node tests/storage-corruption.test.mjs [index.html]
import {createRequire} from "module"; import path from "path"; import {fileURLToPath} from "url";
const require = createRequire(process.env.NODE_PW || "/home/claude/pw/package.json"); const {chromium} = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = "file://" + path.resolve(process.argv[2] || path.join(HERE, "..", "index.html"));
let fails = 0, passes = 0; const check = (n, c, x) => { c ? (passes++, console.log("  ok  " + n)) : (fails++, console.log("FAIL  " + n + (x !== undefined ? "  -> " + JSON.stringify(x).slice(0, 300) : ""))); };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || process.env.CHROME || undefined, args: ["--no-sandbox"]});
async function open(store) {
  const ctx = await b.newContext({locale: "ro-RO", viewport: {width: 1280, height: 800}, serviceWorkers: "block"}); await ctx.route(/^https?:/, r => r.abort());
  await ctx.addInitScript(s => { try { localStorage.setItem("localmind.onboarded", "1"); for (const k in s) localStorage.setItem(k, s[k]); } catch (e) {} }, store);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 140)));
  await p.goto(FILE); await p.waitForTimeout(2500); return {p, errs, ctx};
}
for (const k of ["localmind.templates", "localmind.personas", "localmind.expanders", "localmind.custom_models", "localmind.benchmarks", "localmind.pinned", "localmind.conv_list"]) {
  for (const bad of ["not json{", "42", "null", '"text"']) {
    const {p, errs, ctx} = await open({[k]: bad});
    const fn = await p.evaluate(() => [typeof window.toggleConvCmp, typeof window.togglePersonaPanel, typeof window.exportAsJSON]);
    check(k + " = " + bad + ": modulul pornește complet", fn.every(t => t === "function") && !errs.some(e => /before initialization|is not valid JSON|is not iterable|fromEntries/.test(e)), {fn, errs});
    await ctx.close();
  }
}
const EVIL = '<img src=x id=pwnP onerror="window.__x=1">';
const {p, errs, ctx} = await open({"localmind.personas": JSON.stringify([{id: "p1", name: EVIL, desc: EVIL, sys: "x", temp: 0.5}])});
await p.evaluate(() => window.togglePersonaPanel()); await p.waitForTimeout(300);
const r = await p.evaluate(() => ({img: document.querySelectorAll("#persona-list img").length, txt: document.getElementById("persona-list").textContent, items: document.querySelectorAll("#persona-list .persona-item").length}));
check("persoană cu HTML în nume/descriere: afișată ca text, 0 elemente injectate", r.img === 0 && r.txt.includes("<img src=x") && !(await p.$("#pwnP")), r);
await ctx.close(); await b.close(); console.log("\n" + passes + " reușite, " + fails + " eșuate"); process.exit(fails ? 1 : 0);
