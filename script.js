/* =========== NAV SCROLL =========== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
  // hide ticker once past the cover's "field note" zone
  const aboutEl = document.getElementById('about');
  if(aboutEl){
    const trigger = aboutEl.offsetTop - 200;
    nav.classList.toggle('past-hero', window.scrollY > trigger);
  }
}, { passive: true });

/* =========== CLOCK =========== */
function tickClock(){
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2,'0');
  const mm = String(now.getUTCMinutes()).padStart(2,'0');
  const ss = String(now.getUTCSeconds()).padStart(2,'0');
  const tEl = document.getElementById('telexTime');
  if(tEl) tEl.textContent = `${hh}:${mm}:${ss} UTC`;
  const local = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const lt = document.getElementById('localTime');
  if(lt) lt.textContent = `Local · ${local} IST`;
}
tickClock();
setInterval(tickClock,1000);

/* =========== REVEAL =========== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(!e.isIntersecting) return;
    const sibs = Array.from(e.target.parentElement.querySelectorAll('.reveal'));
    const i = sibs.indexOf(e.target);
    e.target.style.transitionDelay = `${Math.min(i*0.06,0.3)}s`;
    e.target.classList.add('vis');
    io.unobserve(e.target);
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* =========== TICKER (Finnhub + Yahoo-via-proxy + CoinGecko) =========== */
const FINNHUB_KEY = 'd75plfpr01qk56kdlj7gd75plfpr01qk56kdlj80';
const FINNHUB = [
  { symbol:'SPY', label:'S&P 500' },
  { symbol:'QQQ', label:'NASDAQ'  },
  { symbol:'GLD', label:'GOLD'    },
  { symbol:'USO', label:'OIL'     },
  { symbol:'TLT', label:'BONDS'   },
];
const YAHOO = [
  { symbol:'%5EN225',  label:'NIKKEI'   },
  { symbol:'%5EKS11',  label:'KOSPI'    },
  { symbol:'%5EBSESN', label:'SENSEX'   },
  { symbol:'%5EGDAXI', label:'DAX'      },
  { symbol:'%5EFTSE',  label:'FTSE'     },
  { symbol:'%5EHSI',   label:'HANG SENG'},
];

async function fetchFinnhub(){
  const r = await Promise.allSettled(FINNHUB.map(async ({symbol,label})=>{
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, {signal:AbortSignal.timeout(5000)});
    const d = await res.json();
    if(!d.c || d.c===0) throw 0;
    return { label, pct:d.dp };
  }));
  return r.filter(x=>x.status==='fulfilled').map(x=>x.value);
}
async function fetchYahoo(){
  const r = await Promise.allSettled(YAHOO.map(async ({symbol,label})=>{
    const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yUrl)}`, {signal:AbortSignal.timeout(7000)});
    const d = await res.json();
    const pct = d?.chart?.result?.[0]?.meta?.regularMarketChangePercent;
    if(pct==null) throw 0;
    return { label, pct };
  }));
  return r.filter(x=>x.status==='fulfilled').map(x=>x.value);
}
async function fetchCrypto(){
  try{
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', {signal:AbortSignal.timeout(5000)});
    const d = await res.json();
    return [
      { label:'BTC', pct:d.bitcoin?.usd_24h_change },
      { label:'ETH', pct:d.ethereum?.usd_24h_change },
    ].filter(t=>t.pct!=null);
  }catch(e){ return []; }
}

let txX=0, txLastTS=null, txRAF=null;
const TX_SPEED=70;

function makeTi({label,pct}){
  const up = pct>=0;
  const el = document.createElement('span');
  el.className='ti-item';
  el.innerHTML =
    `<span class="ti"><span class="tk">${label}</span>`+
    `<span class="${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(pct).toFixed(2)}%</span></span>`+
    `<span class="ti sep">·</span>`;
  return el;
}
function populate(arr){
  const inner = document.getElementById('tickerInner');
  if(!inner) return;
  if(txRAF){cancelAnimationFrame(txRAF);txRAF=null;}
  inner.innerHTML='';
  arr.forEach(t=>inner.appendChild(makeTi(t)));
  let pass=0;
  while(inner.scrollWidth < window.innerWidth*3 && pass++<10){
    arr.forEach(t=>inner.appendChild(makeTi(t)));
  }
  txX=0;txLastTS=null;
  inner.style.transform='translateX(0)';
  txRAF=requestAnimationFrame(step);
}
function step(ts){
  if(txLastTS===null) txLastTS=ts;
  const dt = Math.min((ts-txLastTS)/1000,0.05);
  txLastTS=ts;
  txX -= TX_SPEED*dt;
  const inner = document.getElementById('tickerInner');
  if(!inner){ txRAF=requestAnimationFrame(step); return; }
  const first = inner.firstElementChild;
  if(first && txX + first.offsetWidth < 0){
    txX += first.offsetWidth;
    inner.appendChild(first);
  }
  inner.style.transform=`translateX(${txX}px)`;
  txRAF=requestAnimationFrame(step);
}

async function refresh(){
  const [a,b,c] = await Promise.allSettled([fetchFinnhub(), fetchYahoo(), fetchCrypto()]);
  const all = [
    ...(a.status==='fulfilled'?a.value:[]),
    ...(b.status==='fulfilled'?b.value:[]),
    ...(c.status==='fulfilled'?c.value:[]),
  ];
  if(all.length>0) populate(all);
}

const FALLBACK = [
  ...FINNHUB.map(t=>({label:t.label,pct:0.01})),
  ...YAHOO.map(t=>({label:t.label,pct:-0.01})),
  {label:'BTC',pct:0.01},{label:'ETH',pct:0.01},
];
populate(FALLBACK);
refresh();
setInterval(refresh, 60000);

/* =========== SPARKLINE =========== */
function drawSpark(id, seed){
  const svg = document.getElementById(id);
  if(!svg) return;
  const w=400, h=90;
  const n=60;
  let y=45;
  const pts=[];
  let rng = seed;
  for(let i=0;i<n;i++){
    rng = (rng*9301+49297) % 233280;
    const r = (rng/233280 - 0.5)*8;
    y = Math.max(10, Math.min(80, y + r + (i>30?0.3:-0.1)));
    pts.push([i*(w/(n-1)), y]);
  }
  const path = pts.map((p,i)=> (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const fill = path + ` L ${w},${h} L 0,${h} Z`;
  svg.innerHTML = `
    <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b4422c" stop-opacity=".25"/>
      <stop offset="1" stop-color="#b4422c" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${fill}" fill="url(#g${id})"/>
    <path d="${path}" fill="none" stroke="#b4422c" stroke-width="1.3"/>
    <line x1="0" y1="45" x2="${w}" y2="45" stroke="#c9c3b5" stroke-dasharray="2,3"/>
  `;
}
drawSpark('sparkA', 12345);

/* =========== SMOOTH SCROLL =========== */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const t = document.querySelector(a.getAttribute('href'));
    if(!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({top, behavior:'smooth'});
  });
});