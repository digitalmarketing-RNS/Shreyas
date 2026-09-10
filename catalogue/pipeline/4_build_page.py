import json, collections, datetime

DATA = json.load(open('catalog.json'))

fam   = collections.Counter(d['family'] for d in DATA)
size  = collections.Counter(d['size'] for d in DATA if d['size'])
tone  = collections.Counter(d['tone'] for d in DATA)
coll  = collections.Counter(d['collection'] for d in DATA if d['collection'])
faces = sum(d['n_faces'] for d in DATA)

TONE_HEX = {'White':'#eae8e4','Ivory':'#ddcfbe','Beige':'#cbb196','Grey':'#a4a19e',
            'Brown':'#937a63','Black':'#443e38','Blue':'#78869d','Accent':'#8a7f5e'}
TONE_ORDER = ['White','Ivory','Beige','Brown','Grey','Black','Blue','Accent']
SIZE_ORDER = ['300x300','300x450','300x600','600x600','600x1200','800x800','800x1600']
FAM_ORDER  = ['PGVT','GVT','Wall','Full Body','Nano','Carving',
              'Double Charge','Floor','Roof','Parking']

FAM_NOTE = {
 'PGVT':'Polished glazed vitrified',
 'GVT':'Glazed vitrified',
 'Wall':'Ceramic wall tile',
 'Full Body':'Through-body porcelain',
 'Nano':'Nano-polished',
 'Carving':'Textured / carved surface',
 'Double Charge':'Double-charge vitrified',
 'Floor':'Ceramic floor tile',
 'Roof':'Roofing tile',
 'Parking':'Heavy-duty exterior',
}

CSS = r"""
:root{
  --ground:#f6f5f2; --surface:#ffffff; --surface-2:#efedea;
  --ink:#1a1917; --ink-2:#4a4640; --muted:#78736b;
  --line:#e0ddd6; --line-2:#cfcbc2;
  --accent:#0f524b; --accent-soft:#dceae6; --accent-ink:#0b3a35;
  --on-accent:#ffffff;
  --shadow:0 1px 2px rgba(26,25,23,.05), 0 8px 24px -12px rgba(26,25,23,.14);
  --r:3px;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --ground:#121211; --surface:#1b1a18; --surface-2:#242220;
    --ink:#efece6; --ink-2:#c3beb5; --muted:#948e84;
    --line:#2d2b28; --line-2:#3b3833;
    --accent:#63c3b2; --accent-soft:#16302c; --accent-ink:#8fd8ca; --on-accent:#0d1a18; --on-accent:#0d1a18;
    --shadow:0 1px 2px rgba(0,0,0,.5), 0 10px 28px -14px rgba(0,0,0,.7);
  }
}
:root[data-theme="dark"]{
  --ground:#121211; --surface:#1b1a18; --surface-2:#242220;
  --ink:#efece6; --ink-2:#c3beb5; --muted:#948e84;
  --line:#2d2b28; --line-2:#3b3833;
  --accent:#63c3b2; --accent-soft:#16302c; --accent-ink:#8fd8ca; --on-accent:#0d1a18;
  --shadow:0 1px 2px rgba(0,0,0,.5), 0 10px 28px -14px rgba(0,0,0,.7);
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--ink);
  font-family:"Archivo","Helvetica Neue",Arial,sans-serif;
  font-size:15px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit}
.wrap{max-width:1560px;margin:0 auto;padding:0 clamp(16px,3vw,40px)}

/* ---------- masthead ---------- */
.top{border-bottom:1px solid var(--line);background:var(--surface)}
.top-in{display:flex;align-items:center;justify-content:space-between;gap:20px;
  padding-block:14px;flex-wrap:wrap}
.mark{display:flex;align-items:baseline;gap:11px}
.mark b{font-weight:600;font-size:14px;letter-spacing:.24em;text-transform:uppercase}
.mark span{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.top-links{display:flex;gap:18px;font-size:11.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted)}
.top-links a{text-decoration:none;padding-bottom:2px;border-bottom:1px solid var(--line-2)}
.top-links a:hover{color:var(--accent);border-color:var(--accent)}

.hero{padding:clamp(38px,6vw,72px) 0 clamp(26px,3.4vw,38px);
  border-bottom:1px solid var(--line)}
.hero h1{
  font-family:"Instrument Serif",Georgia,"Times New Roman",serif;
  font-weight:400; font-size:clamp(46px,8.2vw,104px); line-height:.92;
  margin:0 0 18px; letter-spacing:-.015em; text-wrap:balance;
}
.hero h1 em{font-style:italic;color:var(--accent)}
.lede{max-width:60ch;color:var(--ink-2);font-size:16.5px;margin:0}
.lede code{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.86em;
  background:var(--surface-2);padding:1px 6px;border-radius:var(--r);color:var(--ink)}

.figures{display:flex;flex-wrap:wrap;gap:0;margin-top:34px;
  border-top:1px solid var(--line)}
.fig{flex:1 1 150px;padding:16px 20px 14px 0;border-right:1px solid var(--line)}
.fig:last-child{border-right:0}
.fig dt{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted);margin:0 0 6px}
.fig dd{margin:0;font-family:"IBM Plex Mono",ui-monospace,monospace;
  font-size:23px;font-weight:500;font-variant-numeric:tabular-nums;line-height:1}
.fig small{display:block;margin-top:5px;font-size:11.5px;color:var(--muted);
  font-family:"Archivo",sans-serif}

/* ---------- controls ---------- */
.controls{position:sticky;top:0;z-index:40;background:var(--surface);
  border-bottom:1px solid var(--line)}
.controls-in{display:flex;flex-direction:column;gap:0}
.bar{display:flex;align-items:center;gap:14px;padding:11px 0;flex-wrap:wrap}
.search{flex:1 1 260px;display:flex;align-items:center;gap:9px;
  background:var(--ground);border:1px solid var(--line-2);border-radius:var(--r);
  padding:0 11px;min-width:210px}
.search svg{flex:none;opacity:.5}
.search input{flex:1;border:0;background:transparent;color:var(--ink);
  font:inherit;padding:9px 0;outline:none}
.search input::placeholder{color:var(--muted)}
.search kbd{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--muted);
  border:1px solid var(--line-2);border-radius:2px;padding:1px 5px}
.selects{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
label.sel{display:flex;align-items:center;gap:7px;font-size:11px;
  letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
select{font:inherit;font-size:13px;color:var(--ink);background:var(--ground);
  border:1px solid var(--line-2);border-radius:var(--r);padding:7px 9px;outline:none}
select:focus-visible,.search:focus-within{border-color:var(--accent)}

.facets{display:flex;gap:26px;padding:0 0 12px;flex-wrap:wrap;align-items:flex-start}
.facet{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.facet>span{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted);margin-right:2px}
.chip{display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:12.5px;
  background:transparent;color:var(--ink-2);border:1px solid var(--line-2);
  border-radius:100px;padding:4.5px 11px;cursor:pointer;
  transition:background .13s,border-color .13s,color .13s}
.chip:hover{border-color:var(--ink-2);color:var(--ink)}
.chip .n{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--muted);
  font-variant-numeric:tabular-nums}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);
  color:var(--on-accent)}
.chip[aria-pressed="true"] .n{color:inherit;opacity:.72}
.dot{width:11px;height:11px;border-radius:100px;background:var(--c);
  border:1px solid rgba(0,0,0,.16);flex:none}

.status{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:9px 0;border-top:1px solid var(--line);font-size:12.5px;color:var(--muted);
  flex-wrap:wrap}
.status b{font-family:"IBM Plex Mono",monospace;color:var(--ink);font-weight:500;
  font-variant-numeric:tabular-nums}
.clear{font:inherit;font-size:12px;background:none;border:0;color:var(--accent);
  cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
.clear[hidden]{display:none}

/* ---------- grid ---------- */
main{padding:26px 0 80px}
.grid{display:grid;gap:clamp(16px,1.8vw,26px) clamp(12px,1.4vw,20px);
  grid-template-columns:repeat(auto-fill,minmax(212px,1fr))}
.grid.lg{grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}
.tile{content-visibility:auto;contain-intrinsic-size:auto 300px;margin:0}
.shot{display:block;width:100%;padding:0;border:1px solid var(--line);
  border-radius:var(--r);background:var(--surface-2);cursor:zoom-in;
  position:relative;overflow:hidden;aspect-ratio:3/2;
  transition:border-color .15s, box-shadow .15s}
.shot img{width:100%;height:100%;object-fit:cover;display:block}
.shot.nopreview{display:flex;align-items:center;justify-content:center;
  background:repeating-linear-gradient(45deg,var(--surface-2) 0 8px,var(--surface) 8px 16px)}
.noimg{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);text-align:center;line-height:1.6}
.noimg em{display:block;font-style:normal;font-size:10px;opacity:.75;
  letter-spacing:.06em;text-transform:none}
.shot:hover{border-color:var(--line-2);box-shadow:var(--shadow)}
.shot:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.badge{position:absolute;left:0;bottom:0;
  font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.05em;
  background:var(--surface);color:var(--ink-2);
  border-top:1px solid var(--line);border-right:1px solid var(--line);
  padding:3px 7px;border-radius:0 var(--r) 0 0}
.meta{display:grid;grid-template-columns:auto 1fr;gap:2px 9px;padding:9px 1px 0}
.sw{grid-row:1/3;width:13px;height:13px;border-radius:2px;background:var(--c);
  border:1px solid rgba(0,0,0,.18);margin-top:3px}
.code{grid-column:2;font-family:"IBM Plex Mono",monospace;font-size:11px;
  letter-spacing:.06em;color:var(--muted);font-variant-numeric:tabular-nums}
.nm{grid-column:2;margin:0;font-size:13.5px;font-weight:500;line-height:1.25;
  letter-spacing:-.005em;overflow-wrap:anywhere}
.sub{grid-column:2;margin:3px 0 0;font-size:11.5px;color:var(--muted)}

.empty{padding:80px 0;text-align:center;color:var(--muted)}
.empty p{margin:0 0 14px}

/* ---------- detail ---------- */
dialog{border:0;padding:0;max-width:min(1080px,94vw);width:100%;
  background:var(--surface);color:var(--ink);border-radius:var(--r);
  box-shadow:0 30px 90px -30px rgba(0,0,0,.55)}
dialog::backdrop{background:rgba(18,18,17,.72);backdrop-filter:blur(3px)}
.d-in{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr)}
.d-img{background:var(--surface-2);display:flex;align-items:center;
  justify-content:center;padding:26px;border-right:1px solid var(--line)}
.d-img img{width:100%;max-width:400px;max-height:60vh;display:block;
  border:1px solid var(--line)}
.d-body{padding:26px 28px 24px;display:flex;flex-direction:column;gap:18px;
  max-height:78vh;overflow-y:auto}
.d-head .kicker{font-family:"IBM Plex Mono",monospace;font-size:12px;
  letter-spacing:.1em;color:var(--accent);margin:0 0 6px;font-variant-numeric:tabular-nums}
.d-head h2{font-family:"Instrument Serif",Georgia,serif;font-weight:400;
  font-size:clamp(28px,3.4vw,42px);line-height:1.02;margin:0;letter-spacing:-.01em}
.spec{border-top:1px solid var(--line);margin:0}
.spec div{display:flex;justify-content:space-between;gap:16px;
  padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.spec dt{color:var(--muted);font-size:11px;letter-spacing:.13em;
  text-transform:uppercase;padding-top:2px}
.spec dd{margin:0;text-align:right;font-weight:500}
.spec dd .mono{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}
.swatch-row{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.swatch-row i{width:15px;height:15px;border-radius:2px;background:var(--c);
  border:1px solid rgba(0,0,0,.18)}
.d-sec h3{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted);margin:0 0 9px;font-weight:500}
.files{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px}
.files a{display:flex;align-items:center;gap:9px;text-decoration:none;
  font-size:12.5px;padding:6px 8px;border-radius:var(--r);color:var(--ink-2);
  border:1px solid transparent}
.files a:hover{background:var(--surface-2);color:var(--ink);border-color:var(--line)}
.files .ix{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--muted);
  flex:none;width:22px}
.files .fn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.files .tag{margin-left:auto;flex:none;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--accent);background:var(--accent-soft);
  padding:2px 6px;border-radius:2px}
.d-act{display:flex;gap:9px;flex-wrap:wrap;margin-top:auto;padding-top:4px}
.btn{font:inherit;font-size:12.5px;letter-spacing:.04em;padding:9px 15px;
  border-radius:var(--r);border:1px solid var(--line-2);background:var(--surface);
  color:var(--ink);cursor:pointer;text-decoration:none;display:inline-flex;
  align-items:center;gap:7px}
.btn:hover{border-color:var(--ink-2)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.d-close{position:absolute;top:10px;right:12px;z-index:2;width:32px;height:32px;
  border-radius:100px;border:1px solid var(--line);background:var(--surface);
  color:var(--ink);font-size:17px;line-height:1;cursor:pointer}
.d-nav{display:flex;gap:6px}
.d-nav button{width:32px;height:32px;border:1px solid var(--line-2);
  background:var(--surface);color:var(--ink);border-radius:var(--r);cursor:pointer;
  font-size:14px;line-height:1}
.d-nav button:disabled{opacity:.35;cursor:default}

footer{border-top:1px solid var(--line);padding:26px 0 46px;font-size:12px;
  color:var(--muted)}
footer p{margin:0 0 5px;max-width:70ch}
footer a{color:var(--accent)}

@media (max-width:820px){
  .d-in{grid-template-columns:1fr}
  .d-img{border-right:0;border-bottom:1px solid var(--line);padding:18px}
  .d-img img{max-height:44vh}
  .d-body{max-height:none;padding:20px}
  .figures .fig{flex-basis:44%}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}

@media print{
  .controls,.top-links,.hero .lede,footer,.d-act{display:none!important}
  body{background:#fff;color:#000;font-size:9pt}
  .grid{grid-template-columns:repeat(4,1fr);gap:10px}
  .tile{break-inside:avoid;content-visibility:visible}
  .shot{border-color:#bbb}
  .hero{padding:12px 0}
  .hero h1{font-size:30pt}
}
"""

JS = r"""
const DATA = JSON.parse(document.getElementById('cat').textContent);
const TONE = JSON.parse(document.getElementById('tonehex').textContent);
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const q = document.getElementById('q');
const sortSel = document.getElementById('sort');
const densSel = document.getElementById('dens');
const shownEl = document.getElementById('shown');
const clearBtn = document.getElementById('clear');
const dlg = document.getElementById('detail');

const state = {q:'', family:new Set(), size:new Set(), tone:new Set(), coll:new Set()};
let view = [];

const fmt = n => n.toLocaleString('en-IN');
const mm = s => s ? s.replace('x','×') + ' mm' : 'Size not stated';

function match(d){
  if(state.family.size && !state.family.has(d.family)) return false;
  if(state.size.size   && !state.size.has(d.size))     return false;
  if(state.tone.size   && !state.tone.has(d.tone))     return false;
  if(state.coll.size   && !state.coll.has(d.collection)) return false;
  if(state.q){
    const t = state.q;
    if(!(d.code.toLowerCase().includes(t) || d.name.toLowerCase().includes(t)
       || d.family.toLowerCase().includes(t) || d.size.includes(t))) return false;
  }
  return true;
}

const RANK = {PGVT:0, GVT:1, 'Wall':2, 'Full Body':3, Nano:4, Carving:5,
              'Double Charge':6, Floor:7, Roof:8, Parking:9};
const bycode = (a,b)=> (a.code||'zzzz').localeCompare(b.code||'zzzz','en',{numeric:true}) || a.name.localeCompare(b.name);
const sorters = {
  cat:(a,b)=> RANK[a.family]-RANK[b.family] || bycode(a,b),
  code:(a,b)=> (a.code||'zzzz').localeCompare(b.code||'zzzz','en',{numeric:true}) || a.name.localeCompare(b.name),
  name:(a,b)=> a.name.localeCompare(b.name) ,
  light:(a,b)=> b.lum - a.lum,
  dark:(a,b)=> a.lum - b.lum,
  faces:(a,b)=> b.n_faces - a.n_faces || (a.code||'').localeCompare(b.code||'','en',{numeric:true}),
};

function render(){
  view = DATA.filter(match).sort(sorters[sortSel.value]);
  grid.innerHTML = view.map((d,i)=>`
    <article class="tile">
      <button class="shot${d.img?'':' nopreview'}" data-i="${i}" aria-label="Open ${d.code} ${d.name}">
        ${d.img
          ? `<img src="${d.img}" alt="${d.name} — ${d.family} ${mm(d.size)} tile" loading="lazy" decoding="async">`
          : `<span class="noimg">No preview<em>open on Drive</em></span>`}
        ${d.n_faces>1?`<span class="badge">${d.n_faces} faces</span>`:''}
      </button>
      <div class="meta">
        <span class="sw" style="--c:${d.dom}" title="${d.tone}"></span>
        <span class="code">${d.code || '—'}</span>
        <h3 class="nm">${d.name}</h3>
        <p class="sub">${d.family} · ${mm(d.size)}${d.collection?' · '+d.collection:''}</p>
      </div>
    </article>`).join('');
  shownEl.textContent = fmt(view.length);
  empty.hidden = view.length > 0;
  const active = state.q || state.family.size || state.size.size || state.tone.size
                 || state.coll.size;
  clearBtn.hidden = !active;
}

document.querySelectorAll('.chip[data-k]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const set = state[btn.dataset.k], v = btn.dataset.v;
    set.has(v) ? set.delete(v) : set.add(v);
    btn.setAttribute('aria-pressed', set.has(v));
    render();
  });
});
q.addEventListener('input', ()=>{ state.q = q.value.trim().toLowerCase(); render(); });
sortSel.addEventListener('change', render);
densSel.addEventListener('change', ()=> grid.classList.toggle('lg', densSel.value==='lg'));
clearBtn.addEventListener('click', ()=>{
  state.q=''; q.value='';
  ['family','size','tone','coll'].forEach(k=>state[k].clear());
  document.querySelectorAll('.chip[data-k]').forEach(b=>b.setAttribute('aria-pressed','false'));
  render();
});
document.addEventListener('keydown', e=>{
  if(e.key==='/' && document.activeElement!==q && !dlg.open){ e.preventDefault(); q.focus(); }
});

/* ---- detail ---- */
let cur = -1;
function open(i){
  cur = i;
  const d = view[i];
  document.getElementById('d-kicker').textContent = d.code ? 'Design ' + d.code : d.family;
  document.getElementById('d-name').textContent = d.name;
  const img = document.getElementById('d-img');
  const none = document.getElementById('d-noimg');
  img.hidden = !d.img;
  none.hidden = !!d.img;
  if(d.img){
    img.src = d.img; img.alt = d.name + ' — ' + d.family + ' ' + mm(d.size);
    img.style.aspectRatio = d.aspect;
  }
  document.getElementById('d-fam').textContent  = d.family;
  document.getElementById('d-famn').textContent = d.famnote;
  document.getElementById('d-size').textContent = mm(d.size);
  document.getElementById('d-coll').textContent = d.collection || '—';
  document.getElementById('d-src').textContent  = d.source;
  document.getElementById('d-tone').textContent = d.tone;
  document.getElementById('d-swatch').style.setProperty('--c', d.dom);
  document.getElementById('d-hex').textContent  = d.dom.toUpperCase();
  document.getElementById('d-faces').textContent = d.n_faces + (d.n_faces===1?' image':' images');
  document.getElementById('d-files').innerHTML = d.faces.map((f,n)=>`
    <li><a href="https://drive.google.com/file/d/${f.id}/view" target="_blank" rel="noopener">
      <span class="ix">${String(n+1).padStart(2,'0')}</span>
      <span class="fn">${f.name}</span>
      ${f.render?'<span class="tag">Render</span>':''}
    </a></li>`).join('');
  document.getElementById('d-open').href = 'https://drive.google.com/file/d/' + d.faces[0].id + '/view';
  document.getElementById('d-prev').disabled = i<=0;
  document.getElementById('d-next').disabled = i>=view.length-1;
  document.getElementById('d-pos').textContent = (i+1) + ' / ' + fmt(view.length);
  if(!dlg.open) dlg.showModal();
}
grid.addEventListener('click', e=>{
  const b = e.target.closest('.shot'); if(b) open(+b.dataset.i);
});
document.getElementById('d-close').addEventListener('click', ()=> dlg.close());
document.getElementById('d-prev').addEventListener('click', ()=> open(cur-1));
document.getElementById('d-next').addEventListener('click', ()=> open(cur+1));
dlg.addEventListener('click', e=>{ if(e.target===dlg) dlg.close(); });
dlg.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft'  && cur>0) open(cur-1);
  if(e.key==='ArrowRight' && cur<view.length-1) open(cur+1);
});
document.getElementById('d-copy').addEventListener('click', async e=>{
  const d = view[cur];
  try{
    await navigator.clipboard.writeText(`${d.code} ${d.name} — ${d.family} ${mm(d.size)}`);
    e.currentTarget.textContent = 'Copied';
    setTimeout(()=> e.currentTarget.textContent = 'Copy reference', 1400);
  }catch(err){ e.currentTarget.textContent = 'Press Ctrl+C'; }
});

render();
"""


def chips(kind, counter, order=None, swatch=False):
    keys = order or [k for k, _ in counter.most_common()]
    out = []
    for k in keys:
        n = counter.get(k, 0)
        if not n:
            continue
        dot = f'<i class="dot" style="--c:{TONE_HEX[k]}"></i>' if swatch else ''
        out.append(
            f'<button class="chip" data-k="{kind}" data-v="{k}" aria-pressed="false">'
            f'{dot}{k}<span class="n">{n}</span></button>')
    return "\n".join(out)


for d in DATA:
    d['famnote'] = FAM_NOTE[d['family']]

def fmt(n): return f'{n:,}'

blob = json.dumps(DATA, separators=(',', ':'))
gen = datetime.date.today().strftime('%d %B %Y')

HTML = f"""<title>Naveen Tile Master Catalogue</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
<style>{CSS}</style>

<header class="top">
  <div class="wrap top-in">
    <div class="mark"><b>Naveen Tile</b><span>Master Catalogue</span></div>
    <nav class="top-links">
      <a href="https://drive.google.com/drive/folders/1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO" target="_blank" rel="noopener">New 11.08.2026</a>
      <a href="https://drive.google.com/drive/folders/1p836uZhZKqR8eBZ6z01xowOvDVvv7Oen" target="_blank" rel="noopener">All Designs</a>
      <a href="#grid">Browse</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="wrap">
    <h1>Every design<br>we make, <em>in one place.</em></h1>
    <p class="lede">The complete surface library — vitrified, glazed, carved, wall,
    floor and parking designs, indexed by code, format and tone. Built on
    {gen} from both design libraries — <code>DESIGNS NEW FOLDER 11.08.2026</code>
    and <code>ALL DESIGNS</code>. Every design links back to its original files
    on Drive.</p>
    <dl class="figures">
      <div class="fig"><dt>Designs</dt><dd>{fmt(len(DATA))}</dd><small>unique tile codes</small></div>
      <div class="fig"><dt>Bodies</dt><dd>{len(fam)}</dd><small>PGVT to parking</small></div>
      <div class="fig"><dt>Images</dt><dd>{fmt(faces)}</dd><small>faces &amp; renders</small></div>
      <div class="fig"><dt>Formats</dt><dd>{len(size)}</dd><small>300&#215;300 to 800&#215;1600 mm</small></div>
      <div class="fig"><dt>Series</dt><dd>{len(coll)}</dd><small>finishes &amp; collections</small></div>
    </dl>
  </div>
</section>

<section class="controls">
  <div class="wrap controls-in">
    <div class="bar">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="q" type="search" placeholder="Search a code or name — try 7130, or statuario" aria-label="Search designs">
        <kbd>/</kbd>
      </div>
      <div class="selects">
        <label class="sel">Sort
          <select id="sort">
            <option value="code">Code</option>
            <option value="cat">By body, then code</option>
            <option value="name">Name A–Z</option>
            <option value="light">Lightest first</option>
            <option value="dark">Darkest first</option>
            <option value="faces">Most faces</option>
          </select>
        </label>
        <label class="sel">Size
          <select id="dens">
            <option value="sm">Compact</option>
            <option value="lg">Large</option>
          </select>
        </label>
      </div>
    </div>
    <div class="facets">
      <div class="facet"><span>Body</span>{chips('family', fam, FAM_ORDER)}</div>
      <div class="facet"><span>Format</span>{chips('size', size, SIZE_ORDER)}</div>
      <div class="facet"><span>Tone</span>{chips('tone', tone, TONE_ORDER, swatch=True)}</div>
      <div class="facet"><span>Series</span>{chips('coll', coll)}</div>
    </div>
    <div class="status">
      <span>Showing <b id="shown">{fmt(len(DATA))}</b> of <b>{fmt(len(DATA))}</b> designs</span>
      <button class="clear" id="clear" hidden>Clear all filters</button>
    </div>
  </div>
</section>

<main class="wrap">
  <div class="grid" id="grid"></div>
  <div class="empty" id="empty" hidden>
    <p>No design matches those filters.</p>
    <button class="btn" onclick="document.getElementById('clear').click()">Clear filters</button>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Naveen Tile — Master Catalogue.</strong> {fmt(len(DATA))} designs indexed from
    {fmt(faces)} source images across both Drive libraries. Thumbnails are compressed
    previews; open any design to reach the full-resolution original on Google Drive.</p>
    <p>Codes, names, bodies and formats are read from the source folders and filenames;
    where a filename carried no code, the design is listed by name. Where a folder states no
    size — parking sheets and some full-body and nano lines — none is asserted here; read it
    off the sheet. Source folders:
    <a href="https://drive.google.com/drive/folders/1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO" target="_blank" rel="noopener">New 11.08.2026</a> ·
    <a href="https://drive.google.com/drive/folders/1p836uZhZKqR8eBZ6z01xowOvDVvv7Oen" target="_blank" rel="noopener">All Designs</a>.</p>
  </div>
</footer>

<dialog id="detail" aria-label="Design detail">
  <button class="d-close" id="d-close" aria-label="Close">&#215;</button>
  <div class="d-in">
    <div class="d-img">
      <img id="d-img" src="" alt="">
      <p id="d-noimg" class="noimg" hidden>No preview available<em>the original is still on Drive</em></p>
    </div>
    <div class="d-body">
      <div class="d-head">
        <p class="kicker" id="d-kicker"></p>
        <h2 id="d-name"></h2>
      </div>
      <dl class="spec">
        <div><dt>Body</dt><dd><span id="d-fam"></span><br><span style="font-weight:400;color:var(--muted);font-size:11.5px" id="d-famn"></span></dd></div>
        <div><dt>Format</dt><dd class="mono" id="d-size"></dd></div>
        <div><dt>Series</dt><dd id="d-coll"></dd></div>
        <div><dt>Library</dt><dd id="d-src"></dd></div>
        <div><dt>Tone</dt><dd><span class="swatch-row"><i id="d-swatch"></i><span id="d-tone"></span><span class="mono" style="color:var(--muted);font-size:11.5px" id="d-hex"></span></span></dd></div>
        <div><dt>Files</dt><dd class="mono" id="d-faces"></dd></div>
      </dl>
      <div class="d-sec">
        <h3>Source images on Drive — full resolution</h3>
        <ul class="files" id="d-files"></ul>
      </div>
      <div class="d-act">
        <a class="btn pri" id="d-open" href="#" target="_blank" rel="noopener">Open original</a>
        <button class="btn" id="d-copy">Copy reference</button>
        <span style="flex:1"></span>
        <span class="d-nav">
          <button id="d-prev" aria-label="Previous design">&#8249;</button>
          <button id="d-next" aria-label="Next design">&#8250;</button>
        </span>
        <span class="mono" id="d-pos" style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted);align-self:center"></span>
      </div>
    </div>
  </div>
</dialog>

<script type="application/json" id="tonehex">{json.dumps(TONE_HEX)}</script>
<script type="application/json" id="cat">{blob}</script>
<script>{JS}</script>
"""

open('naveen-tile-master-catalogue.html', 'w', encoding='utf-8').write(HTML)
print("wrote %.2f MB" % (len(HTML.encode()) / 1e6))
