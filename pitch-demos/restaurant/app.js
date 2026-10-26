(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DONENESS = { name: 'Cooked', choices: [{ label: 'Medium rare' }, { label: 'Rare' }, { label: 'Medium' }, { label: 'Well done' }] };
  const SIDE = { name: 'Side', choices: [{ label: 'Truffle mash' }, { label: 'Hand-cut chips' }, { label: 'Grilled vegetables' }, { label: 'Jollof risotto', add: 2500 }] };

  const products = [
    { id: 'garlic-prawns', cat: 'starters', name: 'Garlic Butter Prawns', price: 14500, img: 'img/garlic-prawns.jpg', sig: true, rating: 4.9, reviews: 211, kicker: 'Starter',
      desc: 'Tiger prawns, brown butter, garlic, lemon and grilled sourdough.', long: 'Six tiger prawns pan-roasted in brown butter with garlic, chilli and parsley, finished with lemon and served with grilled sourdough for the sauce.', meta: [['flame', 'Gently spiced'], ['clock', '15 min']] },
    { id: 'pepper-soup', cat: 'starters', name: 'Catfish Pepper Soup', price: 9500, img: 'img/pepper-soup.jpg', rating: 4.8, reviews: 164, kicker: 'Starter',
      desc: 'Fresh point-and-kill catfish in a fragrant uda and uziza broth.', long: 'Fresh catfish poached in a clear, fragrant broth of uda, uziza and scent leaves. Our nod to Owerri\'s favourite starter.', meta: [['flame', 'Hot'], ['leaf', 'Local herbs']] },
    { id: 'grilled-prawns', cat: 'mains', name: 'Flame-Grilled Tiger Prawns', price: 21000, img: 'img/grilled-prawns.jpg', sig: true, badge: 'Chef\'s signature', rating: 4.9, reviews: 302, kicker: 'From the grill',
      desc: 'Whole tiger prawns over wood fire, suya butter, charred lime.', long: 'Whole tiger prawns grilled over our wood fire and basted with suya-spiced butter, served with charred lime and your choice of side.', meta: [['flame', 'Wood-fired'], ['clock', '20 min']], options: [SIDE] },
    { id: 'steak', cat: 'mains', name: 'Pepper Ribeye Steak', price: 29500, img: 'img/steak.jpg', sig: true, rating: 4.9, reviews: 388, kicker: 'From the grill',
      desc: '300g grass-fed ribeye, green peppercorn sauce, fresh salad.', long: 'A 300g grass-fed ribeye, grilled to your liking, sliced and served with green peppercorn sauce and a dressed garden salad.', meta: [['flame', 'Wood-fired'], ['clock', '25 min']], options: [DONENESS, SIDE] },
    { id: 'lamb', cat: 'mains', name: 'Rosemary Lamb Chops', price: 27000, img: 'img/lamb.jpg', sig: true, rating: 4.8, reviews: 241, kicker: 'From the grill',
      desc: 'Four chops, rosemary and garlic, roasted shallots.', long: 'Four lamb chops marinated in rosemary, garlic and olive oil, grilled and finished with roasted shallots and a red wine jus.', meta: [['clock', '25 min']], options: [DONENESS, SIDE] },
    { id: 'salmon', cat: 'mains', name: 'Seared Salmon', price: 24000, img: 'img/salmon.jpg', rating: 4.7, reviews: 197, kicker: 'Mains',
      desc: 'Crisp-skinned salmon, beurre blanc, seasonal greens.', long: 'Norwegian salmon seared skin-side down until crisp, with a lemon beurre blanc and buttered seasonal greens.', meta: [['clock', '20 min']], options: [SIDE] },
    { id: 'pasta', cat: 'mains', name: 'Seafood Linguine', price: 16500, img: 'img/pasta.jpg', rating: 4.7, reviews: 176, kicker: 'Mains',
      desc: 'Prawns and calamari in a light parmesan cream.', long: 'Fresh linguine with prawns and calamari in a light garlic and parmesan cream, finished with herbs and lemon zest.', meta: [['clock', '18 min']] },
    { id: 'lava-cake', cat: 'desserts', name: 'Molten Chocolate Cake', price: 8000, img: 'img/lava-cake.jpg', sig: true, upsell: true, rating: 4.9, reviews: 420, kicker: 'Dessert',
      desc: 'Dark chocolate, a soft centre and vanilla custard.', long: 'Baked to order with 70% dark chocolate so the centre stays molten, served with vanilla crème anglaise. Allow 12 minutes.', meta: [['clock', '12 min']] },
    { id: 'cheesecake', cat: 'desserts', name: 'Strawberry Cheesecake', price: 7500, img: 'img/cheesecake.jpg', upsell: true, rating: 4.8, reviews: 233, kicker: 'Dessert',
      desc: 'Baked vanilla cheesecake, fresh strawberry sauce.', long: 'A tall, creamy baked vanilla cheesecake on a buttery biscuit base, with a bright fresh strawberry sauce.' },
    { id: 'dessert-trio', cat: 'desserts', name: 'Dessert Trio', price: 9500, img: 'img/dessert-trio.jpg', rating: 4.8, reviews: 98, kicker: 'Dessert',
      desc: 'Caramel custard, mango tart and a little sorbet.', long: 'A tasting of three: caramel custard, a mango and passion fruit tart, and a scoop of seasonal sorbet. Perfect for sharing.' },
    { id: 'espresso-martini', cat: 'drinks', name: 'Espresso Martini', price: 7000, img: 'img/espresso-martini.jpg', upsell: true, rating: 4.8, reviews: 152, kicker: 'Cocktails',
      desc: 'Vodka, fresh espresso, coffee liqueur.', long: 'Vodka shaken hard with a fresh shot of espresso and coffee liqueur, for that perfect crema. Delivered chilled with ice on the side.' },
    { id: 'wine', cat: 'drinks', name: 'House Red — Malbec', price: 6500, img: 'img/wine.jpg', rating: 4.7, reviews: 88, kicker: 'Wine',
      desc: 'Rich, plummy Argentinian Malbec. By the glass or bottle.', long: 'Our house red: a rich, plummy Malbec from Mendoza with soft tannins. Lovely with the steak and lamb.',
      options: [{ name: 'Serve', choices: [{ label: 'Glass' }, { label: 'Bottle', add: 25500 }] }] },
  ];
  const cats = [['starters', 'Starters'], ['mains', 'Mains & grill'], ['desserts', 'Desserts'], ['drinks', 'Drinks']];

  Shop.init({
    key: 'aurelia', name: 'Aurelia', whatsapp: '2348138582078', orderPrefix: 'AUR', products, serviceFee: 0.075,
    promos: { AURELIA10: 0.10 }, promoHint: 'AURELIA10', addIcon: 'bag',
    delivery: {
      fee: 2500, freeOver: 60000, pickup: true, eta: '45–60 min', pickupEta: 'Ready in 30 min', pickupWord: 'Collect',
      pickupLabel: 'Collect from Aurelia', pickupAddress: '7 Okigwe Road, by Imo Concorde Boulevard, Owerri',
      zones: [{ name: 'Okigwe Road / Concorde', fee: 2000 }, { name: 'Ikenegbu / Wetheral', fee: 2500 }, { name: 'New Owerri', fee: 3000 }, { name: 'World Bank / Egbu', fee: 3500 }],
      slots: ['6:30 – 7:00pm', '7:00 – 7:30pm', '7:30 – 8:00pm', '8:00 – 8:30pm', '8:30 – 9:00pm'],
    },
    labels: {
      cart: 'Your order', cartShort: 'your order', checkout: 'Checkout', browse: 'Browse the menu', emptyTitle: 'Nothing here yet',
      emptyText: 'Add a few dishes and we\'ll bring the restaurant to you.', upsell: 'To finish', deliveryNote: 'Delivery',
      detailsTitle: 'Delivery details', noteLabel: 'Note for the chef', notePlaceholder: 'Allergies, cooking preferences…',
      successTitle: 'Your dinner is confirmed', successText: 'Thank you, {name}. The kitchen has started on your order.', keepShopping: 'Back to menu',
    },
    timeline: {
      delivery: [
        { icon: 'receipt', title: 'Order confirmed', text: 'Payment received' },
        { icon: 'chef', title: 'In the kitchen', text: 'Cooked to order by our chefs' },
        { icon: 'truck', title: 'On its way', text: 'In insulated packaging' },
        { icon: 'checkcircle', title: 'Delivered', text: 'Enjoy your evening' },
      ],
      pickup: [
        { icon: 'receipt', title: 'Order confirmed', text: 'Payment received' },
        { icon: 'chef', title: 'In the kitchen', text: 'Cooked to order by our chefs' },
        { icon: 'store', title: 'Ready to collect', text: 'Ask for your order at the host stand' },
      ],
    },
  });

  /* ---------- signatures ---------- */
  $('[data-sig]').innerHTML = products.filter(p => p.sig).map((p, i) => `
    <article class="sig-card" data-quick="${p.id}" tabindex="0" data-r>
      <img src="${p.img}" alt="${esc(p.name)}" loading="lazy">
      <div class="sig-shade"></div>
      <span class="sig-num">0${i + 1}</span>
      <div class="sig-body"><p>${esc(p.kicker)}</p><h3>${esc(p.name)}</h3><div><b>${Shop.fmt(p.price)}</b><button class="sig-add" data-add="${p.id}" aria-label="Add ${esc(p.name)}"><svg class="ic"><use href="#i-plus"/></svg></button></div></div>
    </article>`).join('');

  /* ---------- tabbed menu ---------- */
  const tabs = $('[data-tabs]'), list = $('[data-menu]');
  let tab = 'starters';
  tabs.innerHTML = cats.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === tab ? 'is-on' : ''}">${l}</button>`).join('') + '<span class="tab-ink"></span>';
  const ink = $('.tab-ink', tabs);
  const moveInk = () => { const b = $('.is-on', tabs); ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; };
  function renderMenu() {
    list.classList.remove('is-in');
    list.innerHTML = products.filter(p => p.cat === tab).map(p => `
      <article class="dish" data-quick="${p.id}" tabindex="0">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy">
        <div class="dish-body">
          <div class="dish-line"><h3>${esc(p.name)}</h3><i></i><b>${Shop.fmt(p.price)}</b></div>
          <p>${esc(p.desc)}</p>
          ${p.badge ? `<span class="dish-badge">${esc(p.badge)}</span>` : ''}
        </div>
        <button class="dish-add" data-add="${p.id}" aria-label="Add ${esc(p.name)}"><svg class="ic"><use href="#i-plus"/></svg></button>
      </article>`).join('');
    requestAnimationFrame(() => list.classList.add('is-in'));
  }
  tabs.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab; $$('[data-tab]', tabs).forEach(x => x.classList.toggle('is-on', x === b)); moveInk(); renderMenu();
  });
  renderMenu(); requestAnimationFrame(moveInk); addEventListener('resize', moveInk);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-quick]')) Shop.quickView(e.target.dataset.quick); });

  /* ---------- tonight ---------- */
  const day = new Date().getDay();
  $('[data-tonight]').textContent = day === 1 ? 'Closed today · open tomorrow 6pm' : day === 0 ? 'Brunch 12pm – 4pm' : (day >= 5 ? 'Open 6pm – 12:30am' : 'Open 6pm – 11pm');
  $('[data-tables]').textContent = 3 + (new Date().getDate() % 6);

  /* ---------- reservation ---------- */
  const book = $('[data-book]'), dates = $('[data-dates]'), times = $('[data-times]');
  const sel = { date: null, time: null, guests: 2, seat: 'Dining room' };
  const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
  dates.innerHTML = days.map((d, i) => `<button type="button" data-di="${i}" ${d.getDay() === 1 ? 'disabled' : ''}><small>${i === 0 ? 'Today' : i === 1 ? 'Tmrw' : D[d.getDay()]}</small><b>${d.getDate()}</b><small>${d.getDay() === 1 ? 'Closed' : M[d.getMonth()]}</small></button>`).join('');
  const slotsFor = d => {
    const base = d.getDay() === 0 ? ['12:00', '12:30', '1:00', '1:30', '2:00', '2:30', '3:00'] : ['6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30'];
    const pm = d.getDay() === 0 ? (t => +t.split(':')[0] === 12 ? 'pm' : 'pm') : (() => 'pm');
    return base.map((t, i) => ({ t: t + pm(t), full: (d.getDate() * 7 + i * 3) % 5 === 0 }));
  };
  function renderTimes() {
    const d = days[sel.date];
    times.innerHTML = slotsFor(d).map(s => `<button type="button" data-t="${s.t}" ${s.full ? 'disabled' : ''} class="${sel.time === s.t ? 'is-on' : ''}">${s.t}${s.full ? '<small>Full</small>' : ''}</button>`).join('');
  }
  dates.addEventListener('click', e => {
    const b = e.target.closest('[data-di]'); if (!b || b.disabled) return;
    sel.date = +b.dataset.di; sel.time = null;
    $$('[data-di]', dates).forEach(x => x.classList.toggle('is-on', x === b)); renderTimes();
  });
  times.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
    sel.time = b.dataset.t; $$('[data-t]', times).forEach(x => x.classList.toggle('is-on', x === b));
  });
  const first = $$('[data-di]:not([disabled])', dates)[0]; first.click();
  $$('[data-g]', book).forEach(b => b.onclick = () => { sel.guests = Math.max(1, Math.min(10, sel.guests + +b.dataset.g)); $('[data-guests]', book).textContent = sel.guests; });
  $('[data-seat]').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sel.seat = b.textContent; $$('[data-seat] button').forEach(x => x.classList.toggle('is-on', x === b)); });

  book.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', book).forEach(i => { const bad = !i.value.trim() || (i.name === 'phone' && i.value.replace(/\D/g, '').length < 10); i.closest('.fld').classList.toggle('is-bad', bad); if (bad) ok = false; });
    if (!sel.time) { times.classList.add('is-bad'); setTimeout(() => times.classList.remove('is-bad'), 600); Shop.toast('Pick a time for your table', 'clock'); return; }
    if (!ok) { Shop.toast('Please add your name and phone number', 'x'); return; }
    const d = days[sel.date], f = new FormData(book);
    const ref = 'AUR-R' + Math.floor(1000 + Math.random() * 8999);
    showBooking({ ref, d, time: sel.time, guests: sel.guests, seat: sel.seat, name: f.get('name'), occasion: f.get('occasion'), notes: f.get('notes') });
  });

  function showBooking(b) {
    const when = `${D[b.d.getDay()]} ${b.d.getDate()} ${M[b.d.getMonth()]}`;
    const host = document.createElement('div');
    host.className = 'booked';
    host.innerHTML = `<div class="booked-card" role="dialog" aria-label="Reservation confirmed">
      <button class="shop-icon-btn booked-x" aria-label="Close"><svg class="ic"><use href="#i-x"/></svg></button>
      <div class="shop-done-badge"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
      <p class="kicker">Reservation confirmed</p>
      <h3>See you ${b.d.toDateString() === new Date().toDateString() ? 'tonight' : 'soon'}, ${esc(b.name.split(' ')[0])}</h3>
      <div class="booked-ticket">
        <div><small>Date</small><b>${when}</b></div><div><small>Time</small><b>${b.time}</b></div>
        <div><small>Guests</small><b>${b.guests}</b></div><div><small>Seating</small><b>${esc(b.seat)}</b></div>
        <div class="wide"><small>Reference</small><b class="mono">${b.ref}</b></div>
      </div>
      ${b.occasion !== 'Just dinner' ? `<p class="booked-note"><svg class="ic"><use href="#i-gift"/></svg>${esc(b.occasion)} noted — we'll make it special.</p>` : ''}
      <div class="booked-actions">
        <button class="btn btn-gold" data-ics><svg class="ic"><use href="#i-calendar"/></svg>Add to calendar</button>
        <a class="btn btn-line" target="_blank" rel="noopener" href="https://wa.me/2348138582078?text=${encodeURIComponent(`Hello Aurelia, confirming my reservation ${b.ref}: ${when} at ${b.time}, ${b.guests} guests.`)}"><svg class="ic"><use href="#i-whatsapp"/></svg>WhatsApp</a>
      </div></div>`;
    document.body.appendChild(host);
    requestAnimationFrame(() => host.classList.add('is-on'));
    const close = () => { host.classList.remove('is-on'); setTimeout(() => host.remove(), 350); };
    host.addEventListener('click', e => { if (e.target === host || e.target.closest('.booked-x')) close(); });
    $('[data-ics]', host).onclick = () => {
      const [hm, ap] = [b.time.replace(/(am|pm)/, ''), b.time.slice(-2)];
      let [h, m] = hm.split(':').map(Number); if (ap === 'pm' && h < 12) h += 12;
      const start = new Date(b.d); start.setHours(h, m || 0, 0);
      const end = new Date(start.getTime() + 2 * 3600e3);
      const z = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aurelia//Reservations//EN', 'BEGIN:VEVENT', `UID:${b.ref}@aurelia`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(start)}`, `DTEND:${z(end)}`,
        `SUMMARY:Dinner at Aurelia (${b.guests} guests)`, 'LOCATION:7 Okigwe Road\\, Owerri', `DESCRIPTION:Reference ${b.ref}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `aurelia-${b.ref}.ics`; a.click();
      Shop.toast('Calendar invite downloaded', 'calendar');
    };
    book.reset(); $$('.fld', book).forEach(f => f.classList.remove('is-bad'));
  }

  /* ---------- private dining deposit ---------- */
  $$('[data-pkg]').forEach(b => b.onclick = () => Shop.pay({
    title: 'Private dining deposit', prefix: 'AUR-PD',
    lines: [{ name: `The Cellar Room — ${b.dataset.pkg}`, sub: 'Refundable deposit to hold your date', price: +b.dataset.deposit, qty: 1, img: 'img/wine.jpg' }],
    successTitle: 'Your date is on hold', successText: 'Our events team will call you within 2 hours to plan the menu.',
    metaLabel: 'Package', metaValue: b.dataset.pkg,
    timeline: [{ icon: 'receipt', title: 'Deposit received', text: 'Your date is held for 7 days' }, { icon: 'call', title: 'Planning call', text: 'Our events team will reach out' }, { icon: 'wine', title: 'Menu tasting', text: 'Optional, the week before' }],
  }));

  /* ---------- gallery lightbox ---------- */
  const lb = $('[data-lightbox]');
  $('[data-gallery]').addEventListener('click', e => { const b = e.target.closest('[data-img]'); if (!b) return; $('img', lb).src = b.dataset.img; lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-on')); });
  lb.addEventListener('click', () => { lb.classList.remove('is-on'); setTimeout(() => lb.hidden = true, 300); });

  /* ---------- quotes ---------- */
  const qs = $$('[data-quotes] figure'), qd = $('[data-qdots]');
  qd.innerHTML = qs.map((_, i) => `<button aria-label="Quote ${i + 1}" class="${i === 0 ? 'is-on' : ''}"></button>`).join('');
  let qi = 0;
  const showQ = i => { qi = i; qs.forEach((q, j) => q.classList.toggle('is-on', j === i)); $$('button', qd).forEach((d, j) => d.classList.toggle('is-on', j === i)); };
  $$('button', qd).forEach((d, i) => d.onclick = () => showQ(i));
  setInterval(() => showQ((qi + 1) % qs.length), 6000);
})();
