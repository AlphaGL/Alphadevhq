(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('kora:' + k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem('kora:' + k, JSON.stringify(v)); } catch { } } };

  const SIZES = (sold = []) => ({ name: 'Size', choices: ['S', 'M', 'L', 'XL', 'XXL'].map(s => ({ label: s, soldOut: sold.includes(s) })) });
  const SHOE = (sold = []) => ({ name: 'Size (EU)', choices: ['40', '41', '42', '43', '44', '45'].map(s => ({ label: s, soldOut: sold.includes(s) })) });

  const products = [
    { id: 'ankara-shirt', cat: 'clothing', name: 'Ankara Print Shirt', price: 18500, img: 'img/print-shirt.jpg', badge: 'Bestseller', rating: 4.8, reviews: 214, order: 1, isNew: 3, kicker: 'Clothing · Made in Lagos',
      desc: 'Bold, breathable cotton with a relaxed fit.', long: 'Cut from 100% Nigerian cotton wax print with a relaxed boxy fit, camp collar and coconut buttons. Each shirt is slightly unique.', meta: [['ruler', 'True to size'], ['leaf', '100% cotton']], options: [SIZES(['XXL'])] },
    { id: 'adire-shirt', cat: 'clothing', name: 'Adire Garden Shirt', price: 21000, img: 'img/print-shirt-green.jpg', rating: 4.7, reviews: 96, order: 6, isNew: 1, kicker: 'Clothing · Made in Abeokuta',
      desc: 'Hand-dyed adire in deep greens and gold.', long: 'Hand-dyed in Abeokuta using traditional adire methods, so no two are identical. Long sleeves you can roll.', meta: [['ruler', 'Slim fit'], ['leaf', 'Hand-dyed']], options: [SIZES(['S'])] },
    { id: 'denim-jacket', cat: 'clothing', name: 'Classic Denim Jacket', price: 32000, was: 38000, img: 'img/denim-jacket.jpg', badge: 'Sale', rating: 4.8, reviews: 187, order: 4, isNew: 6, kicker: 'Clothing',
      desc: 'Mid-wash trucker jacket. Layers over anything.', long: 'A mid-wash trucker jacket in sturdy 13oz denim that softens with every wear. Chest pockets, button cuffs.', meta: [['ruler', 'Regular fit']], options: [SIZES(['XL'])] },
    { id: 'cloud-knit', cat: 'shoes', name: 'Cloud Knit Sneaker', price: 45000, img: 'img/sneaker-white.jpg', badge: 'Trending', rating: 4.9, reviews: 342, order: 0, isNew: 2, kicker: 'Shoes',
      desc: 'Featherlight knit upper and a cushioned sole.', long: 'A breathable knit upper on a cushioned foam sole that feels light all day. Pull-on loop at the heel.', meta: [['truck', 'Ships in 24h']], options: [SHOE(['45'])] },
    { id: 'burgundy-low', cat: 'shoes', name: 'Burgundy Leather Low', price: 52000, img: 'img/sneaker-burgundy.jpg', rating: 4.7, reviews: 121, order: 8, isNew: 5, kicker: 'Shoes',
      desc: 'Polished leather sneaker that dresses up or down.', long: 'Full-grain leather with a high-shine finish and a contrast sole. Smart enough for the office, relaxed enough for the weekend.', meta: [['award', 'Full-grain leather']], options: [SHOE(['40', '41'])] },
    { id: 'velocity', cat: 'shoes', name: 'Velocity Runner', price: 31500, was: 39500, img: 'img/runner-blue.jpg', badge: 'Sale', rating: 4.6, reviews: 158, order: 11, isNew: 9, kicker: 'Shoes',
      desc: 'Responsive running shoe with a grippy outsole.', long: 'A lightweight runner with responsive foam and a grippy rubber outsole. Great for the gym or a morning jog.', options: [SHOE()] },
    { id: 'tan-satchel', cat: 'bags', name: 'Tan Leather Satchel', price: 68000, img: 'img/satchel.jpg', badge: 'Handmade', rating: 4.9, reviews: 77, order: 2, isNew: 7, kicker: 'Bags',
      desc: 'Hand-stitched vegetable-tanned leather.', long: 'Hand-stitched from vegetable-tanned leather with an embossed front, adjustable strap and room for a 13" laptop.', meta: [['award', 'Handmade'], ['ruler', '32 × 24 × 9 cm']] },
    { id: 'sage-bag', cat: 'bags', name: 'Sage Top-Handle Bag', price: 74000, img: 'img/handbag-green.jpg', rating: 4.8, reviews: 64, order: 5, isNew: 0, kicker: 'Bags',
      desc: 'Structured textured leather with a detachable strap.', long: 'A structured top-handle bag in textured sage leather, with a detachable shoulder strap and a gold-tone lock.', meta: [['sparkle', 'New in']],
      options: [{ name: 'Colour', choices: [{ label: 'Sage', swatch: '#8fa58a' }, { label: 'Black', swatch: '#151515' }, { label: 'Cream', swatch: '#efe6d3', soldOut: true }] }] },
    { id: 'heritage-tote', cat: 'bags', name: 'Heritage Tote', price: 47000, was: 59000, img: 'img/handbag-brown.jpg', badge: 'Sale', rating: 4.7, reviews: 52, order: 9, isNew: 10, kicker: 'Bags',
      desc: 'A roomy everyday tote in rich brown leather.', long: 'Roomy enough for everything, with a zipped inner pocket and a protective base. Rich brown leather that ages beautifully.' },
    { id: 'chrono', cat: 'accessories', name: 'Chrono Steel Watch', price: 89000, img: 'img/watch-steel.jpg', rating: 4.9, reviews: 103, order: 3, isNew: 8, kicker: 'Accessories',
      desc: 'Stainless steel chronograph, 100m water resistant.', long: 'A 42mm stainless steel chronograph with sapphire-coated glass, luminous hands and 100m water resistance. Two-year warranty.', meta: [['shield', '2-year warranty']] },
    { id: 'retro-digital', cat: 'accessories', name: 'Retro Digital Watch', price: 24500, img: 'img/watch-digital.jpg', rating: 4.8, reviews: 266, order: 10, isNew: 12, kicker: 'Accessories',
      desc: 'The classic. Alarm, stopwatch and backlight.', long: 'The iconic digital watch: alarm, stopwatch, backlight and a battery that lasts years.' },
    { id: 'gradient-shades', cat: 'accessories', name: 'Rimless Gradient Shades', price: 27000, img: 'img/sunglasses.jpg', rating: 4.6, reviews: 58, order: 12, isNew: 4, kicker: 'Accessories',
      desc: 'Lightweight rimless frames, UV400 lenses.', long: 'Featherlight rimless frames with gradient UV400 lenses and gold-tone arms. Comes with a hard case.' },
    { id: 'mirror-aviators', cat: 'accessories', name: 'Blue Mirror Aviators', price: 22000, img: 'img/aviators.jpg', rating: 4.5, reviews: 91, order: 14, isNew: 11, kicker: 'Accessories',
      desc: 'Polarised mirror lenses on a metal frame.', long: 'Classic aviators with polarised blue mirror lenses to cut glare on bright afternoons.' },
    { id: 'amber-oud', cat: 'fragrance', name: 'Amber Oud Eau de Parfum', price: 48000, img: 'img/perfume-amber.jpg', badge: 'Signature', rating: 4.9, reviews: 189, order: 7, isNew: 13, kicker: 'Fragrance',
      desc: 'Warm oud, amber and a hint of vanilla. Lasts all day.', long: 'Rich oud wood wrapped in amber and soft vanilla, with a hint of saffron at the top. Long-lasting eau de parfum.', meta: [['clock', '10–12 hour wear'], ['gift', 'Free gift wrap']],
      options: [{ name: 'Size', choices: [{ label: '50ml' }, { label: '100ml', add: 22000 }] }] },
    { id: 'aqua-fresh', cat: 'fragrance', name: 'Aqua Fresh Eau de Toilette', price: 36000, img: 'img/perfume-aqua.jpg', rating: 4.7, reviews: 74, order: 13, isNew: 14, kicker: 'Fragrance',
      desc: 'Citrus, sea salt and cedar. Clean and bright.', long: 'A bright, clean scent of bergamot, sea salt and cedarwood. Perfect for hot afternoons.', meta: [['gift', 'Free gift wrap']],
      options: [{ name: 'Size', choices: [{ label: '50ml' }, { label: '100ml', add: 16000 }] }] },
    { id: 'studio-anc', cat: 'tech', name: 'Studio ANC Headphones', price: 115000, img: 'img/headphones.jpg', rating: 4.8, reviews: 141, order: 15, isNew: 15, kicker: 'Tech',
      desc: 'Active noise cancelling, 30-hour battery.', long: 'Over-ear headphones with active noise cancelling, 30-hour battery life and a fold-flat carry case.', meta: [['clock', '30h battery'], ['shield', '1-year warranty']],
      options: [{ name: 'Colour', choices: [{ label: 'Graphite', swatch: '#2b2b2b' }, { label: 'Silver', swatch: '#c7c9cc' }] }] },
  ];
  products.forEach(p => { if (['amber-oud', 'chrono', 'retro-digital', 'gradient-shades'].includes(p.id)) p.upsell = true; });
  const cats = [['all', 'All'], ['new', 'New in'], ['clothing', 'Clothing'], ['shoes', 'Shoes'], ['bags', 'Bags'], ['accessories', 'Accessories'], ['fragrance', 'Fragrance'], ['tech', 'Tech'], ['sale', 'Sale']];

  const recent = store.get('recent', []);
  Shop.init({
    key: 'kora', name: 'KORA & Co.', whatsapp: '2348138582078', orderPrefix: 'KORA', products,
    promos: { WELCOME10: 0.10, KORA15: 0.15 }, promoHint: 'WELCOME10',
    delivery: {
      fee: 3500, freeOver: 75000, pickup: true, eta: '24 hours', pickupWord: 'Store pickup', pickupEta: 'Ready in 2 hours',
      pickupLabel: 'Pick up at KORA Owerri', pickupAddress: 'Plot 14 Wetheral Road, Owerri — bring your order number',
      zones: [{ name: 'Owerri (24 hours)', fee: 2000 }, { name: 'Lagos (24 hours)', fee: 3500 }, { name: 'Abuja (2–3 days)', fee: 4500 }, { name: 'Port Harcourt (2–3 days)', fee: 4000 }, { name: 'Rest of Nigeria (3–4 days)', fee: 5500 }],
      slots: ['Morning (9am – 12pm)', 'Afternoon (12pm – 4pm)', 'Evening (4pm – 7pm)'],
    },
    labels: {
      cart: 'Your bag', cartShort: 'your bag', checkout: 'Checkout', browse: 'Continue shopping', emptyTitle: 'Your bag is empty',
      emptyText: 'Find something you love — it will wait here for you.', upsell: 'Complete the look', deliveryNote: 'Shipping',
      detailsTitle: 'Where should we send it?', noteLabel: 'Gift message (optional)', notePlaceholder: 'We\'ll add a handwritten card',
      successTitle: 'Thank you for your order', successText: 'We\'ve sent the details to you, {name}. Your order is being packed.', keepShopping: 'Keep shopping',
    },
    timeline: {
      delivery: [
        { icon: 'receipt', title: 'Order confirmed', text: 'Payment received' },
        { icon: 'gift', title: 'Packed with care', text: 'Quality-checked and wrapped' },
        { icon: 'truck', title: 'Out for delivery', text: 'You\'ll get a call before arrival' },
        { icon: 'checkcircle', title: 'Delivered', text: '14 days to return if it\'s not right' },
      ],
      pickup: [
        { icon: 'receipt', title: 'Order confirmed', text: 'Payment received' },
        { icon: 'gift', title: 'Being prepared', text: 'Quality-checked and wrapped' },
        { icon: 'store', title: 'Ready for pickup', text: 'Show your order number in store' },
      ],
    },
    onView(p) {
      const r = [p.id, ...recent.filter(x => x !== p.id)].slice(0, 6);
      recent.splice(0, recent.length, ...r); store.set('recent', r); renderRecent();
    },
  });

  /* ---------- wishlist ---------- */
  let wish = store.get('wish', []);
  const renderWishCount = () => $$('[data-wish-count]').forEach(b => { b.textContent = wish.length; b.classList.toggle('is-empty', !wish.length); });
  const toggleWish = id => {
    const on = !wish.includes(id);
    wish = on ? [...wish, id] : wish.filter(x => x !== id); store.set('wish', wish); renderWishCount();
    $$(`[data-wish="${id}"]`).forEach(b => b.classList.toggle('is-on', on));
    Shop.toast(on ? 'Saved to your wishlist' : 'Removed from wishlist', 'heart');
  };

  /* ---------- grid ---------- */
  const grid = $('[data-grid]'), chips = $('[data-chips]'), sortSel = $('[data-sort]'), empty = $('[data-empty]'), countLbl = $('[data-count-label]');
  let cat = 'all';
  const inCat = (p, c) => c === 'all' || (c === 'sale' ? !!p.was : c === 'new' ? p.isNew < 5 : p.cat === c);
  chips.innerHTML = cats.map(([k, l]) => `<button role="tab" data-cat="${k}" class="chip${k === 'sale' ? ' is-sale' : ''}${k === cat ? ' is-on' : ''}">${l}</button>`).join('');

  const card = p => `
    <article class="pc" data-r>
      <div class="pc-img" data-quick="${p.id}">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy">
        ${p.badge ? `<span class="pc-badge${p.was ? ' is-sale' : ''}">${p.was ? '-' + Math.round((1 - p.price / p.was) * 100) + '%' : esc(p.badge)}</span>` : ''}
        <button class="pc-wish${wish.includes(p.id) ? ' is-on' : ''}" data-wish="${p.id}" aria-label="Save ${esc(p.name)}"><svg class="ic"><use href="#i-heart"/></svg></button>
        <div class="pc-quick">${p.options ? `<button class="pc-q" data-quick="${p.id}">Choose ${esc(p.options[0].name.toLowerCase().replace(' (eu)', ''))}</button>` : `<button class="pc-q" data-add="${p.id}">Quick add</button>`}</div>
      </div>
      <div class="pc-body" data-quick="${p.id}">
        <p class="pc-cat">${esc(p.kicker.split(' · ')[0])}</p>
        <h3>${esc(p.name)}</h3>
        <div class="pc-price"><b>${Shop.fmt(p.price)}</b>${p.was ? `<s>${Shop.fmt(p.was)}</s>` : ''}<span class="pc-rate"><svg class="ic"><use href="#i-starfill"/></svg>${p.rating}</span></div>
        ${p.options && p.options[0].choices[0].swatch ? `<div class="pc-sw">${p.options[0].choices.map(c => `<i style="background:${c.swatch}" title="${esc(c.label)}"></i>`).join('')}</div>` : ''}
      </div>
    </article>`;

  function render() {
    let list = products.filter(p => inCat(p, cat));
    const s = sortSel.value;
    list.sort((a, b) => s === 'low' ? a.price - b.price : s === 'high' ? b.price - a.price : s === 'rating' ? b.rating - a.rating : s === 'new' ? a.isNew - b.isNew : a.order - b.order);
    grid.innerHTML = list.map(card).join('');
    empty.hidden = list.length > 0;
    countLbl.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
    reveal(grid);
  }
  const setCat = c => { cat = c; $$('[data-cat]', chips).forEach(b => b.classList.toggle('is-on', b.dataset.cat === c)); render(); };
  chips.addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat); });
  sortSel.addEventListener('change', render);
  $('[data-reset]').onclick = () => { sortSel.value = 'featured'; setCat('all'); };
  document.addEventListener('click', e => {
    const j = e.target.closest('[data-jump]'); if (j) setCat(j.dataset.jump);
    const w = e.target.closest('[data-wish]'); if (w) { e.preventDefault(); e.stopPropagation(); toggleWish(w.dataset.wish); }
  }, true);
  render(); renderWishCount();

  /* ---------- wishlist sheet ---------- */
  const sheet = $('[data-sheet]'), sheetBody = $('[data-sheet-body]');
  const openSheet = html => { sheetBody.innerHTML = html; sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-on')); };
  const closeSheet = () => { sheet.classList.remove('is-on'); setTimeout(() => sheet.hidden = true, 300); };
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.sheet-x') || e.target.closest('[data-quick]') || e.target.closest('[data-add]')) closeSheet(); });
  $('[data-wish-open]').onclick = () => openSheet(`<h3>Your wishlist</h3>${wish.length ? `<div class="mini-list">${wish.map(id => { const p = Shop.product(id); return `<div class="mini"><img src="${p.img}" alt=""><div><b>${esc(p.name)}</b><span>${Shop.fmt(p.price)}</span></div><button class="btn btn-dark btn-sm" data-quick="${p.id}">View</button></div>`; }).join('')}</div>` : '<p class="muted">Tap the heart on anything you like to save it here.</p>'}`);
  $$('[data-help]').forEach(a => a.onclick = e => {
    e.preventDefault();
    const t = a.dataset.help, body = {
      Delivery: '<ul class="help"><li><b>Owerri &amp; Lagos</b> — next day, ₦2,000–₦3,500</li><li><b>Abuja &amp; Port Harcourt</b> — 2–3 days</li><li><b>Rest of Nigeria</b> — 3–4 days</li><li><b>Free delivery</b> on orders over ₦75,000</li></ul>',
      Returns: '<ul class="help"><li>Return within <b>14 days</b> in original condition</li><li>We collect from your address for free in Owerri and Lagos</li><li>Refunds land in 2 working days</li></ul>',
      Sizing: '<table class="size"><tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr><tr><td>S</td><td>36–38</td><td>28</td></tr><tr><td>M</td><td>39–41</td><td>29</td></tr><tr><td>L</td><td>42–44</td><td>30</td></tr><tr><td>XL</td><td>45–47</td><td>31</td></tr><tr><td>XXL</td><td>48–50</td><td>32</td></tr></table>',
    }[t];
    openSheet(`<h3>${t === 'Sizing' ? 'Size guide' : t === 'Returns' ? 'Returns & refunds' : 'Delivery'}</h3>${body}`);
  });

  /* ---------- search ---------- */
  const so = $('[data-search]'), si = $('[data-search-input]'), sr = $('[data-search-res]');
  const openSearch = () => { so.hidden = false; requestAnimationFrame(() => so.classList.add('is-on')); setTimeout(() => si.focus(), 60); };
  const closeSearch = () => { so.classList.remove('is-on'); setTimeout(() => so.hidden = true, 300); };
  $('[data-search-open]').onclick = openSearch;
  $('[data-search-close]').onclick = closeSearch;
  so.addEventListener('click', e => { if (e.target === so || e.target.closest('[data-quick]')) closeSearch(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !so.hidden) closeSearch(); if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); openSearch(); } });
  const runSearch = () => {
    const q = si.value.trim().toLowerCase();
    if (!q) { sr.innerHTML = ''; return; }
    const hits = products.filter(p => (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().includes(q));
    sr.innerHTML = hits.length ? hits.map(p => `<button class="sres" data-quick="${p.id}"><img src="${p.img}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.kicker.split(' · ')[0])}</small></span><em>${Shop.fmt(p.price)}</em></button>`).join('') : `<p class="muted">No results for "${esc(q)}".</p>`;
  };
  si.addEventListener('input', runSearch);
  $$('[data-search-hint] button').forEach(b => b.onclick = () => { si.value = b.textContent; runSearch(); });

  /* ---------- edit / shop the look ---------- */
  const look = ['denim-jacket', 'tan-satchel', 'amber-oud'].map(Shop.product);
  $('[data-edit]').innerHTML = look.map(p => `<li data-quick="${p.id}"><img src="${p.img}" alt=""><span><b>${esc(p.name)}</b><small>${Shop.fmt(p.price)}</small></span><svg class="ic"><use href="#i-chevr"/></svg></li>`).join('');
  const lookTotal = look.reduce((s, p) => s + p.price, 0);
  $('[data-look-price]').textContent = '— ' + Shop.fmt(lookTotal);
  $('[data-add-look]').onclick = e => { look.forEach((p, i) => Shop.add(p.id, { from: i === 0 ? e.currentTarget : null, silent: i > 0 })); Shop.toast('The full look is in your bag', 'bag'); };

  /* ---------- recently viewed ---------- */
  function renderRecent() {
    const wrap = $('[data-recent-wrap]');
    const list = recent.map(Shop.product).filter(Boolean);
    wrap.hidden = list.length < 2;
    $('[data-recent]').innerHTML = list.map(p => `<button class="rcard" data-quick="${p.id}"><img src="${p.img}" alt="" loading="lazy"><b>${esc(p.name)}</b><span>${Shop.fmt(p.price)}</span></button>`).join('');
  }
  renderRecent();

  /* ---------- misc ---------- */
  $$('[data-stars]').forEach(s => { const n = +s.dataset.stars; s.innerHTML = Array.from({ length: 5 }, (_, i) => `<svg class="ic ${i < n ? 'on' : ''}"><use href="#i-starfill"/></svg>`).join(''); });
  $('[data-news]').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('input', e.target);
    if (!/^\S+@\S+\.\S+$/.test(inp.value)) { inp.classList.add('is-bad'); setTimeout(() => inp.classList.remove('is-bad'), 600); Shop.toast('Enter a valid email address', 'x'); return; }
    e.target.innerHTML = `<p class="news-ok"><svg class="ic"><use href="#i-checkcircle"/></svg>You're in. Use <b>WELCOME10</b> at checkout for 10% off.</p>`;
  });
  const words = $$('.hero-h .w');
  words.forEach((w, i) => { w.style.animationDelay = (i * 0.09) + 's'; });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-quick]')) Shop.quickView(e.target.dataset.quick); });
})();
