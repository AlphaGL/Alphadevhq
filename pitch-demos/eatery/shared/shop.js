/* Shop engine: cart, drawer, checkout and demo payment. No backend; state lives in localStorage. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, c = '') => window.icon ? window.icon(n, c) : '';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cfg, cart = [], promo = null, listeners = [], directPay = null;

  const store = {
    load() { try { const d = JSON.parse(localStorage.getItem('shop:' + cfg.key) || '{}'); cart = d.cart || []; promo = d.promo || null; } catch { cart = []; } },
    save() { try { localStorage.setItem('shop:' + cfg.key, JSON.stringify({ cart, promo })); } catch { } },
  };

  const fmt = n => cfg.currency + Math.round(n).toLocaleString('en-NG');
  const product = id => cfg.products.find(p => p.id === id);
  const lineKey = (id, opts) => id + '|' + JSON.stringify(opts || {});
  const unitPrice = (p, opts) => p.price + (p.options || []).reduce((s, o) => {
    const ch = o.choices.find(c => c.label === (opts || {})[o.name]);
    return s + (ch && ch.add || 0);
  }, 0);

  function totals(lines = cart, fulfil = state.fulfil, zoneFee = null) {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const discount = promo && cfg.promos[promo] ? Math.round(subtotal * cfg.promos[promo]) : 0;
    let delivery = 0;
    if (fulfil === 'delivery' && subtotal > 0) {
      delivery = zoneFee ?? cfg.delivery.fee;
      if (cfg.delivery.freeOver && subtotal - discount >= cfg.delivery.freeOver) delivery = 0;
    }
    const service = cfg.serviceFee ? Math.round((subtotal - discount) * cfg.serviceFee) : 0;
    return { subtotal, discount, delivery, service, total: Math.max(0, subtotal - discount + delivery + service) };
  }
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const emit = () => { store.save(); renderBadges(); renderDrawer(); listeners.forEach(f => f(cart)); };

  /* ---------------- toast ---------------- */
  function toast(msg, iconName = 'check') {
    const t = document.createElement('div');
    t.className = 'shop-toast';
    t.innerHTML = `${ic(iconName)}<span>${msg}</span>`;
    $('.shop-toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* ---------------- fly-to-cart ---------------- */
  function fly(fromEl, img) {
    const target = $$('[data-cart-open]').find(el => el.offsetParent !== null);
    if (!fromEl || !target || reduceMotion) return;
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'shop-fly';
    if (img) dot.style.backgroundImage = `url("${img}")`;
    const size = 64;
    Object.assign(dot.style, { left: a.left + a.width / 2 - size / 2 + 'px', top: a.top + a.height / 2 - size / 2 + 'px', width: size + 'px', height: size + 'px' });
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .55}px, ${dy * .55 - 90}px) scale(.7)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.18)`, opacity: .2 },
    ], { duration: 780, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
      dot.remove();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    };
  }

  /* ---------------- cart ops ---------------- */
  function add(id, { qty = 1, options = {}, from = null, silent = false } = {}) {
    const p = product(id);
    if (!p) return;
    (p.options || []).forEach(o => { if (!options[o.name]) options[o.name] = o.choices[0].label; });
    const key = lineKey(id, options);
    const line = cart.find(l => l.key === key);
    if (line) line.qty += qty;
    else cart.push({ key, id, name: p.name, img: p.img, options, price: unitPrice(p, options), qty });
    emit();
    fly(from, p.img);
    if (!silent) toast(`<b>${esc(p.name)}</b> added to ${cfg.labels.cartShort}`);
  }
  function setQty(key, qty) {
    const l = cart.find(x => x.key === key);
    if (!l) return;
    if (qty <= 0) cart = cart.filter(x => x.key !== key); else l.qty = Math.min(99, qty);
    emit();
  }

  /* ---------------- shell markup ---------------- */
  function mountShell() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="shop-backdrop" data-shop-close></div>
      <aside class="shop-drawer" aria-label="${esc(cfg.labels.cart)}" aria-hidden="true">
        <header class="shop-drawer-head">
          <div><h3>${esc(cfg.labels.cart)}</h3><p class="shop-drawer-sub"></p></div>
          <button class="shop-icon-btn" data-shop-close aria-label="Close">${ic('x')}</button>
        </header>
        <div class="shop-drawer-body"></div>
        <footer class="shop-drawer-foot"></footer>
      </aside>
      <div class="shop-modal" role="dialog" aria-modal="true" aria-label="Checkout" aria-hidden="true">
        <div class="shop-modal-panel"></div>
      </div>
      <div class="shop-toasts" aria-live="polite"></div>`);
    document.addEventListener('click', e => {
      if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); }
      if (e.target.closest('[data-shop-close]')) closeAll();
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) { e.preventDefault(); add(addBtn.dataset.add, { from: addBtn }); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  }

  function lock(on) { document.documentElement.classList.toggle('shop-locked', on); }
  function openCart() { renderDrawer(); $('.shop-drawer').classList.add('is-open'); $('.shop-drawer').setAttribute('aria-hidden', 'false'); $('.shop-backdrop').classList.add('is-on'); lock(true); }
  function closeAll() {
    $('.shop-drawer').classList.remove('is-open'); $('.shop-drawer').setAttribute('aria-hidden', 'true');
    $('.shop-modal').classList.remove('is-open'); $('.shop-modal').setAttribute('aria-hidden', 'true');
    $('.shop-backdrop').classList.remove('is-on'); lock(false);
    clearInterval(state.timer); clearInterval(state.tracker);
  }

  function renderBadges() {
    const n = count();
    $$('[data-cart-count]').forEach(el => { el.textContent = n; el.classList.toggle('is-empty', n === 0); });
  }

  /* ---------------- drawer ---------------- */
  function renderDrawer() {
    const body = $('.shop-drawer-body'), foot = $('.shop-drawer-foot');
    if (!body) return;
    $('.shop-drawer-sub').textContent = count() ? `${count()} ${count() === 1 ? cfg.labels.itemWord : cfg.labels.itemWord + 's'}` : '';
    if (!cart.length) {
      body.innerHTML = `<div class="shop-empty">${ic('bag', 'shop-empty-ic')}<h4>${esc(cfg.labels.emptyTitle)}</h4><p>${esc(cfg.labels.emptyText)}</p><button class="shop-btn" data-shop-close>${esc(cfg.labels.browse)}</button></div>`;
      foot.innerHTML = '';
      return;
    }
    const t = totals(cart, 'delivery');
    let progress = '';
    if (cfg.delivery.freeOver) {
      const left = cfg.delivery.freeOver - (t.subtotal - t.discount);
      const pct = Math.min(100, ((t.subtotal - t.discount) / cfg.delivery.freeOver) * 100);
      progress = `<div class="shop-free">${ic('truck')}<div><p>${left > 0 ? `Add <b>${fmt(left)}</b> more for free delivery` : '<b>You get free delivery</b>'}</p><div class="shop-bar"><i style="width:${pct}%"></i></div></div></div>`;
    }
    const upsells = (cfg.products.filter(p => p.upsell && !cart.some(l => l.id === p.id))).slice(0, 2);
    body.innerHTML = progress + `<ul class="shop-lines">${cart.map(l => `
      <li class="shop-line">
        <div class="shop-line-img" style="background-image:url('${l.img}')"></div>
        <div class="shop-line-info">
          <p class="shop-line-name">${esc(l.name)}</p>
          ${Object.entries(l.options).length ? `<p class="shop-line-opt">${Object.entries(l.options).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')}</p>` : ''}
          <div class="shop-line-row">
            <div class="shop-qty">
              <button aria-label="Less" data-q="${esc(l.key)}" data-d="-1">${ic(l.qty === 1 ? 'trash' : 'minus')}</button>
              <span>${l.qty}</span>
              <button aria-label="More" data-q="${esc(l.key)}" data-d="1">${ic('plus')}</button>
            </div>
            <b>${fmt(l.price * l.qty)}</b>
          </div>
        </div>
      </li>`).join('')}</ul>` +
      (upsells.length ? `<div class="shop-upsell"><p class="shop-upsell-h">${esc(cfg.labels.upsell)}</p>${upsells.map(p => `
        <div class="shop-upsell-item"><div class="shop-line-img" style="background-image:url('${p.img}')"></div><div><p>${esc(p.name)}</p><span>${fmt(p.price)}</span></div><button class="shop-icon-btn is-accent" data-add="${p.id}" aria-label="Add ${esc(p.name)}">${ic('plus')}</button></div>`).join('')}</div>` : '');
    foot.innerHTML = `
      <form class="shop-promo" autocomplete="off">
        ${ic('tag')}<input name="code" placeholder="Promo code${cfg.promoHint ? ' (try ' + cfg.promoHint + ')' : ''}" value="${promo || ''}" aria-label="Promo code"><button type="submit">${promo ? 'Applied' : 'Apply'}</button>
      </form>
      <div class="shop-sum"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
      ${t.discount ? `<div class="shop-sum is-good"><span>Promo (${esc(promo)})</span><span>-${fmt(t.discount)}</span></div>` : ''}
      <div class="shop-sum is-muted"><span>${esc(cfg.labels.deliveryNote)}</span><span>at checkout</span></div>
      <button class="shop-btn shop-btn-block" data-checkout>${esc(cfg.labels.checkout)} <span>${fmt(t.subtotal - t.discount)}</span></button>
      <button class="shop-btn shop-btn-ghost shop-btn-block" data-wa-order>${ic('whatsapp')} Order on WhatsApp instead</button>`;
    $$('[data-q]', body).forEach(b => b.onclick = () => { const l = cart.find(x => x.key === b.dataset.q); setQty(b.dataset.q, l.qty + +b.dataset.d); });
    $('.shop-promo', foot).onsubmit = e => {
      e.preventDefault();
      const code = e.target.code.value.trim().toUpperCase();
      if (cfg.promos[code]) { promo = code; emit(); toast(`Promo applied: ${Math.round(cfg.promos[code] * 100)}% off`, 'tag'); }
      else { e.target.code.classList.add('is-bad'); setTimeout(() => e.target.code.classList.remove('is-bad'), 600); toast('That code isn\'t valid', 'x'); }
    };
    $('[data-checkout]', foot).onclick = () => openCheckout();
    $('[data-wa-order]', foot).onclick = () => waOrder();
  }

  function waOrder(order) {
    const lines = (order ? order.lines : cart).map(l => `• ${l.qty} x ${l.name}${Object.keys(l.options || {}).length ? ' (' + Object.values(l.options).join(', ') + ')' : ''} — ${fmt(l.price * l.qty)}`).join('\n');
    const t = order ? order.totals : totals(cart, 'delivery');
    const msg = `Hello ${cfg.name}, I'd like to order:\n\n${lines}\n\nTotal: ${fmt(t.total ?? t.subtotal)}${order ? `\nOrder no: ${order.no}` : ''}`;
    window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  /* ---------------- checkout ---------------- */
  const state = { step: 'details', fulfil: 'delivery', zone: 0, method: 'card', timer: null, tracker: null, details: {} };

  function openCheckout(direct) {
    directPay = direct || null;
    if (!directPay && !cart.length) return;
    state.step = directPay ? 'pay' : 'details';
    state.fulfil = cfg.delivery.default || 'delivery';
    $('.shop-drawer').classList.remove('is-open');
    $('.shop-backdrop').classList.add('is-on');
    $('.shop-modal').classList.add('is-open'); $('.shop-modal').setAttribute('aria-hidden', 'false');
    lock(true);
    renderCheckout();
  }

  const currentLines = () => directPay ? directPay.lines : cart;
  const currentTotals = () => {
    if (directPay) { const s = directPay.lines.reduce((a, l) => a + l.price * l.qty, 0); return { subtotal: s, discount: 0, delivery: 0, service: 0, total: s }; }
    const zone = cfg.delivery.zones ? cfg.delivery.zones[state.zone] : null;
    return totals(cart, state.fulfil, zone ? zone.fee : null);
  };

  function summaryHTML() {
    const t = currentTotals();
    return `<div class="shop-summary">
      <p class="shop-summary-h">${directPay ? esc(directPay.title) : 'Order summary'}</p>
      <ul>${currentLines().map(l => `<li>${l.img ? `<div class="shop-line-img" style="background-image:url('${l.img}')"><b>${l.qty}</b></div>` : ''}<div><p>${esc(l.name)}</p>${l.sub ? `<small>${esc(l.sub)}</small>` : ''}${l.options && Object.keys(l.options).length ? `<small>${Object.values(l.options).map(esc).join(' · ')}</small>` : ''}</div><span>${fmt(l.price * l.qty)}</span></li>`).join('')}</ul>
      <div class="shop-sum"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
      ${t.discount ? `<div class="shop-sum is-good"><span>Promo</span><span>-${fmt(t.discount)}</span></div>` : ''}
      ${!directPay ? `<div class="shop-sum"><span>${state.fulfil === 'delivery' ? 'Delivery' : 'Pickup'}</span><span>${state.fulfil === 'delivery' ? (t.delivery ? fmt(t.delivery) : 'Free') : 'Free'}</span></div>` : ''}
      ${t.service ? `<div class="shop-sum"><span>Service charge</span><span>${fmt(t.service)}</span></div>` : ''}
      <div class="shop-sum is-total"><span>Total</span><span>${fmt(t.total)}</span></div>
    </div>`;
  }

  function stepsHTML(active) {
    const steps = directPay ? [['pay', 'Payment'], ['done', 'Confirmed']] : [['details', 'Details'], ['pay', 'Payment'], ['done', 'Confirmed']];
    const idx = steps.findIndex(s => s[0] === active);
    return `<ol class="shop-steps">${steps.map((s, i) => `<li class="${i < idx ? 'is-done' : i === idx ? 'is-active' : ''}"><span>${i < idx ? ic('check') : i + 1}</span>${s[1]}</li>`).join('')}</ol>`;
  }

  function renderCheckout() {
    const panel = $('.shop-modal-panel');
    const head = `<header class="shop-modal-head">
        ${state.step === 'pay' && !directPay ? `<button class="shop-icon-btn" data-back aria-label="Back">${ic('arrowl')}</button>` : '<span></span>'}
        ${stepsHTML(state.step)}
        <button class="shop-icon-btn" data-shop-close aria-label="Close">${ic('x')}</button>
      </header>`;
    if (state.step === 'details') panel.innerHTML = head + `<div class="shop-modal-grid">${detailsHTML()}${summaryHTML()}</div>`;
    if (state.step === 'pay') panel.innerHTML = head + `<div class="shop-modal-grid">${payHTML()}${summaryHTML()}</div>`;
    if (state.step === 'done') panel.innerHTML = head + doneHTML();
    panel.scrollTop = 0;
    bindCheckout();
  }

  function detailsHTML() {
    const d = state.details, z = cfg.delivery.zones;
    return `<form class="shop-form" data-details novalidate>
      <h3>${esc(cfg.labels.detailsTitle)}</h3>
      <div class="shop-toggle" role="tablist">
        <button type="button" class="${state.fulfil === 'delivery' ? 'is-on' : ''}" data-fulfil="delivery">${ic('truck')}<span><b>Delivery</b><small>${esc(cfg.delivery.eta)}</small></span></button>
        ${cfg.delivery.pickup ? `<button type="button" class="${state.fulfil === 'pickup' ? 'is-on' : ''}" data-fulfil="pickup">${ic('store')}<span><b>${esc(cfg.delivery.pickupWord || 'Pickup')}</b><small>${esc(cfg.delivery.pickupEta || 'Ready in 20 min')}</small></span></button>` : ''}
      </div>
      <div class="shop-fields">
        <label class="shop-field"><span>Full name</span><input name="name" value="${esc(d.name || '')}" placeholder="e.g. Chiamaka Okafor" required autocomplete="name"></label>
        <label class="shop-field"><span>Phone number</span><input name="phone" value="${esc(d.phone || '')}" placeholder="0803 123 4567" inputmode="tel" required autocomplete="tel"></label>
        <label class="shop-field is-wide"><span>Email <i>(for your receipt, optional)</i></span><input name="email" type="email" value="${esc(d.email || '')}" placeholder="you@example.com" autocomplete="email"></label>
        ${state.fulfil === 'delivery' ? `
          ${z ? `<label class="shop-field is-wide"><span>Area</span><select name="zone">${z.map((x, i) => `<option value="${i}" ${i === state.zone ? 'selected' : ''}>${esc(x.name)} — ${x.fee ? fmt(x.fee) : 'Free'}</option>`).join('')}</select></label>` : ''}
          <label class="shop-field is-wide"><span>Delivery address</span><input name="address" value="${esc(d.address || '')}" placeholder="House number, street, landmark" required autocomplete="street-address"></label>
          <label class="shop-field"><span>When</span><select name="when"><option>As soon as possible</option>${cfg.delivery.slots.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>` :
        `<div class="shop-pickup is-wide">${ic('pin')}<div><b>${esc(cfg.delivery.pickupLabel)}</b><small>${esc(cfg.delivery.pickupAddress)}</small></div></div>
          <label class="shop-field"><span>Pickup time</span><select name="when"><option>As soon as it's ready</option>${cfg.delivery.slots.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>`}
        <label class="shop-field ${state.fulfil === 'delivery' ? '' : ''}"><span>${esc(cfg.labels.noteLabel)}</span><input name="note" value="${esc(d.note || '')}" placeholder="${esc(cfg.labels.notePlaceholder)}"></label>
      </div>
      <button class="shop-btn shop-btn-block shop-btn-lg" type="submit">Continue to payment ${ic('arrowr')}</button>
      <p class="shop-secure">${ic('lock')} Your details are only used for this order.</p>
    </form>`;
  }

  const banks = [['GTBank', '*737*'], ['Access Bank', '*901*'], ['Zenith Bank', '*966*'], ['UBA', '*919*'], ['First Bank', '*894*'], ['Opay', '*955*']];
  function payHTML() {
    const t = currentTotals();
    const m = state.method;
    return `<div class="shop-form shop-pay">
      <h3>How would you like to pay?</h3>
      <div class="shop-demo-note">${ic('shield')}<span><b>Demo checkout.</b> No real money is charged. Use any test card, e.g. <code>4084 0840 8408 4081</code>.</span></div>
      <div class="shop-methods" role="tablist">
        <button type="button" data-method="card" class="${m === 'card' ? 'is-on' : ''}">${ic('card')}Card</button>
        <button type="button" data-method="transfer" class="${m === 'transfer' ? 'is-on' : ''}">${ic('bank')}Transfer</button>
        <button type="button" data-method="ussd" class="${m === 'ussd' ? 'is-on' : ''}">${ic('phone')}USSD</button>
      </div>
      ${m === 'card' ? `
        <div class="shop-card3d"><div class="shop-card3d-in">
          <div class="shop-cc shop-cc-front"><div class="shop-cc-top"><span class="shop-cc-chip"></span><span class="shop-cc-brand" data-brand></span></div>
            <p class="shop-cc-num" data-cc-num>•••• •••• •••• ••••</p>
            <div class="shop-cc-bot"><div><small>Card holder</small><p data-cc-name>${esc((state.details.name || 'YOUR NAME').toUpperCase())}</p></div><div><small>Expires</small><p data-cc-exp>MM/YY</p></div></div></div>
          <div class="shop-cc shop-cc-back"><div class="shop-cc-strip"></div><div class="shop-cc-cvv"><small>CVV</small><p data-cc-cvv>•••</p></div></div>
        </div></div>
        <form class="shop-fields" data-card novalidate>
          <label class="shop-field is-wide"><span>Card number</span><input name="num" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23" required></label>
          <label class="shop-field"><span>Expiry</span><input name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" required></label>
          <label class="shop-field"><span>CVV</span><input name="cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required></label>
          <button class="shop-btn shop-btn-block shop-btn-lg is-wide" type="submit">${ic('lock')} Pay ${fmt(t.total)}</button>
        </form>` : ''}
      ${m === 'transfer' ? `
        <div class="shop-transfer">
          <p>Transfer exactly <b>${fmt(t.total)}</b> to:</p>
          <div class="shop-acct">
            <div><small>Bank</small><b>Demo Bank (Test)</b></div>
            <div><small>Account number</small><b class="shop-mono">0123456789</b><button type="button" class="shop-copy" data-copy="0123456789">${ic('copy')}Copy</button></div>
            <div><small>Account name</small><b>${esc(cfg.name)} — Demo</b></div>
          </div>
          <p class="shop-timer">${ic('clock')} This account expires in <b data-countdown>10:00</b></p>
          <button class="shop-btn shop-btn-block shop-btn-lg" data-confirm-transfer>I've sent the money</button>
        </div>` : ''}
      ${m === 'ussd' ? `
        <div class="shop-ussd">
          <label class="shop-field"><span>Choose your bank</span><select data-bank>${banks.map((b, i) => `<option value="${i}">${b[0]}</option>`).join('')}</select></label>
          <p>Dial this code on the phone linked to your account:</p>
          <div class="shop-ussd-code" data-ussd>${banks[0][1]}000*${Math.round(t.total)}#</div>
          <button class="shop-btn shop-btn-block shop-btn-lg" data-confirm-ussd>I've completed the payment</button>
        </div>` : ''}
      <p class="shop-secure">${ic('shield')} Payments are encrypted and processed securely.</p>
    </div>`;
  }

  function doneHTML() {
    const o = state.order;
    const tl = directPay ? (directPay.timeline || []) : (state.fulfil === 'delivery' ? cfg.timeline.delivery : cfg.timeline.pickup);
    return `<div class="shop-done">
      <div class="shop-done-badge"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
      <h2>${esc(directPay ? directPay.successTitle : cfg.labels.successTitle)}</h2>
      <p class="shop-done-sub">${esc(directPay ? directPay.successText : cfg.labels.successText.replace('{name}', (state.details.name || '').split(' ')[0] || 'there'))}</p>
      <div class="shop-done-meta">
        <div><small>${directPay ? 'Reference' : 'Order no.'}</small><b>${o.no}</b></div>
        <div><small>Amount paid</small><b>${fmt(o.totals.total)}</b></div>
        <div><small>${directPay ? (directPay.metaLabel || 'Date') : (state.fulfil === 'delivery' ? 'Arriving' : 'Ready')}</small><b>${esc(directPay ? (directPay.metaValue || new Date().toLocaleDateString()) : (state.fulfil === 'delivery' ? cfg.delivery.eta : (cfg.delivery.pickupEta || '20 min')))}</b></div>
      </div>
      ${tl.length ? `<ol class="shop-track">${tl.map((s, i) => `<li class="${i === 0 ? 'is-done' : ''}" data-ti="${i}"><span>${ic(s.icon)}</span><div><b>${esc(s.title)}</b><small>${esc(s.text)}</small></div></li>`).join('')}</ol>` : ''}
      <div class="shop-done-actions">
        <button class="shop-btn" data-print>${ic('printer')} Receipt</button>
        <button class="shop-btn shop-btn-ghost" data-wa-share>${ic('whatsapp')} Send to WhatsApp</button>
        <button class="shop-btn shop-btn-ghost" data-shop-close>${esc(directPay ? 'Done' : cfg.labels.keepShopping)}</button>
      </div>
      <div class="shop-receipt" aria-hidden="true">
        <h3>${esc(cfg.name)}</h3><p>${new Date().toLocaleString()}</p><p>${directPay ? 'Reference' : 'Order'} ${o.no}</p><hr>
        ${o.lines.map(l => `<p><span>${l.qty} x ${esc(l.name)}</span><span>${fmt(l.price * l.qty)}</span></p>`).join('')}<hr>
        <p><b>Total</b><b>${fmt(o.totals.total)}</b></p><p>Paid by ${esc(o.method)} (demo)</p>
      </div>
    </div>`;
  }

  /* ---------------- checkout behaviour ---------------- */
  function bindCheckout() {
    const panel = $('.shop-modal-panel');
    const back = $('[data-back]', panel);
    if (back) back.onclick = () => { state.step = 'details'; renderCheckout(); };

    const details = $('[data-details]', panel);
    if (details) {
      $$('[data-fulfil]', details).forEach(b => b.onclick = () => { keep(details); state.fulfil = b.dataset.fulfil; renderCheckout(); });
      const zone = $('[name=zone]', details);
      if (zone) zone.onchange = () => { keep(details); state.zone = +zone.value; renderCheckout(); };
      details.onsubmit = e => {
        e.preventDefault();
        keep(details);
        let ok = true;
        $$('[required]', details).forEach(i => {
          const bad = !i.value.trim() || (i.name === 'phone' && i.value.replace(/\D/g, '').length < 10);
          i.closest('.shop-field').classList.toggle('is-bad', bad);
          if (bad) ok = false;
        });
        if (!ok) { toast('Please fill in the highlighted fields', 'x'); return; }
        state.step = 'pay'; renderCheckout();
      };
    }

    $$('[data-method]', panel).forEach(b => b.onclick = () => { state.method = b.dataset.method; renderCheckout(); });
    const card = $('[data-card]', panel);
    if (card) bindCard(card, panel);
    const cd = $('[data-countdown]', panel);
    if (cd) {
      let s = 600; clearInterval(state.timer);
      state.timer = setInterval(() => { s = Math.max(0, s - 1); cd.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }, 1000);
    }
    $$('[data-copy]', panel).forEach(b => b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy); toast('Account number copied', 'copy'); });
    const bank = $('[data-bank]', panel);
    if (bank) bank.onchange = () => { $('[data-ussd]', panel).textContent = `${banks[bank.value][1]}000*${Math.round(currentTotals().total)}#`; };
    const ct = $('[data-confirm-transfer]', panel); if (ct) ct.onclick = () => pay('Bank transfer');
    const cu = $('[data-confirm-ussd]', panel); if (cu) cu.onclick = () => pay('USSD');
    const pr = $('[data-print]', panel); if (pr) pr.onclick = () => window.print();
    const ws = $('[data-wa-share]', panel); if (ws) ws.onclick = () => waOrder(state.order);
  }

  function keep(form) { new FormData(form).forEach((v, k) => { state.details[k] = v; }); }

  function bindCard(form, panel) {
    const num = form.num, exp = form.exp, cvv = form.cvv, flip = $('.shop-card3d', panel);
    const brand = n => /^4/.test(n) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(n) ? 'MASTERCARD' : /^(506|507|650)/.test(n) ? 'VERVE' : '';
    num.oninput = () => {
      const d = num.value.replace(/\D/g, '').slice(0, 19);
      num.value = d.replace(/(.{4})/g, '$1 ').trim();
      $('[data-cc-num]', panel).textContent = (d + '•'.repeat(Math.max(0, 16 - d.length))).replace(/(.{4})/g, '$1 ').trim();
      $('[data-brand]', panel).textContent = brand(d);
    };
    exp.oninput = () => {
      let d = exp.value.replace(/\D/g, '').slice(0, 4);
      if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
      exp.value = d; $('[data-cc-exp]', panel).textContent = d || 'MM/YY';
    };
    cvv.oninput = () => { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); $('[data-cc-cvv]', panel).textContent = '•'.repeat(cvv.value.length) || '•••'; };
    cvv.onfocus = () => flip.classList.add('is-flipped');
    cvv.onblur = () => flip.classList.remove('is-flipped');
    form.onsubmit = e => {
      e.preventDefault();
      const d = num.value.replace(/\D/g, '');
      const [mm, yy] = exp.value.split('/');
      const checks = [[num, d.length < 15], [exp, !(mm >= 1 && mm <= 12 && yy && yy.length === 2)], [cvv, cvv.value.length < 3]];
      let ok = true;
      checks.forEach(([el, bad]) => { el.closest('.shop-field').classList.toggle('is-bad', bad); if (bad) ok = false; });
      if (!ok) { toast('Check your card details', 'x'); return; }
      pay('Card •••• ' + d.slice(-4));
    };
  }

  function pay(method) {
    const panel = $('.shop-modal-panel');
    const ov = document.createElement('div');
    ov.className = 'shop-processing';
    ov.innerHTML = `<div class="shop-spinner"></div><p data-pmsg>Contacting your bank…</p>`;
    panel.appendChild(ov);
    setTimeout(() => { const m = $('[data-pmsg]', ov); if (m) m.textContent = 'Confirming payment…'; }, 1000);
    setTimeout(() => {
      const prefix = (directPay && directPay.prefix) || cfg.orderPrefix;
      state.order = { no: `${prefix}-${Math.floor(10000 + Math.random() * 89999)}`, lines: currentLines().map(l => ({ ...l })), totals: currentTotals(), method, details: { ...state.details }, fulfil: state.fulfil, at: Date.now() };
      clearInterval(state.timer);
      const ok = directPay;
      if (!directPay) { cart = []; promo = null; emit(); }
      state.step = 'done';
      renderCheckout();
      if (ok && ok.onSuccess) ok.onSuccess(state.order);
      if (!ok && cfg.onOrder) cfg.onOrder(state.order);
      confetti();
      runTracker();
    }, 2200);
  }

  function runTracker() {
    let i = 0; clearInterval(state.tracker);
    state.tracker = setInterval(() => {
      i++;
      const li = $(`.shop-track [data-ti="${i}"]`);
      if (!li) { clearInterval(state.tracker); return; }
      li.classList.add('is-done');
    }, 3500);
  }

  function confetti() {
    if (reduceMotion) return;
    const host = $('.shop-done-badge');
    if (!host) return;
    const colors = getComputedStyle(document.documentElement).getPropertyValue('--shop-confetti').split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('i');
      p.className = 'shop-confetti';
      p.style.background = colors[i % colors.length] || '#fff';
      host.appendChild(p);
      const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 90;
      p.animate([{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 40}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 }],
      { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    }
  }

  /* ---------------- quick view ---------------- */
  function quickView(id) {
    const p = product(id);
    if (!p) return;
    const sel = {};
    (p.options || []).forEach(o => { sel[o.name] = o.choices[0].label; });
    let qty = 1;
    let qv = $('.shop-qv');
    if (!qv) {
      document.body.insertAdjacentHTML('beforeend', '<div class="shop-qv" role="dialog" aria-modal="true" aria-hidden="true"><div class="shop-qv-panel"></div></div>');
      qv = $('.shop-qv');
      qv.addEventListener('click', e => { if (e.target === qv) closeQV(); });
    }
    const panel = $('.shop-qv-panel', qv);
    const render = () => {
      const price = unitPrice(p, sel) * qty;
      panel.innerHTML = `
        <button class="shop-icon-btn shop-qv-x" data-qv-close aria-label="Close">${ic('x')}</button>
        <div class="shop-qv-img" style="background-image:url('${p.img}')">${p.badge ? `<span class="shop-qv-badge">${esc(p.badge)}</span>` : ''}</div>
        <div class="shop-qv-body">
          ${p.kicker ? `<p class="shop-qv-kicker">${esc(p.kicker)}</p>` : ''}
          <h3>${esc(p.name)}</h3>
          ${p.rating ? `<p class="shop-qv-rating">${ic('starfill')} <b>${p.rating}</b> <span>(${p.reviews || 0} reviews)</span></p>` : ''}
          ${p.was ? `<p class="shop-qv-price"><b>${fmt(unitPrice(p, sel))}</b><s>${fmt(p.was)}</s><span>-${Math.round((1 - p.price / p.was) * 100)}%</span></p>` : ''}
          <p class="shop-qv-desc">${esc(p.long || p.desc || '')}</p>
          ${(p.meta || []).length ? `<ul class="shop-qv-meta">${p.meta.map(m => `<li>${ic(m[0])}${esc(m[1])}</li>`).join('')}</ul>` : ''}
          ${(p.options || []).map(o => `
            <fieldset class="shop-qv-opt"><legend>${esc(o.name)}</legend><div>
              ${o.choices.map(c => `<button type="button" class="${sel[o.name] === c.label ? 'is-on' : ''}" data-opt="${esc(o.name)}" data-val="${esc(c.label)}" ${c.soldOut ? 'disabled' : ''}>${c.swatch ? `<i style="background:${c.swatch}"></i>` : ''}${esc(c.label)}${c.add ? `<small>+${fmt(c.add)}</small>` : ''}</button>`).join('')}
            </div></fieldset>`).join('')}
          <div class="shop-qv-buy">
            <div class="shop-qty shop-qty-lg"><button data-qq="-1" aria-label="Less">${ic('minus')}</button><span>${qty}</span><button data-qq="1" aria-label="More">${ic('plus')}</button></div>
            <button class="shop-btn shop-btn-lg" data-qv-add>${ic(cfg.addIcon || 'bag')} Add — ${fmt(price)}</button>
          </div>
        </div>`;
      $$('[data-opt]', panel).forEach(b => b.onclick = () => { sel[b.dataset.opt] = b.dataset.val; render(); });
      $$('[data-qq]', panel).forEach(b => b.onclick = () => { qty = Math.max(1, Math.min(20, qty + +b.dataset.qq)); render(); });
      $('[data-qv-close]', panel).onclick = closeQV;
      $('[data-qv-add]', panel).onclick = e => { add(p.id, { qty, options: { ...sel }, from: e.currentTarget }); closeQV(); };
    };
    render();
    if (cfg.onView) cfg.onView(p);
    qv.classList.add('is-open'); qv.setAttribute('aria-hidden', 'false'); lock(true);
  }
  function closeQV() { const qv = $('.shop-qv'); if (!qv) return; qv.classList.remove('is-open'); qv.setAttribute('aria-hidden', 'true'); if (!$('.shop-drawer.is-open') && !$('.shop-modal.is-open')) lock(false); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQV(); });
  document.addEventListener('click', e => { const t = e.target.closest('[data-quick]'); if (t && !e.target.closest('[data-add]')) { e.preventDefault(); quickView(t.dataset.quick); } });

  /* ---------------- public API ---------------- */
  window.Shop = {
    init(c) {
      cfg = Object.assign({
        currency: '₦', promos: {}, orderPrefix: 'ORD', serviceFee: 0,
        delivery: { fee: 1500, freeOver: 0, pickup: true, eta: '30–45 min', slots: [], pickupLabel: 'Pick up in store', pickupAddress: '' },
        timeline: { delivery: [], pickup: [] },
      }, c);
      cfg.labels = Object.assign({
        cart: 'Your cart', cartShort: 'cart', itemWord: 'item', checkout: 'Checkout', browse: 'Start browsing',
        emptyTitle: 'Your cart is empty', emptyText: 'Add something you love and it will show up here.',
        upsell: 'You might also like', deliveryNote: 'Delivery', detailsTitle: 'Where should we bring it?',
        noteLabel: 'Note', notePlaceholder: 'Anything we should know?', successTitle: 'Order confirmed',
        successText: 'Thank you, {name}. We\'re on it.', keepShopping: 'Keep shopping',
      }, c.labels || {});
      store.load();
      mountShell();
      renderBadges();
    },
    add, openCart, quickView, fmt: n => fmt(n), count, product, lines: () => cart,
    on(fn) { listeners.push(fn); },
    pay(opts) { openCheckout(opts); },
    toast,
  };
})();
