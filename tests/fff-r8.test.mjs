// Teste pentru funcțiile noi din LocalMind 120.1.0 (runda 8). Rulează: node tests/fff-r8.test.mjs
// Rețea blocată. Nu se încarcă niciun model (nu există rețea/fișiere de model în test): scorarea evaluării se verifică
// cu răspunsuri-fixtură furnizate de test (nu apar în aplicație); generarea reală prin `pipe` NU este exersată aici.
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path"; import fs from "fs";
const require=createRequire("/opt/node-tools/package.json"); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url)); const URL_='file://'+path.resolve(here,'../index.html');
const AXE=process.env.FFF_AXE||'/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log('FAIL:',m);} };
const browser=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const CONVS=[
 {title:'Grădinărit',ts:Date.now()-86400000,msgs:2,data:[{role:'user',content:'Cum plantez roșii în grădină? Scrie-mi pe test.user@example.com'},{role:'assistant',content:'Roșiile se plantează după ultimul îngheț, la 50 cm distanță.'}]},
 {title:'Astronomie',ts:Date.now(),msgs:2,data:[{role:'user',content:'Ce este o eclipsă solară? IBAN-ul meu RO49AAAA1B31007593840000'},{role:'assistant',content:'O eclipsă solară apare când Luna se află între Soare și Pământ.'}]}];
async function open(opts={}){
  const ctx=await browser.newContext({locale:'ro-RO',viewport:opts.vp||{width:1280,height:800},colorScheme:opts.scheme||'dark',acceptDownloads:true});
  const reqs=[]; await ctx.route(/^https?:/, r=>{ reqs.push(r.request().url()); r.abort(); });
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{ if(m.type()==='error'||/Content Security/i.test(m.text())) errs.push('console '+m.text()); });
  p.on('dialog',d=>d.accept());
  await p.addInitScript({content:fs.readFileSync(AXE,'utf8')});
  await p.addInitScript(({convs,seed})=>{ try{ localStorage.setItem('lm_onboarded','1'); if(seed&&!sessionStorage.getItem('c5seeded')){ localStorage.setItem('lm_conv_list',JSON.stringify(convs)); sessionStorage.setItem('c5seeded','1'); } }catch(e){} },{convs:CONVS,seed:opts.seed!==false});
  await p.goto(URL_); await p.waitForTimeout(3600);
  return {ctx,p,errs,reqs};
}
async function axe(p,label){
  const r=await p.evaluate(async()=>await axe.run(document,{resultTypes:['violations']}));
  ok(r.violations.length===0,`axe ${label}: `+r.violations.map(v=>v.id+' '+v.nodes.map(n=>n.target).join('|').slice(0,160)).join('; '));
}
const FAKEERR=/Failed to fetch|net::|NetworkError|ERR_FAILED|Failed to load resource/i;

// 1. pornire
{ const {ctx,p,errs,reqs}=await open();
  ok(errs.filter(e=>!FAKEERR.test(e)).length===0,'pornire fără erori/CSP: '+errs.join(' | '));
  ok(reqs.length===0,'0 cereri de rețea la pornire: '+reqs.join(','));
  ok((await p.textContent('#app-version')).includes('v 120.2.6 · 2026-10-22'),'text #app-version');
  ok(await p.evaluate(()=>document.querySelector('meta[name=application-version]').content==='120.2.6'),'meta versiune');
  ok(await p.evaluate(()=>document.title.includes('120.2.6')),'titlu cu versiunea');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'fără depășire orizontală');
  const net=await p.textContent('#c5-net'); ok(/Nimic nu pleacă/.test(net),'indicator: '+net);
  await axe(p,'start');
  // indicator reacționează la cereri externe; cererile către huggingface nu contează ca „alte gazde”
  await p.evaluate(()=>fetch('https://huggingface.co/api/models').catch(()=>{})); await p.waitForTimeout(200);
  ok(/Nimic nu pleacă/.test(await p.textContent('#c5-net')),'cerere HF nu schimbă indicatorul');
  await p.evaluate(()=>fetch('https://example.org/x').catch(()=>{})); await p.waitForTimeout(200);
  const net2=await p.textContent('#c5-net'); ok(/1 cereri/.test(net2),'cerere către altă gazdă e semnalată: '+net2);
  ok((await p.getAttribute('#c5-net','title')).includes('Audit'),'tooltip explică');
  await ctx.close(); }

// 2. export anonim verificat (FFF.pii) pe o conversație încărcată
{ const {ctx,p,errs}=await open();
  await p.evaluate(()=>toggleConvHistory()); await p.waitForTimeout(300);
  ok(await p.locator('#ch-list .ch-item').count()===2,'2 conversații seed în istoric');
  await p.locator('#ch-list .ch-item').first().click(); await p.waitForTimeout(500); // „Astronomie” (cea mai nouă)
  await p.evaluate(()=>openExportMenu()); await p.waitForTimeout(200);
  await p.click('#c5-anon'); await p.waitForSelector('dialog.fff-pii[open]',{timeout:3000});
  ok(await p.locator('dialog.fff-pii li').count()>=1,'dialog PII listează IBAN-ul');
  await axe(p,'dialog PII');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('dialog.fff-pii button[data-primary]')]);
  const txt=fs.readFileSync(await dl.path(),'utf8');
  ok(!txt.includes('RO49AAAA1B31007593840000'),'IBAN mascat în fișier'); ok(txt.includes('eclipsă solară'),'restul textului păstrat'); ok(/\[[^\]]+\]/.test(txt),'etichetă de înlocuire prezentă');
  ok(errs.filter(e=>!FAKEERR.test(e)).length===0,'fără erori: '+errs.join('|'));
  // conversație fără PII -> export neschimbat + mesaj
  await p.evaluate(()=>toggleConvHistory()); await p.waitForTimeout(200);
  await p.locator('#ch-list .ch-item').nth(0).click(); await p.waitForTimeout(300); // Grădinărit are e-mail
  await ctx.close(); }

// 3. căutare în toate conversațiile
{ const {ctx,p}=await open();
  await p.evaluate(()=>toggleConvHistory()); await p.waitForTimeout(200);
  ok(await p.locator('#c5-sall').count()===1,'buton „Caută tot” în panou'); 
  await p.click('#c5-sall'); await p.waitForSelector('dialog.c5-dlg[open]');
  ok(await p.locator('dialog.c5-dlg li.c5-li').count()===2,'listează 2 conversații');
  await axe(p,'căutare tot');
  await p.fill('dialog.c5-dlg input[type=search]','radacina eclipsa'); await p.waitForTimeout(250);
  const n=await p.locator('dialog.c5-dlg li.c5-li').count(); ok(n===1,'„eclipsa” (fără diacritice) găsește conversația: '+n);
  await p.fill('dialog.c5-dlg input[type=search]','rosiile plantare'); await p.waitForTimeout(250);
  ok(await p.locator('dialog.c5-dlg li.c5-li').count()>=1,'formă apropiată „rosiile plantare” găsește Grădinărit');
  await p.fill('dialog.c5-dlg input[type=search]','xyzqq'); await p.waitForTimeout(250);
  ok(await p.locator('dialog.c5-dlg li.c5-li').count()===0,'fără rezultate pentru termen inexistent');
  await p.fill('dialog.c5-dlg input[type=search]','Soare Lună'); await p.waitForTimeout(250);
  await p.click('dialog.c5-dlg li.c5-li summary'); await p.click('dialog.c5-dlg li.c5-li button:has-text("Deschide")'); await p.waitForTimeout(600);
  ok(await p.locator('dialog.c5-dlg').count()===0,'dialogul s-a închis'); ok(await p.evaluate(()=>document.title.includes('Astronomie')),'conversația a fost încărcată (titlu)');
  ok(!(await p.evaluate(()=>document.getElementById('conv-hist-panel').classList.contains('open'))),'panoul de istoric nu a rămas deschis');
  await ctx.close(); }

// 4. evaluare onestă: scorare, statistici, UI, persistență, export
{ const {ctx,p,errs}=await open({seed:false});
  const r=await p.evaluate(async()=>{
    const good={arith:'17 × 23 = 391',json:'```json\n{"nume":"Ion","varsta":30}\n```',words:'Valuri, nisip, sare.',extract:'48213',lang:'Capitala Franței este Paris.',copy:'alfa-7 / beta_12 / gamma.3',logic:'Cora',abstain:'NU EXISTĂ.'};
    const bad={arith:'400',json:'{nume: Ion',words:'Marea este frumoasă și albastră',extract:'Comanda 48213 din 2025',lang:'The capital is Paris',copy:'alfa-7 / beta 12 / gamma.3',logic:'Ana',abstain:'Neil'};
    const mk=ans=>{ let i=0; return async()=>({text:(i%2===0?'<think>mă gândesc…</think>':'')+ans[lmEval.tasks[i++].id],ttft:100+i,tps:10}); };
    const a=await lmEval.run(mk(good)), b=await lmEval.run(mk(bad));
    // truncat în gândire
    const c=await lmEval.run(async()=>({text:'<think>nu termin niciodată',ttft:50,tps:5}));
    return {a:{p:a.passed,n:a.total,ttft:a.ttft_ms,tps:a.tps,ok:a.tasks.map(t=>t.ok)},b:{p:b.passed,ok:b.tasks.map(t=>t.ok)},c:{p:c.passed,tr:c.tasks.every(t=>t.truncated)},w:lmEval.wilson(8,8),w0:lmEval.wilson(0,8),w4:lmEval.wilson(4,8),strip:lmEval.strip('<think>x</think> ok')};
  });
  ok(r.a.p===8&&r.a.n===8,'răspunsuri corecte → 8/8: '+JSON.stringify(r.a.ok)); ok(r.b.p===1||r.b.p===0,'răspunsuri greșite → scor mic: '+r.b.p+' '+JSON.stringify(r.b.ok));
  ok(r.b.ok.filter(Boolean).length<=1,'verificatoarele resping răspunsurile greșite (fiecare variantă greșită e respinsă)');
  ok(r.c.p===0&&r.c.tr,'gândire netrunchiată → 0 și marcat trunchiat'); ok(r.a.ttft===Math.round(r.a.ttft)||r.a.ttft>0,'mediană TTFT');
  ok(Math.abs(r.w[0]-0.6756)<0.01&&r.w[1]>0.99,'Wilson 8/8 ≈ [0,676;1]: '+r.w); ok(r.w0[0]===0&&Math.abs(r.w0[1]-0.3244)<0.01,'Wilson 0/8: '+r.w0); ok(r.w4[0]<0.22&&r.w4[1]>0.78,'Wilson 4/8 larg: '+r.w4);
  ok(r.strip==='ok','strip <think>');
  // UI fără model
  await p.click('#bench-btn').catch(()=>{}); await p.evaluate(()=>lmEval.open()); await p.waitForSelector('dialog.c5-dlg[open]');
  ok(await p.isDisabled('#c5-ev-run'),'rulare dezactivată fără model'); ok((await p.textContent('#c5-ev-status')).includes('Încarcă un model'),'mesaj clar fără model');
  ok((await p.textContent('dialog.c5-dlg .c5-note')).includes('semnal grosier'),'avertisment de onestitate afișat');
  ok((await p.textContent('#c5-ev-out')).includes('Nicio evaluare'),'niciun rezultat inițial');
  await axe(p,'evaluare goală');
  await p.keyboard.press('Escape');
  // rezultate salvate: tabel, interval, suprapunere, export, ștergere
  await p.evaluate(()=>{ localStorage.setItem('lm_eval',JSON.stringify({'onnx-community/Qwen3-4B-ONNX':{ts:Date.now(),passed:6,total:8,ttft_ms:420,tps:12.3,tasks:[{id:'arith',ok:true,answer:'391'},{id:'json',ok:false,answer:'{x'}]},'onnx-community/Qwen3-1.7B-ONNX':{ts:Date.now(),passed:5,total:8,ttft_ms:210,tps:25.1,tasks:[]}})); });
  await p.evaluate(()=>lmEval.open()); await p.waitForSelector('#c5-ev-out table');
  ok(await p.locator('#c5-ev-out tbody tr').count()===2,'tabel cu 2 modele'); ok((await p.textContent('#c5-ev-out')).includes('6/8'),'scor afișat');
  ok((await p.textContent('#c5-ev-out')).includes('nu se poate spune'),'notă de suprapunere a intervalelor');
  ok((await p.textContent('#c5-ev-out')).includes('%–'),'interval 95% afișat');
  await axe(p,'evaluare cu rezultate');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#c5-ev-out button:has-text("Exportă")')]);
  const j=JSON.parse(fs.readFileSync(await dl.path(),'utf8')); ok(j.format==='localmind-eval'&&Object.keys(j.results).length===2,'export JSON evaluare');
  await p.click('#c5-ev-out button:has-text("Șterge")'); await p.click('dialog.c5-dlg button.c5-pri:has-text("Da")'); await p.waitForTimeout(400);
  ok(await p.evaluate(()=>localStorage.getItem('lm_eval'))===null,'rezultatele se șterg');
  ok(errs.filter(e=>!FAKEERR.test(e)).length===0,'fără erori: '+errs.join('|'));
  await ctx.close(); }

// 5. copie .fff.json (istoric + evaluări), criptată, import
{ const {ctx,p}=await open();
  await p.evaluate(()=>localStorage.setItem('lm_eval','{"m":{"ts":1,"passed":3,"total":8,"tasks":[]}}'));
  const keys=await p.evaluate(()=>Object.keys(FFF.bundle.build().data)); ok(keys.includes('lm_conv_list')&&keys.includes('lm_eval'),'copia conține conversațiile și evaluările: '+keys.join(','));
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>FFF.bundle.export({encrypt:true,password:'parola-de-test-1'}))]);
  const txt=fs.readFileSync(await dl.path(),'utf8'); ok(!txt.includes('Astronomie')&&JSON.parse(txt).format==='fff-bundle-enc','copia criptată nu conține text clar');
  await p.evaluate(()=>{ localStorage.removeItem('lm_conv_list'); localStorage.removeItem('lm_eval'); });
  const back=await p.evaluate(async t=>{ await FFF.bundle.import(new File([t],'x.fff.json'),{password:'parola-de-test-1',confirm:false,reload:false}); return JSON.parse(localStorage.getItem('lm_conv_list')||'[]').length; },txt);
  ok(back===2,'import restaurează conversațiile: '+back);
  await p.evaluate(()=>FFF.label.open()); await p.waitForSelector('dialog');
  await axe(p,'dialog Transparență'); await ctx.close(); }

// 6. mobil 360
{ const {ctx,p}=await open({vp:{width:360,height:740}});
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'fără depășire 360');
  await p.evaluate(()=>lmEval.open()); await p.waitForSelector('dialog.c5-dlg[open]');
  const w=await p.evaluate(()=>document.querySelector('dialog.c5-dlg').getBoundingClientRect().width); ok(w<=360,'dialog încape: '+w);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'dialog fără depășire orizontală'); await axe(p,'evaluare 360');
  await ctx.close(); }
// 7. temă deschisă
{ const {ctx,p}=await open({scheme:'light'}); await p.evaluate(()=>lmSearchAll()); await p.waitForSelector('dialog.c5-dlg[open]'); await axe(p,'căutare, schemă luminoasă'); await ctx.close(); }

// 8. RAG: diacritice (ș/ş), NFD (macOS), cuvinte de 3 litere
{ const {ctx,p,errs}=await open();
  const r=await p.evaluate(()=>{
    const out={}; const mk=(t)=>({name:'t.txt',chunks:[t]});
    const q=(chunks,query)=>{ __lmRag.set([{name:'t.txt',chunks}]); return __lmRag.context(query); };
    out.sedilla=/șoim/.test(q(['Un șoim zboară deasupra pădurii.'],'Unde zboară şoimul?'))||/șoim/.test(q(['Un șoim zboară deasupra pădurii.'],'şoim'));
    out.sedilla2=q(['Un șoim zboară.'],'şoim').includes('șoim');
    out.nfd_query=q(['Un șoim zboară.'],'ș'.normalize('NFD')+'oim').includes('șoim')|| q(['Un șoim zboară.'],'s\u0326oim').includes('șoim');
    out.nfd_text=q(['Un \u0073\u0326oim zboară.'.replace('\u0073\u0326','s\u0326')],'șoim').includes('zboară');
    out.nfd_text2=q(['Pădurea e deasă.'.normalize('NFD')],'pădurea').normalize('NFC').includes('Pădurea');
    out.imi=q(['Sistemul IMI conectează autoritățile.'],'IMI').includes('IMI');
    out.rag=q(['Tehnica RAG caută în documente.'],'ce este RAG').includes('RAG');
    out.ue=q(['Piața UE.'],'UE')==='';
    out.none=q(['altceva complet'],'șoim')==='';
    __lmRag.set([]); return out; });
  ok(r.sedilla2,'ş (cedilă) găsește ș (virgulă)'); ok(r.nfd_query,'interogare NFD găsește textul NFC'); ok(r.nfd_text2,'text NFD găsit cu interogare NFC');
  ok(r.imi,'IMI (3 litere) contează'); ok(r.rag,'RAG (3 litere) contează'); ok(r.ue,'UE (2 litere) sub prag'); ok(r.none,'fără potrivire: șir gol');
  ok(errs.filter(e=>!FAKEERR.test(e)).length===0,'fără erori: '+errs.join(' | '));
  await ctx.close(); }

await browser.close();
console.log(`\nLocalMind fff-r8: ${pass} reușite, ${fail} eșuate`); process.exit(fail?1:0);
