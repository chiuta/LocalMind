// LocalMind — randarea Markdown a răspunsurilor (prin încărcarea unei conversații salvate): cod inline/URL neatinse de emfază, $$ din cod, matematică KaTeX,
// marcaj NUL fals, XSS de bază. Rulare: node tests/markdown-render.test.mjs [index.html]   (NODE_PW=cale/package.json, CHROME=cale/chromium)
import {createRequire} from "module"; import path from "path"; import fs from "fs"; import http from "http"; import {fileURLToPath} from "url";
const require = createRequire(process.env.PW_ROOT || process.env.NODE_PW || import.meta.url); const {chromium} = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.argv[2] ? path.dirname(process.argv[2]) : path.join(HERE, ".."));
// KaTeX din vendor/ are atribut integrity: pe file:// Chromium îl refuză (cere CORS), deci servim prin http://127.0.0.1 (ca pe GitHub Pages)
const MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json"};
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html")); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(s); });
await new Promise(r => srv.listen(0, "127.0.0.1", r));
const FILE = "http://127.0.0.1:" + srv.address().port + "/" + path.basename(process.argv[2] || "index.html");
let fails = 0, passes = 0; const check = (n, c, x) => { c ? (passes++, console.log("  ok  " + n)) : (fails++, console.log("FAIL  " + n + (x !== undefined ? "  -> " + JSON.stringify(x).slice(0, 400) : ""))); };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || process.env.CHROME || undefined, args: ["--no-sandbox"]});
async function render(content) {
  const ctx = await b.newContext({locale: "ro-RO", viewport: {width: 1280, height: 800}, serviceWorkers: "block"}); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await ctx.addInitScript(c => { try { localStorage.setItem("localmind.onboarded", "1"); localStorage.setItem("localmind.conv_list", JSON.stringify([{title: "T", ts: Date.now(), msgs: 2, data: [{role: "user", content: "salut"}, {role: "assistant", content: c}]}])); } catch (e) {} }, content);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 150)));
  await p.goto(FILE); await p.waitForTimeout(3000);
  await p.evaluate(() => window.loadConv(0)).catch(e => errs.push("loadConv: " + String(e).slice(0, 150))); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const root = document.querySelector(".mtx.md"); return root ? {html: root.innerHTML, text: root.textContent, katex: root.querySelectorAll(".katex").length, bad: root.querySelectorAll("script,iframe,[onerror],[onload],[onclick]").length} : null; });
  await ctx.close(); return {r, errs};
}
let x = await render("usa `read_file_name` si snake_case_word si _it_ si [a](https://x.com/_foo_/bar_x_)");
check("cod inline neatins de emfază", x.r && x.r.html.includes("<code>read_file_name</code>"), x.r && x.r.html);
check("snake_case_word rămâne text, _it_ devine italic", x.r && x.r.text.includes("snake_case_word") && x.r.html.includes("<em>it</em>"));
check("href intact", x.r && x.r.html.includes('href="https://x.com/_foo_/bar_x_"'), x.r && x.r.html);
x = await render("```bash\necho $$\nkill $$\n```");
check("$$ din bloc de cod păstrat", x.r && /echo[\s\S]*\$\$[\s\S]*kill[\s\S]*\$\$/.test(x.r.text) && !/KD\d/.test(x.r.text), x.r && x.r.text);
x = await render("formula:\n\n$$x^2+1$$ si in text $$y$$ gata");
check("matematică $$…$$ randată cu KaTeX", x.r && x.r.katex > 0 && !/KD\d/.test(x.r.text), x.r && x.r.html);
x = await render("costa $5 si $10, iar $x^2$ e formula; in cod: `echo $HOME si $PATH`");
check("„$5 și $10” rămâne text; $x^2$ randat; codul neatins", x.r && x.r.text.includes("$5 si $10") && x.r.katex === 1 && x.r.html.includes("<code>echo $HOME si $PATH</code>"), x.r && x.r.html);
x = await render("\x00CB5\x00 si \x00KD0\x00");
check("marcaj NUL fals: conversația se încarcă fără excepție", x.r && x.errs.length === 0 && x.r.text.includes("CB5"), x.errs);
x = await render('<img src=x onerror=alert(1)> [x](https://a.com" onmouseover="alert(1)) ```svg\n<svg onload=alert(1)></svg>\n```');
check("XSS de bază: 0 elemente executabile", x.r && x.r.bad === 0 && x.errs.length === 0, x.r && x.r.html);
await b.close(); srv.close(); console.log("\n" + passes + " reușite, " + fails + " eșuate"); process.exit(fails ? 1 : 0);
