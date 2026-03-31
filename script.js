/* =============================================
   CANVAS — NEURAL NET + CANDLESTICK BG
   ============================================= */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let nodes = [];
let candles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createNodes() {
    const count = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 16000));
    nodes = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
        cyan: Math.random() > 0.38,
        opacity: Math.random() * 0.4 + 0.25,
    }));
}

function createCandles() {
    const count = Math.floor((canvas.width * canvas.height) / 40000);
    candles = Array.from({ length: count }, () => {
        const scale = 20 + Math.random() * 50;
        const open = 50;
        const close = 50 + (Math.random() - 0.5) * scale;
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            open, close,
            high: Math.max(open, close) + Math.random() * scale * 0.35,
            low:  Math.min(open, close) - Math.random() * scale * 0.35,
            w: 4 + Math.random() * 7,
            scale,
        };
    });
}

function updateCandles() {
    for (const c of candles) {
        c.open = c.close;
        const drift = (Math.random() - 0.48) * c.scale * 0.25;
        c.close = Math.max(8, Math.min(92, c.close + drift));
        c.high = Math.max(c.open, c.close) + Math.random() * c.scale * 0.3;
        c.low  = Math.min(c.open, c.close) - Math.random() * c.scale * 0.3;
    }
}

function drawCandles() {
    for (const c of candles) {
        const up      = c.close >= c.open;
        const bodyTop = Math.max(c.open, c.close);
        const bodyBot = Math.min(c.open, c.close);
        const bodyH   = Math.max(bodyTop - bodyBot, 1.5);
        const a       = up ? 0.065 : 0.045;
        const wa      = a * 1.7;
        const col     = up ? `rgba(34,211,238,${a})`  : `rgba(168,85,247,${a})`;
        const wCol    = up ? `rgba(34,211,238,${wa})` : `rgba(168,85,247,${wa})`;

        ctx.strokeStyle = wCol;
        ctx.lineWidth = 1;

        // Upper wick
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - c.high);
        ctx.lineTo(c.x, c.y - bodyTop);
        ctx.stroke();

        // Lower wick
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - bodyBot);
        ctx.lineTo(c.x, c.y - c.low);
        ctx.stroke();

        // Body
        ctx.fillStyle = col;
        ctx.strokeStyle = wCol;
        ctx.lineWidth = 0.5;
        ctx.fillRect(c.x - c.w / 2, c.y - bodyTop, c.w, bodyH);
        ctx.strokeRect(c.x - c.w / 2, c.y - bodyTop, c.w, bodyH);
    }
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Candlestick layer (behind neural net)
    drawCandles();

    // Neural net edges
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 140;
            if (dist < maxDist) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / maxDist) * 0.22})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    // Neural net nodes
    for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.cyan ? `rgba(34,211,238,${n.opacity})` : `rgba(168,85,247,${n.opacity})`;
        ctx.fill();
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    }

    requestAnimationFrame(drawCanvas);
}

resizeCanvas();
createNodes();
createCandles();
drawCanvas();

// Slowly update candlestick prices every 3.5s
setInterval(updateCandles, 3500);

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeCanvas(); createNodes(); createCandles(); }, 200);
});

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
    typedEl.textContent = isDeleting
        ? current.substring(0, charIdx - 1)
        : current.substring(0, charIdx + 1);

    isDeleting ? charIdx-- : charIdx++;

    let delay = isDeleting ? 55 : 95;
    if (!isDeleting && charIdx === current.length) {
        delay = 2000; isDeleting = true;
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
   LIVE TICKER TAPE
   ============================================= */

// ← PASTE YOUR FREE FINNHUB KEY HERE (finnhub.io → sign up → API Keys)
const FINNHUB_KEY = 'd75plfpr01qk56kdlj7gd75plfpr01qk56kdlj80';

const STOCKS = [
    { symbol: 'SPY', label: 'SPY' },
    { symbol: 'GLD', label: 'GLD' },
    { symbol: 'TLT', label: 'TLT' },
    { symbol: 'USO', label: 'USO' },
];

async function fetchStocks() {
    const results = await Promise.allSettled(
        STOCKS.map(async ({ symbol, label }) => {
            const res = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
            );
            const d = await res.json();
            if (!d.c || d.c === 0) throw new Error('no data');
            return { label, pct: d.dp };
        })
    );
    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
}

async function fetchCrypto() {
    const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
        { signal: AbortSignal.timeout(5000) }
    );
    const d = await res.json();
    return [
        { label: 'BTC', pct: d.bitcoin?.usd_24h_change },
        { label: 'ETH', pct: d.ethereum?.usd_24h_change },
    ].filter(t => t.pct != null);
}

// RAF ticker state
let tickerOffset = 0;
let tickerHalfW  = 0;
let tickerRAF    = null;
const TICKER_SPEED = 0.7; // px per frame (~42px/s at 60fps)

function tickerLoop() {
    const inner = document.getElementById('tickerInner');
    if (!inner) return;
    tickerOffset -= TICKER_SPEED;
    if (tickerHalfW > 0 && Math.abs(tickerOffset) >= tickerHalfW) {
        tickerOffset = 0; // seamless reset at exactly one set width
    }
    inner.style.transform = `translateX(${tickerOffset}px)`;
    tickerRAF = requestAnimationFrame(tickerLoop);
}

function startTicker() {
    if (tickerRAF) cancelAnimationFrame(tickerRAF);
    tickerOffset = 0;
    // Measure after paint so scrollWidth is accurate
    requestAnimationFrame(() => {
        const inner = document.getElementById('tickerInner');
        if (inner) tickerHalfW = inner.scrollWidth / 2;
        tickerRAF = requestAnimationFrame(tickerLoop);
    });
}

function buildTickerHTML(tickers) {
    const items = tickers.map(({ label, pct }) => {
        const up    = pct >= 0;
        const abs   = Math.abs(pct).toFixed(2);
        const cls   = up ? 'up' : 'dn';
        const arrow = up ? '▲' : '▼';
        return `<span class="ti"><span class="tk">${label}</span> <span class="${cls}">${arrow} ${abs}%</span></span><span class="ti sep">·</span>`;
    }).join('');
    return items + items; // duplicate so reset is invisible
}

function setTickerContent(html) {
    const inner = document.getElementById('tickerInner');
    if (!inner) return;
    inner.innerHTML = html;
    startTicker();
}

async function updateTicker() {
    try {
        const [stocks, crypto] = await Promise.allSettled([fetchStocks(), fetchCrypto()]);
        const all = [
            ...(stocks.status === 'fulfilled' ? stocks.value : []),
            ...(crypto.status === 'fulfilled' ? crypto.value : []),
        ];
        if (all.length === 0) return;
        setTickerContent(buildTickerHTML(all));
    } catch (e) {
        // keep current content on failure
    }
}

// Boot
const fallbackTickers = ['SPY', 'GLD', 'TLT', 'USO', 'BTC', 'ETH'].map(l => ({ label: l, pct: 0 }));
setTickerContent(buildTickerHTML(fallbackTickers));

updateTicker();
setInterval(updateTicker, 60000);

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
