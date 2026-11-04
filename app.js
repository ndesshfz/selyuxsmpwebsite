// ===== UTILS =====
// discount support: a product with `discount: 40` shows the new price, the old price struck through and a -40% tag
const finalPrice = (p) => (p.discount ? Math.round(p.price * (100 - p.discount) / 100) : p.price);
function priceHTML(p) {
    if (!p.discount) return formatPrice(p.price);
    return formatPrice(finalPrice(p)) +
        ' <span class="text-sm text-gray-500 line-through font-normal">' + formatPrice(p.price) + '</span>' +
        ' <span class="align-middle text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full font-sans">-' + p.discount + '%</span>';
}
const formatPrice = (price) => 'Rp ' + price.toLocaleString('id-ID');

// ===== PRODUCT RENDERING (shared by topup/rank/shop pages) =====
// Each page defines: window.productsData (array), window.CATEGORIES (optional, for tab pages),
// window.CART_ENABLED (true only on the topup page).
let cart = [];
let currentCategory = 'all';

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid || !window.productsData) return;

    grid.innerHTML = '';
    const filtered = currentCategory === 'all'
        ? window.productsData
        : window.productsData.filter(p => p.category === currentCategory);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-red-900/40 relative';

        const badgeHTML = product.badge
            ? `<div class="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)] z-10 border border-red-400">${product.badge}</div>`
            : '';

        const featuresHTML = (product.features || [])
            .map(f => `<li class="flex items-start gap-2 text-sm text-gray-300"><i class="fa-solid fa-check text-red-500 mt-1 text-xs"></i> <span>${f}</span></li>`)
            .join('');

        let actionHTML;
        if (product.pageUrl) {
            actionHTML = `<a href="${product.pageUrl}" class="page-link flex-1 py-3 rounded-xl bg-red-900/40 hover:bg-red-600 text-white font-bold text-sm transition-all border border-red-500/50 hover:border-red-400 hover:shadow-[0_0_15px_rgba(255,0,50,0.5)] flex items-center justify-center gap-2">
                <i class="fa-solid ${product.linkIcon || 'fa-arrow-right'}"></i> ${product.linkLabel || 'View'}
              </a>`;
        } else if (window.CART_ENABLED) {
            actionHTML = `<button onclick="addToCart('${product.id}')" class="flex-1 py-3 rounded-xl bg-red-900/40 hover:bg-red-600 text-white font-bold text-sm transition-all border border-red-500/50 hover:border-red-400 hover:shadow-[0_0_15px_rgba(255,0,50,0.5)] flex items-center justify-center gap-2">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
              </button>`;
        } else {
            actionHTML = `<a href="${product.discordUrl || 'https://discord.gg/ESbR2wCGe3'}" target="_blank" rel="noopener" class="flex-1 py-3 rounded-xl bg-red-900/40 hover:bg-red-600 text-white font-bold text-sm transition-all border border-red-500/50 hover:border-red-400 hover:shadow-[0_0_15px_rgba(255,0,50,0.5)] flex items-center justify-center gap-2">
                <i class="fa-brands fa-discord"></i> Order via Discord
              </a>`;
        }

        const detailsBtn = `<button onclick="openProductModal('${product.id}')" class="px-4 py-3 rounded-xl glass-panel border border-red-500/20 text-gray-300 hover:text-white hover:border-red-500 text-sm font-bold transition-all">
                <i class="fa-solid fa-circle-info"></i>
              </button>`;

        card.innerHTML = `
            ${badgeHTML}
            <div class="p-6 flex-1 flex flex-col">
                <h4 class="text-xl font-bold text-white font-heading">${product.name}</h4>
                <div class="text-2xl font-bold font-mono text-red-500 my-3">${priceHTML(product)}</div>
                <ul class="space-y-2 mb-6 flex-1">${featuresHTML}</ul>
                <div class="flex gap-2 mt-auto">
                    ${actionHTML}
                    ${detailsBtn}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== PRODUCT DETAIL MODAL =====
// Built once on first use and injected into <body>, so no page needs to
// carry this markup in its own HTML.
function ensureProductModal() {
    if (document.getElementById('productModal')) return;

    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.className = 'hidden fixed inset-0 bg-black/80 z-[70] flex items-center justify-center px-4';
    modal.innerHTML = `
        <div class="glass-panel rounded-2xl w-full max-w-md p-6 border border-red-500/30 relative max-h-[85vh] overflow-y-auto">
            <button onclick="closeProductModal()" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl"><i class="fa-solid fa-xmark"></i></button>
            <div id="pmBadge"></div>
            <h3 id="pmName" class="font-heading font-bold text-2xl text-white mb-1"></h3>
            <div id="pmPrice" class="text-2xl font-bold font-mono text-red-500 mb-4"></div>
            <p id="pmDescription" class="text-sm text-gray-400 mb-4"></p>
            <div class="glass-panel rounded-xl p-4 mb-5 border border-red-900/40">
                <div class="text-xs font-mono text-red-400 uppercase tracking-wide mb-3"><i class="fa-solid fa-star mr-1"></i> Included Perks &amp; Commands</div>
                <ul id="pmFeatures" class="space-y-2"></ul>
            </div>
            <div id="pmAction"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // click outside the panel closes it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductModal();
    });
}

function openProductModal(id) {
    ensureProductModal();
    const product = (window.productsData || []).find(p => p.id === id);
    if (!product) return;

    document.getElementById('pmBadge').innerHTML = product.badge
        ? `<div class="inline-block bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3">${product.badge}</div>`
        : '';
    document.getElementById('pmName').innerText = product.name;
    document.getElementById('pmPrice').innerHTML = priceHTML(product);

    const descEl = document.getElementById('pmDescription');
    // EDIT PRODUCT DESCRIPTIONS HERE: add a `description: "..."` field to
    // the matching product object inside each page's productsData array.
    if (product.description) {
        descEl.innerText = product.description;
        descEl.style.display = 'block';
    } else {
        descEl.style.display = 'none';
    }

    document.getElementById('pmFeatures').innerHTML = (product.features || [])
        .map(f => `<li class="flex items-start gap-2 text-sm text-gray-300"><i class="fa-solid fa-check text-red-500 mt-1 text-xs"></i> <span>${f}</span></li>`)
        .join('');

    let actionHTML;
    if (product.pageUrl) {
        actionHTML = `<a href="${product.pageUrl}" class="page-link block text-center w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-900 text-white font-bold hover:shadow-[0_0_20px_rgba(255,0,50,0.5)] transition-all"><i class="fa-solid ${product.linkIcon || 'fa-arrow-right'} mr-2"></i>${product.linkLabel || 'View'}</a>`;
    } else if (window.CART_ENABLED) {
        actionHTML = `<button onclick="addToCart('${product.id}'); closeProductModal();" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-900 text-white font-bold hover:shadow-[0_0_20px_rgba(255,0,50,0.5)] transition-all"><i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart</button>`;
    } else {
        actionHTML = `<a href="${product.discordUrl || 'https://discord.gg/ESbR2wCGe3'}" target="_blank" rel="noopener" class="block text-center w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-900 text-white font-bold hover:shadow-[0_0_20px_rgba(255,0,50,0.5)] transition-all"><i class="fa-brands fa-discord mr-2"></i>Order via Discord</a>`;
    }
    document.getElementById('pmAction').innerHTML = actionHTML;

    document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
}

// ===== SHOP TABS: sliding pill + morphing card grid =====
const TAB_BASE = 'category-btn px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-colors duration-300';
let tabBusy = 0;

// wraps the tab buttons in one glass bar that carries a sliding highlight pill (built once)
function ensureTabBar() {
    const first = document.querySelector('.category-btn');
    if (!first) return null;
    let bar = first.closest('.tab-bar');
    if (bar) return bar;
    const row = first.parentElement;
    const btns = Array.from(row.querySelectorAll('.category-btn'));
    bar = document.createElement('div');
    bar.className = 'tab-bar';
    const pill = document.createElement('span');
    pill.className = 'tab-pill';
    bar.appendChild(pill);
    btns.forEach((b) => bar.appendChild(b));
    row.appendChild(bar);
    const refit = () => movePill(document.getElementById('tab-' + currentCategory), true);
    window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    return bar;
}

function movePill(btn, instant) {
    const bar = btn && btn.closest('.tab-bar');
    if (!bar || !btn.offsetWidth) return;                 // hidden right now: it is measured the next time
    const pill = bar.querySelector('.tab-pill');
    const jump = instant || !pill.style.width || pill.style.width === '0px';
    if (jump) pill.style.transition = 'none';
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    if (jump) { void pill.offsetWidth; pill.style.transition = ''; }
}

function filterCategory(cat, opts) {
    const bar = ensureTabBar();
    const instant = !!(opts && opts.instant);
    currentCategory = cat;
    document.querySelectorAll('.category-btn').forEach((b) => {
        b.className = TAB_BASE + (b.id === 'tab-' + cat ? ' text-white' : ' text-gray-300 hover:text-red-400');
    });
    if (bar) movePill(document.getElementById('tab-' + cat), instant);

    const grid = document.getElementById(window.GRID_ID || 'productsGrid');
    if (!grid) { renderProducts(); return; }
    const hasCards = grid.children.length > 0;

    if (hasCards && grid.dataset.cat === cat) {          // already showing this tab (also covers A -> B -> A quick clicks)
        tabBusy++;
        Array.from(grid.children).forEach((c) => c.classList.remove('card-out'));
        grid.style.height = ''; grid.style.transition = ''; grid.style.overflow = '';
        return;
    }
    if (instant || !hasCards || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        grid.dataset.cat = cat;
        renderProducts();
        return;
    }

    // morph: old cards leave -> grid height eases to the new height -> new cards rise in one after another
    const token = ++tabBusy;
    const h0 = grid.offsetHeight;
    grid.style.height = h0 + 'px';
    grid.style.overflow = 'hidden';
    const leaving = Array.from(grid.children);
    leaving.forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('card-out'); });

    setTimeout(() => {
        if (token !== tabBusy) return;
        grid.dataset.cat = cat;
        renderProducts();
        Array.from(grid.children).forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('card-in'); });
        grid.style.height = 'auto';
        const h1 = grid.offsetHeight;
        grid.style.height = h0 + 'px';
        void grid.offsetHeight;
        grid.style.transition = 'height .6s cubic-bezier(.65, 0, .35, 1)';
        grid.style.height = h1 + 'px';
        setTimeout(() => {
            if (token !== tabBusy) return;
            grid.style.transition = ''; grid.style.height = ''; grid.style.overflow = '';
        }, 700);
    }, 260 + Math.min(leaving.length, 6) * 28);
}


// ===== CART LOGIC (only wired up on pages with window.CART_ENABLED = true) =====
function addToCart(id) {
    const product = window.productsData.find(p => p.id === id);
    if (!product) return;
    cart.push(product);
    updateCartUI();

    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        cartBadge.classList.add('scale-150');
        setTimeout(() => cartBadge.classList.remove('scale-150'), 200);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const list = document.getElementById('cartItemsList');
    const checkoutBtn = document.getElementById('btnCheckout');
    if (!badge || !list || !checkoutBtn) return;

    badge.innerText = cart.length;

    if (cart.length === 0) {
        list.innerHTML = '<div class="text-center py-10 text-gray-500 text-sm"><i class="fa-solid fa-box-open text-3xl mb-3 opacity-50 block"></i> Your cart is empty.</div>';
        document.getElementById('cartTotalPrice').innerText = 'Rp 0';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        list.innerHTML += `
            <div class="glass-panel p-3 rounded-xl flex items-center justify-between border border-red-900/40">
                <div>
                    <div class="text-sm font-bold text-white">${item.name}</div>
                    <div class="text-xs font-mono text-red-400">${formatPrice(item.price)}</div>
                </div>
                <button onclick="removeFromCart(${index})" class="text-gray-500 hover:text-red-500 p-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });

    const totalStr = formatPrice(total);
    document.getElementById('cartTotalPrice').innerText = totalStr;
    const modalSubtotal = document.getElementById('modalSubtotal');
    const modalTotal = document.getElementById('modalTotal');
    if (modalSubtotal) modalSubtotal.innerText = totalStr;
    if (modalTotal) modalTotal.innerText = totalStr;
}

function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const panel = document.getElementById('cartPanel');
    if (!drawer || !panel) return;

    if (drawer.classList.contains('opacity-0')) {
        drawer.classList.remove('opacity-0', 'pointer-events-none');
        panel.classList.remove('translate-x-full');
    } else {
        drawer.classList.add('opacity-0', 'pointer-events-none');
        panel.classList.add('translate-x-full');
    }
}

// ===== CHECKOUT (simulated — no real payment gateway wired up yet) =====
function proceedToCheckout() {
    toggleCart();
    document.getElementById('checkoutModal').classList.remove('hidden');
    document.getElementById('checkoutForm').classList.remove('hidden');
    document.getElementById('paymentSuccessBox').classList.add('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('mcUsername').value = '';
}

function processOrder(e) {
    e.preventDefault();
    const username = document.getElementById('mcUsername').value;

    const btn = document.getElementById('btnPayOrder');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing…';
    btn.disabled = true;

    // Simulated — swap this for a real fetch() to the Tripay backend when ready
    setTimeout(() => {
        document.getElementById('checkoutForm').classList.add('hidden');
        document.getElementById('paymentSuccessBox').classList.remove('hidden');
        document.getElementById('successMcName').innerText = username;

        cart = [];
        updateCartUI();

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
}

// ===== UTILITIES =====
function copyServerIP() {
    navigator.clipboard.writeText('play.selyuxsmp.xyz');
    const tooltip = document.getElementById('copyTooltip');
    if (!tooltip) return;
    tooltip.classList.remove('opacity-0');
    setTimeout(() => tooltip.classList.add('opacity-0'), 2000);
}

// ===== INTERACTIVE PARTICLE SCENE (3D particle cloud that reacts to the cursor) =====
(function () {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TAU = Math.PI * 2, F = 2.4;
    const COLORS = ['255,40,70', '255,120,140', '255,165,95'];
    const mouse = { x: 0, y: 0, nx: 0, ny: 0, active: false };
    const view = { ay: 0, ax: 0.25, px: 0, py: 0, nx: 0, ny: 0 };
    const back = Array.from({ length: 15 }, () => []);
    const front = Array.from({ length: 15 }, () => []);
    let W = 0, H = 0, dpr = 1, R = 300, cx = 0, cy = 0, N = 0, small = null, P = null;
    let burst = 0, lastT = 0;

    function build() {
        N = small ? 2000 : 5200;
        const f = () => new Float32Array(N);
        P = { x: f(), y: f(), z: f(), size: f(), tw: f(), col: new Uint8Array(N), ox: f(), oy: f(), vx: f(), vy: f(), sx: f(), sy: f() };
        for (let i = 0; i < N; i++) {
            const rho = 0.08 + 0.92 * Math.pow(Math.random(), 1.6);   // dense in the middle, fading outward
            const phi = Math.acos(1 - 2 * Math.random()), th = Math.random() * TAU;
            P.x[i] = rho * Math.sin(phi) * Math.cos(th);
            P.y[i] = rho * Math.cos(phi);
            P.z[i] = rho * Math.sin(phi) * Math.sin(th);
            P.size[i] = 0.5 + Math.pow(Math.random(), 3) * 1.6;
            P.tw[i] = Math.random() * TAU;
            const r = Math.random();
            P.col[i] = r < 0.12 ? 2 : (r < 0.4 ? 1 : 0);
        }
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        R = Math.min(W, H) * 0.5; cx = W * 0.5; cy = H * 0.47;
        const s = W < 700;
        if (s !== small) { small = s; build(); }
    }

    function flush(set) {
        for (let b = 0; b < 15; b++) {
            const arr = set[b];
            if (!arr.length) continue;
            ctx.fillStyle = 'rgba(' + COLORS[(b / 5) | 0] + ',' + ((b % 5 + 0.7) / 5.4).toFixed(2) + ')';
            for (let k = 0; k < arr.length; k += 3) {
                const s = arr[k + 2];
                ctx.fillRect(arr[k] - s / 2, arr[k + 1] - s / 2, s, s);
            }
            arr.length = 0;
        }
    }

    function frame(ms) {
        const t = ms / 1000, dt = Math.min(0.05, t - lastT); lastT = t;
        const tx = mouse.active ? mouse.nx : Math.sin(t * 0.25) * 0.3;     // drifts on its own when idle
        const ty = mouse.active ? mouse.ny : Math.cos(t * 0.21) * 0.2;
        view.nx += (tx - view.nx) * 0.08; view.ny += (ty - view.ny) * 0.08;
        view.px = view.nx; view.py = view.ny;
        view.ay += ((view.nx * 0.7 + window.scrollY * 0.0004) - view.ay) * 0.04;
        view.ax += ((0.25 + view.ny * 0.45) - view.ax) * 0.04;
        burst *= Math.pow(0.04, dt);                       // decays in ~1s

        const ay = t * 0.07 + view.ay, ax = view.ax;
        const cA = Math.cos(ay), sA = Math.sin(ay), cB = Math.cos(ax), sB = Math.sin(ax);
        const ex = 1 + burst * 0.35;

        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < N; i++) {
            const k = ex * (1 + 0.035 * Math.sin(t * 1.1 + P.tw[i]));
            const x = P.x[i] * k, y = P.y[i] * k, z = P.z[i] * k;
            const x1 = x * cA + z * sA, z1 = -x * sA + z * cA;
            const y1 = y * cB - z1 * sB, z2 = y * sB + z1 * cB;
            const s = F / (F + z2);
            const sx = cx + x1 * R * s + P.ox[i], sy = cy + y1 * R * s + P.oy[i];
            P.sx[i] = sx; P.sy[i] = sy;
            if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

            if (mouse.active) {                            // cursor pushes nearby particles away
                const dx = sx - mouse.x, dy = sy - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 16900 && d2 > 0.01) {
                    const d = Math.sqrt(d2), f = (1 - d / 130) * 1.6;
                    P.vx[i] += (dx / d) * f; P.vy[i] += (dy / d) * f;
                }
            }
            P.vx[i] = (P.vx[i] - P.ox[i] * 0.035) * 0.9; P.vy[i] = (P.vy[i] - P.oy[i] * 0.035) * 0.9;
            P.ox[i] += P.vx[i]; P.oy[i] += P.vy[i];

            const a = Math.max(0.08, Math.min(1, (s - 0.55) * 0.75)) * (0.65 + 0.35 * Math.sin(t * 2 + P.tw[i]));
            const sz = P.size[i] * s;
            (z2 < 0 ? back : front)[P.col[i] * 5 + Math.min(4, (a * 5) | 0)].push(sx, sy, sz);
        }

        ctx.globalCompositeOperation = 'lighter';          // overlapping particles add up into soft glow
        flush(back);
        flush(front);
        ctx.globalCompositeOperation = 'source-over';
    }

    function loop(ms) { frame(ms); requestAnimationFrame(loop); }

    function point(x, y) {
        mouse.x = x; mouse.y = y; mouse.active = true;
        mouse.nx = (x / W - 0.5) * 2; mouse.ny = (y / H - 0.5) * 2;
    }
    function shock(x, y) {                                 // click / tap = shockwave
        burst = 1;
        for (let i = 0; i < N; i++) {
            const dx = P.sx[i] - x, dy = P.sy[i] - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d < 280) { const f = (1 - d / 280) * 14; P.vx[i] += (dx / d) * f; P.vy[i] += (dy / d) * f; }
        }
    }

    window.addEventListener('resize', resize);
    resize();
    if (reduced) { frame(3000); return; }                  // static picture, no motion or interaction
    window.addEventListener('mousemove', (e) => point(e.clientX, e.clientY));
    window.addEventListener('mousedown', (e) => shock(e.clientX, e.clientY));
    document.documentElement.addEventListener('mouseleave', () => { mouse.active = false; });
    window.addEventListener('touchstart', (e) => { const p = e.touches[0]; if (p) { point(p.clientX, p.clientY); shock(p.clientX, p.clientY); } }, { passive: true });
    window.addEventListener('touchmove', (e) => { const p = e.touches[0]; if (p) point(p.clientX, p.clientY); }, { passive: true });
    window.addEventListener('touchend', () => { mouse.active = false; });
    requestAnimationFrame(loop);
})();

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const nav = navbar.firstElementChild;
    if (window.scrollY > 50) {
        nav.classList.add('bg-black/90', 'backdrop-blur-xl');
    } else {
        nav.classList.remove('bg-black/90', 'backdrop-blur-xl');
    }
});

// ===== MOBILE MENU TOGGLE =====
(function () {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
})();

// ===== FIRST-VISIT LOADER (counter 1 -> 100%) =====
// Only runs the first time the site is opened in a browser session.
// A script in <head> adds "first-visit" to <html>; when it's missing
// (i.e. the user is just moving between pages) the loader never shows.
(function () {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    const html = document.documentElement;
    if (!html.classList.contains('first-visit')) {
        loader.remove();
        return;
    }

    const percentEl = document.getElementById('loaderPercent');
    const ringEl = document.getElementById('loaderRingFill');
    const statusEl = document.getElementById('loaderStatus');
    const logoEl = document.getElementById('loaderLogo');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // reuse the navbar logo so the loader doesn't carry its own copy of the image
    const navLogo = document.querySelector('#navbar img');
    if (logoEl && navLogo) logoEl.src = navLogo.src;

    const RADIUS = 78;
    const CIRC = 2 * Math.PI * RADIUS;
    if (ringEl) {
        ringEl.style.strokeDasharray = CIRC;
        ringEl.style.strokeDashoffset = CIRC;
    }

    const statuses = [
        [0, 'Starting up…'],
        [30, 'Loading assets…'],
        [60, 'Preparing the store…'],
        [90, 'Almost ready…']
    ];

    const MIN_MS = reduced ? 400 : 2000;   // never finish faster than this
    const SOFT_CAP = 92;                   // hold here until the page has really loaded
    const startTime = performance.now();
    let pageLoaded = document.readyState === 'complete';
    let shown = 1;
    let finished = false;

    window.addEventListener('load', () => { pageLoaded = true; });

    function render(value) {
        const v = Math.min(100, Math.max(1, Math.round(value)));
        if (percentEl) percentEl.innerHTML = v + '<small>%</small>';
        if (ringEl) ringEl.style.strokeDashoffset = CIRC * (1 - v / 100);
        if (statusEl) {
            let label = statuses[0][1];
            statuses.forEach(([threshold, text]) => { if (v >= threshold) label = text; });
            statusEl.textContent = v >= 100 ? 'Welcome!' : label;
        }
    }

    function finish() {
        if (finished) return;
        finished = true;
        render(100);
        try { sessionStorage.setItem('selyux_loaded', '1'); } catch (e) {}
        setTimeout(() => {
            loader.classList.add('hide');
            setTimeout(() => {
                loader.remove();
                html.classList.remove('first-visit');
            }, 750);
        }, 380);
    }

    function frame(now) {
        if (finished) return;
        const elapsed = now - startTime;

        // eases from 1 up to the soft cap over ~MIN_MS
        const t = Math.min(elapsed / MIN_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        let target = 1 + (SOFT_CAP - 1) * eased;

        // once the page really loaded AND the minimum time passed, run to 100
        if (pageLoaded && elapsed >= MIN_MS) target = 100;

        // smooth approach so the number never jumps
        const step = Math.max(0.35, (target - shown) * 0.1);
        shown = Math.min(target, shown + step);
        render(shown);

        if (shown >= 100) { finish(); return; }
        requestAnimationFrame(frame);
    }

    render(1);
    requestAnimationFrame(frame);
    setTimeout(finish, 8000); // safety net
})();

// ===== BACK BUTTON (arrow to the previous page) =====
// Keeps a small page history in sessionStorage so pressing the arrow
// repeatedly walks back through the pages you visited.
(function () {
    const back = document.createElement('a');
    back.id = 'backBtn';
    back.className = 'back-btn page-link';
    back.setAttribute('aria-label', 'Go back');
    back.setAttribute('title', 'Back');
    back.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    document.body.appendChild(back);

    window.setBackTarget = function (href) {
        if (href) { back.setAttribute('href', href); back.classList.add('show'); }
        else { back.classList.remove('show'); }
    };
    if (window.__SPA) return; // the single-file preview drives the button from its own router

    const fileOf = (p) => (p.split('#')[0].split('?')[0].split('/').pop() || 'index.html');
    const cur = fileOf(location.pathname);
    let stack = [];
    try { stack = JSON.parse(sessionStorage.getItem('selyux_stack') || '[]'); } catch (e) {}
    while (stack.length && stack[stack.length - 1] === cur) stack.pop(); // e.g. after the browser Back button
    const save = () => { try { sessionStorage.setItem('selyux_stack', JSON.stringify(stack)); } catch (e) {} };
    save();

    window.setBackTarget(stack.length ? stack[stack.length - 1] : (cur === 'index.html' ? '' : 'index.html'));

    // capture phase: update the stack before the transition navigates away
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a.page-link');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || fileOf(href) === cur) return;
        if (a === back) stack.pop(); else stack.push(cur);
        save();
    }, true);
})();

// ===== PAGE TRANSITIONS (red curtain wipe, no loading screen) =====
// Links with class "page-link" cover the screen with a curtain that rises
// from the bottom, then the next page starts covered and uncovers upward.
// Anchors (#id) and external links (Discord/WhatsApp) are left alone.
(function () {
    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let leaving = false;

    // when the new page has finished its entrance animation, clean up
    if (html.classList.contains('page-entering')) {
        setTimeout(() => html.classList.remove('page-entering'), 1500);
    }

    // coming back with the browser Back/Forward button (bfcache): reset state
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            leaving = false;
            html.classList.remove('page-leaving', 'page-entering');
        }
    });

    document.addEventListener('click', function (e) {
        const link = e.target.closest('a.page-link');
        if (!link || leaving) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.target === '_blank') return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work

        // same page (e.g. clicking "Home" while on Home): don't replay the curtain
        const norm = (p) => p.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
        const target = new URL(href, window.location.href);
        if (norm(target.pathname) === norm(window.location.pathname) && target.search === window.location.search) {
            return;
        }

        e.preventDefault();
        leaving = true;

        if (reduced) {
            window.location.href = href;
            return;
        }

        const LABELS = { 'index.html': 'HOME', 'rank.html': 'RANKS', 'topup.html': 'TOPUP COINS', 'shop.html': 'SHOP' };
        const label = '→ ' + (LABELS[target.pathname.split('/').pop() || 'index.html'] || 'LOADING');
        html.style.setProperty('--pt-dest', '"' + label + '"');
        try { sessionStorage.setItem('selyux_nav', '1'); sessionStorage.setItem('selyux_dest', label); } catch (err) {}
        html.classList.add('page-leaving');
        setTimeout(() => { window.location.href = href; }, 780);
    });
})();

// warm up the gothic font used by the page-transition curtain
if (document.fonts && document.fonts.load) document.fonts.load('64px "Pirata One"');

// ===== BACKSOUND (generative dark ambient made with Web Audio — no audio file needed) =====
(function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const VOL = 0.32;
    const CHORDS = [[110, 130.81, 164.81], [87.31, 110, 130.81], [73.42, 110, 146.83], [82.41, 123.47, 164.81]]; // Am F Dm Em
    const BELLS = [880, 1046.5, 1318.5, 1568, 1760];
    const save = (v) => { try { localStorage.setItem('selyux_music', v); } catch (e) {} };
    let enabled = true;
    try { enabled = localStorage.getItem('selyux_music') !== 'off'; } catch (e) {}
    let ctx = null, master = null, padBus = null, bellBus = null, reverb = null;
    let running = false, chordIdx = 0, timers = [], btn = null;

    function build() {
        if (ctx) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0;
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp); comp.connect(ctx.destination);

        const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);   // reverb = decaying noise
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        reverb = ctx.createConvolver(); reverb.buffer = ir;
        const wet = ctx.createGain(); wet.gain.value = 0.6;
        reverb.connect(wet); wet.connect(master);

        padBus = ctx.createGain();
        const padLP = ctx.createBiquadFilter(); padLP.type = 'lowpass'; padLP.frequency.value = 1100;
        padBus.connect(padLP);
        const padDry = ctx.createGain(); padDry.gain.value = 0.8; padLP.connect(padDry); padDry.connect(master);
        const padSend = ctx.createGain(); padSend.gain.value = 0.7; padLP.connect(padSend); padSend.connect(reverb);

        bellBus = ctx.createGain();
        const echo = ctx.createDelay(1.5); echo.delayTime.value = 0.42;
        const fb = ctx.createGain(); fb.gain.value = 0.38;
        bellBus.connect(echo); echo.connect(fb); fb.connect(echo);
        echo.connect(reverb); bellBus.connect(reverb);
        const bellDry = ctx.createGain(); bellDry.gain.value = 0.5; bellBus.connect(bellDry); bellDry.connect(master);

        const dLP = ctx.createBiquadFilter(); dLP.type = 'lowpass'; dLP.frequency.value = 320; dLP.Q.value = 4;   // constant drone
        [[55, 'sawtooth', 0.07], [55.3, 'sawtooth', 0.06], [82.41, 'sine', 0.05], [27.5, 'sine', 0.09]].forEach(([f, type, g]) => {
            const o = ctx.createOscillator(), og = ctx.createGain();
            o.type = type; o.frequency.value = f; og.gain.value = g;
            o.connect(og); og.connect(dLP); o.start();
        });
        const lfo = ctx.createOscillator(), lfoG = ctx.createGain();      // slow filter sweep keeps the drone breathing
        lfo.frequency.value = 0.06; lfoG.gain.value = 140;
        lfo.connect(lfoG); lfoG.connect(dLP.frequency); lfo.start();
        const dSend = ctx.createGain(); dSend.gain.value = 0.35;
        dLP.connect(master); dLP.connect(dSend); dSend.connect(reverb);
    }

    function chord(freqs, when, dur) {
        freqs.forEach((f) => {
            [['sine', 0, 0.05], ['triangle', 5, 0.025]].forEach(([type, cents, peak]) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = type; o.frequency.value = f; o.detune.value = cents + (Math.random() * 6 - 3);
                g.gain.setValueAtTime(0, when);
                g.gain.linearRampToValueAtTime(peak, when + dur * 0.4);
                g.gain.linearRampToValueAtTime(0, when + dur);
                o.connect(g); g.connect(padBus);
                o.start(when); o.stop(when + dur + 0.1);
            });
        });
    }
    function bell(when) {
        const f = BELLS[(Math.random() * BELLS.length) | 0];
        [[1, 0.035], [2.01, 0.012]].forEach(([mul, peak]) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f * mul;
            g.gain.setValueAtTime(0.0001, when);
            g.gain.linearRampToValueAtTime(peak, when + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, when + 4);
            o.connect(g); g.connect(bellBus);
            o.start(when); o.stop(when + 4.1);
        });
    }
    function boom(when, amp) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'sine'; o.frequency.setValueAtTime(62, when); o.frequency.exponentialRampToValueAtTime(36, when + 0.6);
        lp.type = 'lowpass'; lp.frequency.value = 140;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(amp, when + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);
        o.connect(lp); lp.connect(g); g.connect(master);
        o.start(when); o.stop(when + 1.9);
    }

    function schedule() {
        const chordLoop = () => { if (!running) return; chord(CHORDS[chordIdx++ % CHORDS.length], ctx.currentTime + 0.1, 16); timers.push(setTimeout(chordLoop, 10000)); };
        const bellLoop = () => { if (!running) return; bell(ctx.currentTime + 0.05); timers.push(setTimeout(bellLoop, 3500 + Math.random() * 5500)); };
        const pulseLoop = () => { if (!running) return; const w = ctx.currentTime + 0.05; boom(w, 0.16); boom(w + 0.42, 0.1); timers.push(setTimeout(pulseLoop, 8000)); };
        chordLoop(); bellLoop(); timers.push(setTimeout(pulseLoop, 2500));
    }
    function ramp(to, secs) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(to, t + secs);
    }
    function paint() {
        if (!btn) return;
        btn.classList.toggle('on', running);
        btn.classList.toggle('wait', enabled && !running);
        btn.classList.toggle('off', !enabled);
        btn.title = !enabled ? 'Music off (click to turn on)' : (running ? 'Music on (click to mute)' : 'Click anywhere to start the music');
    }
    function begin(fade) {
        if (running) return;
        running = true;
        try { sessionStorage.setItem('selyux_audio', '1'); } catch (e) {}
        ramp(VOL, fade); schedule(); paint();
    }
    function start(fade) {
        build();
        const go = () => { if (enabled && ctx.state === 'running') begin(fade); };
        const p = ctx.resume();
        if (p && p.then) p.then(go).catch(() => {}); else go();
    }
    function stop(fade) {
        if (!ctx) return;
        running = false; timers.forEach(clearTimeout); timers = [];
        ramp(0, fade);
        setTimeout(() => { if (!running && ctx.state === 'running') ctx.suspend(); }, fade * 1000 + 80);
        paint();
    }

    btn = document.createElement('button');
    btn.id = 'musicBtn'; btn.type = 'button'; btn.className = 'music-btn';
    btn.setAttribute('aria-label', 'Toggle background music');
    btn.innerHTML = '<span class="eq"><b></b><b></b><b></b><b></b></span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
        if (!enabled) { enabled = true; save('on'); paint(); start(1.5); }
        else if (running) { enabled = false; save('off'); stop(0.8); }
        else start(1.5);
    });

    // browsers only allow sound after a user gesture: the first click/tap/key anywhere starts the music
    const unlock = (e) => {
        if (e.target && e.target.closest && e.target.closest('#musicBtn')) return;
        if (enabled && !running) start(2.5);
    };
    ['click', 'keydown', 'touchend', 'pointerup'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

    // multi-page site: fade out while a page transition starts, the next page fades it back in
    if (!window.__SPA) {
        document.addEventListener('click', (e) => {
            const a = e.target.closest && e.target.closest('a.page-link');
            if (!a || !running || (a.getAttribute('href') || '#').startsWith('#')) return;
            ramp(0, 0.6);
            setTimeout(() => { if (running && !document.hidden && master.gain.value < VOL * 0.5) ramp(VOL, 1.2); }, 1800); // link didn't navigate
        }, true);
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { if (running) stop(0.4); }
        else if (enabled && !running) start(1.5);
    });

    paint();
    let engaged = false;
    try { engaged = !!sessionStorage.getItem('selyux_audio'); } catch (e) {}
    if (enabled && engaged) start(1.8);   // already played on an earlier page: try to continue right away
})();

// ===== INIT (safe no-ops on pages without these elements) =====
renderProducts();
updateCartUI();

// shop page: style the tabs and park the pill on the active one
if (document.querySelector('.category-btn') && currentCategory !== 'all') filterCategory(currentCategory, { instant: true });
