/* =============================================
   CANVAS — NEURAL NET + CANDLESTICK BG
   ============================================= */
// Removed to make the website simpler and black & white.

/* =============================================
   TYPEWRITER
   ============================================= */
const phrases = [
    'quantitative systems.',
    'ML pipelines.',
    'blockchain oracles.',
    'prediction markets.',
    'multi-agent AI.',
];

let phraseIdx = 0, charIdx = 0, isDeleting = false;
const typedEl = document.getElementById('typed-text');

function type() {
    const current = phrases[phraseIdx];
    
    if (isDeleting) {
        charIdx--;
    } else {
        charIdx++;
    }
    
    typedEl.textContent = current.substring(0, charIdx);

    let delay = isDeleting ? 40 : 80;
    if (!isDeleting && charIdx === current.length) {
        delay = 2000; 
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        delay = 350;
    }
    setTimeout(type, delay);
}
type();

/* =============================================
   NAVBAR SCROLL
   ============================================= */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* =============================================
   HAMBURGER MENU
   ============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const hSpans = hamburger.querySelectorAll('span');

hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hSpans[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
    hSpans[1].style.opacity  = open ? '0' : '';
    hSpans[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
});

mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hSpans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}));

/* =============================================
   SCROLL REVEAL
   ============================================= */
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(idx * 0.07, 0.35)}s`;
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
    });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* =============================================
   NUMBER COUNTER
   ============================================= */
const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const startTime = performance.now();

        function update(now) {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        counterObs.unobserve(el);
    });
}, { threshold: 0.4 });

document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

/* =============================================
   LIVE TICKER TAPE — news channel style
   ============================================= */

const FINNHUB_KEY = 'd75plfpr01qk56kdlj7gd75plfpr01qk56kdlj80';

// US ETFs via Finnhub (real-time, one call each)
const FINNHUB_TICKERS = [
    { symbol: 'SPY', label: 'S&P 500' },
    { symbol: 'QQQ', label: 'NASDAQ'  },
    { symbol: 'GLD', label: 'GOLD'    },
    { symbol: 'USO', label: 'OIL'     },
    { symbol: 'TLT', label: 'BONDS'   },
];

// Global indices via Yahoo Finance → corsproxy.io (one call each, graceful fallback)
const YAHOO_TICKERS = [
    { symbol: '%5EN225',  label: 'NIKKEI 225' },
    { symbol: '%5EKS11',  label: 'KOSPI'      },
    { symbol: '%5EBSESN', label: 'SENSEX'     },
    { symbol: '%5EGDAXI', label: 'DAX'        },
    { symbol: '%5EFTSE',  label: 'FTSE 100'   },
    { symbol: '%5EHSI',   label: 'HANG SENG'  },
    { symbol: '%5EN100',  label: 'CAC 40'     },
];

async function fetchFinnhub() {
    const results = await Promise.allSettled(
        FINNHUB_TICKERS.map(async ({ symbol, label }) => {
            const r = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
                { signal: AbortSignal.timeout(5000) }
            );
            const d = await r.json();
            if (!d.c || d.c === 0) throw new Error('no data');
            return { label, pct: d.dp };
        })
    );
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

async function fetchYahoo() {
    const results = await Promise.allSettled(
        YAHOO_TICKERS.map(async ({ symbol, label }) => {
            const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const r = await fetch(
                `https://corsproxy.io/?${encodeURIComponent(yUrl)}`,
                { signal: AbortSignal.timeout(7000) }
            );
            const d = await r.json();
            const pct = d?.chart?.result?.[0]?.meta?.regularMarketChangePercent;
            if (pct == null) throw new Error('no data');
            return { label, pct };
        })
    );
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

async function fetchCrypto() {
    const r = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
        { signal: AbortSignal.timeout(5000) }
    );
    const d = await r.json();
    return [
        { label: 'BTC', pct: d.bitcoin?.usd_24h_change },
        { label: 'ETH', pct: d.ethereum?.usd_24h_change },
    ].filter(t => t.pct != null);
}

/* --- Ticker DOM animation (node-recycling, right→left) --- */

let txX       = 0;
let txLastTS  = null;
let txRAF     = null;
const TX_SPEED = 75; // px/s — adjust to taste

function makeTiNode({ label, pct }) {
    const up  = pct >= 0;
    const el  = document.createElement('span');
    el.className = 'ti-item';
    el.innerHTML =
        `<span class="ti"><span class="tk">${label}</span>` +
        `<span class="${up ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%</span></span>` +
        `<span class="ti sep">·</span>`;
    return el;
}

function populateTicker(tickers) {
    const inner = document.getElementById('tickerInner');
    if (!inner) return;

    if (txRAF) { cancelAnimationFrame(txRAF); txRAF = null; }

    inner.innerHTML = '';
    tickers.forEach(t => inner.appendChild(makeTiNode(t)));

    // Clone until content is at least 3× viewport wide — guarantees no gap ever
    let passes = 0;
    while (inner.scrollWidth < window.innerWidth * 3 && passes++ < 10) {
        tickers.forEach(t => inner.appendChild(makeTiNode(t)));
    }

    txX = 0;
    txLastTS = null;
    inner.style.transform = 'translateX(0px)';
    txRAF = requestAnimationFrame(txStep);
}

function txStep(ts) {
    if (txLastTS === null) txLastTS = ts;
    const dt = Math.min((ts - txLastTS) / 1000, 0.05);
    txLastTS = ts;

    txX -= TX_SPEED * dt;

    const inner = document.getElementById('tickerInner');
    if (!inner) { txRAF = requestAnimationFrame(txStep); return; }

    // Recycle: first child fully off-screen left → append to end
    // First child offsetLeft is always 0 in flex, so right edge = txX + offsetWidth
    const first = inner.firstElementChild;
    if (first && txX + first.offsetWidth < 0) {
        txX += first.offsetWidth;   // shift so no visual jump
        inner.appendChild(first);   // re-enters from right
    }

    inner.style.transform = `translateX(${txX}px)`;
    txRAF = requestAnimationFrame(txStep);
}

async function refreshTicker() {
    // Fire all 3 sources in parallel — one round of calls per minute
    const [stocks, indices, crypto] = await Promise.allSettled([
        fetchFinnhub(),
        fetchYahoo(),
        fetchCrypto(),
    ]);

    const all = [
        ...(stocks.status  === 'fulfilled' ? stocks.value  : []),
        ...(indices.status === 'fulfilled' ? indices.value : []),
        ...(crypto.status  === 'fulfilled' ? crypto.value  : []),
    ];

    if (all.length > 0) populateTicker(all);
}

// Boot: show labels with dashes immediately, then fetch real data
const FALLBACK = [
    ...FINNHUB_TICKERS.map(t => ({ label: t.label, pct: 0 })),
    ...YAHOO_TICKERS.map(t  => ({ label: t.label, pct: 0 })),
    { label: 'BTC', pct: 0 },
    { label: 'ETH', pct: 0 },
];
populateTicker(FALLBACK);
refreshTicker();
setInterval(refreshTicker, 60000);

/* =============================================
   SMOOTH ANCHOR SCROLL (fallback)
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});
