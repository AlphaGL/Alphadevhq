(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const PROTEIN = { name: 'Protein', choices: [{ label: 'Chicken' }, { label: 'Beef' }, { label: 'Turkey', add: 1000 }, { label: 'Fish', add: 800 }] };
  const RICE_EXTRA = { name: 'Extra', choices: [{ label: 'No extra' }, { label: 'Fried plantain', add: 700 }, { label: 'Moi moi', add: 1200 }, { label: 'Coleslaw', add: 500 }] };
  const SWALLOW = { name: 'Swallow', choices: [{ label: 'Pounded yam' }, { label: 'Eba' }, { label: 'Semo' }, { label: 'Wheat', add: 300 }] };
  const HEAT = { name: 'Heat', choices: [{ label: 'Medium' }, { label: 'Mild' }, { label: 'Hot' }, { label: 'Extra hot' }] };

  const products = [
    { id: 'jollof', cat: 'rice', name: 'Smoky Party Jollof', price: 4500, img: 'img/jollof.jpg', badge: 'Bestseller', rating: 4.9, reviews: 812, heat: 1,
      desc: 'Firewood-smoky jollof with sweet fried plantain and your choice of protein.', kicker: 'Rice dishes',
      long: 'Our signature. Long-grain rice slow-cooked in a rich tomato and pepper base over firewood for that real party flavour, served with sweet fried plantain.',
      meta: [['clock', '15 min'], ['flame', 'Mildly spicy'], ['users', 'Serves 1']], options: [PROTEIN, RICE_EXTRA] },
    { id: 'fried-rice', cat: 'rice', name: 'Special Fried Rice', price: 4800, img: 'img/fried-rice.jpg', rating: 4.8, reviews: 534,
      desc: 'Liver, prawns and mixed veg, tossed with peppered beef.', kicker: 'Rice dishes',
      long: 'Nigerian-style fried rice with liver, shrimp, carrots and green beans, served with peppered beef or your choice of protein.',
      meta: [['clock', '15 min'], ['users', 'Serves 1']], options: [PROTEIN, RICE_EXTRA] },
    { id: 'chicken-rice', cat: 'rice', name: 'Chicken & Rice Box', price: 5500, img: 'img/chicken-rice.jpg', badge: 'Big portion', rating: 4.8, reviews: 401,
      desc: 'A full quarter chicken in pepper sauce over rice. Proper lunch.', kicker: 'Rice dishes',
      long: 'A generous quarter chicken, grilled then finished in our pepper sauce, on a bed of white rice or jollof.',
      meta: [['clock', '20 min'], ['users', 'Very filling']], options: [{ name: 'Rice', choices: [{ label: 'Jollof rice' }, { label: 'White rice & stew' }, { label: 'Fried rice', add: 500 }] }, RICE_EXTRA] },
    { id: 'egusi', cat: 'soups', name: 'Egusi & Pounded Yam', price: 5200, img: 'img/egusi.jpg', badge: 'Chef\'s pick', rating: 4.9, reviews: 667,
      desc: 'Rich egusi with assorted meat and stockfish, with smooth pounded yam.', kicker: 'Soups & swallow',
      long: 'Ground melon seed soup cooked with spinach, assorted meat and stockfish, served with soft, smooth pounded yam.',
      meta: [['clock', '15 min'], ['leaf', 'Fresh greens']], options: [SWALLOW, PROTEIN] },
    { id: 'pepper-soup', cat: 'soups', name: 'Goat Meat Pepper Soup', price: 4000, img: 'img/pepper-soup.jpg', rating: 4.7, reviews: 289, heat: 3,
      desc: 'Fiery, aromatic broth with tender goat meat. Good for the soul.', kicker: 'Soups & swallow',
      long: 'Tender goat meat in a hot, aromatic broth made with uda, uziza and scent leaves. Add yam to make it a meal.',
      meta: [['flame', 'Hot'], ['clock', '10 min']], options: [{ name: 'Add', choices: [{ label: 'Soup only' }, { label: 'With boiled yam', add: 800 }, { label: 'With white rice', add: 900 }] }, HEAT] },
    { id: 'suya', cat: 'grills', name: 'Beef Suya', price: 3500, img: 'img/suya.jpg', badge: 'Evenings', rating: 4.9, reviews: 958, heat: 2, upsell: true,
      desc: 'Thin-sliced beef, grilled over open fire with our own yaji spice.', kicker: 'Grills',
      long: 'Thin-sliced beef rubbed with our house yaji spice, grilled over open flame, served with onions, tomato and extra spice on the side.',
      meta: [['flame', 'Spicy'], ['clock', '12 min']], options: [{ name: 'Size', choices: [{ label: 'Regular' }, { label: 'Large', add: 2500 }] }, HEAT] },
    { id: 'shawarma', cat: 'grills', name: 'Chicken Shawarma', price: 3800, img: 'img/shawarma.jpg', rating: 4.6, reviews: 512,
      desc: 'Grilled chicken, creamy sauce and veg, wrapped and toasted.', kicker: 'Grills',
      long: 'Spiced grilled chicken, cabbage, carrots and our creamy garlic sauce, wrapped in soft bread and toasted.',
      meta: [['clock', '10 min']], options: [{ name: 'Size', choices: [{ label: 'Regular' }, { label: 'Jumbo (2 sausages)', add: 1500 }] }] },
    { id: 'small-chops', cat: 'sides', name: 'Small Chops Platter', price: 6500, img: 'img/small-chops.jpg', badge: 'For sharing', rating: 4.8, reviews: 344,
      desc: 'Puff-puff, samosa, spring rolls, gizdodo and chicken. Party in a tray.', kicker: 'Small chops & sides',
      long: 'Everything you love at a party: puff-puff, samosas, spring rolls, gizdodo and peppered chicken, with dipping sauce.',
      meta: [['users', 'Serves 2–3']], options: [{ name: 'Size', choices: [{ label: 'Regular' }, { label: 'Party tray (serves 8)', add: 13500 }] }] },
    { id: 'plantain', cat: 'sides', name: 'Fried Plantain', price: 1500, img: 'img/plantain.jpg', rating: 4.8, reviews: 221, upsell: true,
      desc: 'Sweet, ripe dodo, fried till golden.', kicker: 'Small chops & sides', long: 'Ripe plantain, sliced and fried till golden and caramelised at the edges.' },
    { id: 'moi-moi', cat: 'sides', name: 'Moi Moi', price: 1200, img: 'img/moi-moi.jpg', rating: 4.7, reviews: 187,
      desc: 'Steamed bean pudding with egg and fish.', kicker: 'Small chops & sides', long: 'Soft steamed bean pudding with boiled egg and fish flakes, wrapped in leaves the traditional way.' },
    { id: 'puff-puff', cat: 'sides', name: 'Puff-Puff (10 pieces)', price: 1000, img: 'img/puff-puff.jpg', rating: 4.8, reviews: 305, upsell: true,
      desc: 'Soft, golden and lightly sweet. Hard to stop at one.', kicker: 'Small chops & sides', long: 'Ten soft, golden puff-puffs, lightly sweet and dusted with sugar on request.' },
    { id: 'zobo', cat: 'drinks', name: 'Chilled Zobo', price: 800, img: 'img/zobo.jpg', rating: 4.8, reviews: 402, upsell: true,
      desc: 'Hibiscus with ginger and pineapple, ice cold.', kicker: 'Drinks', long: 'Brewed in-house from hibiscus, ginger, cloves and fresh pineapple. No artificial colouring.',
      options: [{ name: 'Size', choices: [{ label: '50cl' }, { label: '1 litre', add: 700 }] }] },
    { id: 'chapman', cat: 'drinks', name: 'Classic Chapman', price: 1800, img: 'img/chapman.jpg', rating: 4.7, reviews: 156,
      desc: 'The Nigerian mocktail: fizzy, fruity, with cucumber and lime.', kicker: 'Drinks', long: 'Fanta, Sprite, grenadine and bitters, finished with cucumber and lime. Served ice cold.' },
    { id: 'family-feast', cat: 'deal', name: 'The Family Feast', price: 18500, img: 'img/chicken-rice.jpg', hidden: true, rating: 4.9, reviews: 96, kicker: 'Today\'s deal',
      desc: 'Jollof & fried rice for four, whole chicken, sides and drinks.', long: 'Jollof and fried rice for four, a whole peppered chicken, fried plantain, four moi moi and four chilled drinks.' },
  ];

  const cats = [['all', 'All'], ['rice', 'Rice dishes'], ['soups', 'Soups & swallow'], ['grills', 'Grills'], ['sides', 'Small chops & sides'], ['drinks', 'Drinks']];

  Shop.init({
    key: 'yellowpot', name: 'Yellow Pot Kitchen', whatsapp: '2348138582078', orderPrefix: 'YP', products,
    promos: { WELCOME10: 0.10, OWERRI15: 0.15 }, promoHint: 'WELCOME10',
    delivery: {
      fee: 1500, freeOver: 20000, pickup: true, eta: '30–45 min', pickupEta: 'Ready in 20 min',
      pickupLabel: 'Pick up at Yellow Pot', pickupAddress: '12 Wetheral Road, opposite Ikenegbu Junction, Owerri',
      zones: [{ name: 'Ikenegbu / Wetheral', fee: 1000 }, { name: 'New Owerri', fee: 1500 }, { name: 'World Bank / Federal Housing', fee: 1800 }, { name: 'Aladinma / Orji', fee: 2000 }, { name: 'FUTO / Ihiagwa', fee: 3000 }],
      slots: ['12:00 – 12:30', '12:30 – 1:00', '1:00 – 1:30', '6:00 – 6:30', '6:30 – 7:00', '7:00 – 7:30'],
    },
    labels: {
      cart: 'Your order', cartShort: 'your order', itemWord: 'item', checkout: 'Checkout', browse: 'See the menu',
      emptyTitle: 'Your order is empty', emptyText: 'Add something tasty from the menu and it will show up here.',
      upsell: 'Goes well with', deliveryNote: 'Delivery fee', detailsTitle: 'Where should we bring your food?',
      noteLabel: 'Note for the kitchen', notePlaceholder: 'e.g. no onions, extra pepper', successTitle: 'Your food is on the way',
      successText: 'Thank you, {name}. The kitchen has your order and we\'ll keep you posted on WhatsApp.', keepShopping: 'Back to menu',
    },
    timeline: {
      delivery: [
        { icon: 'receipt', title: 'Order received', text: 'Payment confirmed' },
        { icon: 'flame', title: 'Cooking now', text: 'Your food is on the fire' },
        { icon: 'truck', title: 'Rider on the way', text: 'Tunde is bringing it' },
        { icon: 'checkcircle', title: 'Delivered', text: 'Enjoy your meal' },
      ],
      pickup: [
        { icon: 'receipt', title: 'Order received', text: 'Payment confirmed' },
        { icon: 'flame', title: 'Cooking now', text: 'Your food is on the fire' },
        { icon: 'store', title: 'Ready for pickup', text: 'Show your order number at the counter' },
      ],
    },
  });

  /* ---------- menu ---------- */
  const grid = $('[data-grid]'), chips = $('[data-chips]'), search = $('[data-search]'), none = $('[data-noresults]');
  let active = 'all';
  const visible = products.filter(p => !p.hidden);
  chips.innerHTML = cats.map(([k, l]) => `<button role="tab" class="chip ${k === active ? 'is-on' : ''}" data-cat="${k}">${l}<small>${k === 'all' ? visible.length : visible.filter(p => p.cat === k).length}</small></button>`).join('');
  const flames = n => n ? `<span class="heat" title="Spice level">${Array.from({ length: 3 }, (_, i) => `<svg class="ic ${i < n ? 'on' : ''}"><use href="#i-flame"/></svg>`).join('')}</span>` : '';

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = visible.filter(p => (active === 'all' || p.cat === active) && (!q || (p.name + ' ' + p.desc + ' ' + p.kicker).toLowerCase().includes(q)));
    grid.innerHTML = list.map(p => `
      <article class="card" data-quick="${p.id}" data-r tabindex="0" aria-label="${p.name}">
        <div class="card-img"><img src="${p.img}" alt="${p.name}" loading="lazy">${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</div>
        <div class="card-body">
          <div class="card-top"><h3>${p.name}</h3>${flames(p.heat)}</div>
          <p>${p.desc}</p>
          <div class="card-foot">
            <div><b>${Shop.fmt(p.price)}</b><span class="rate"><svg class="ic"><use href="#i-starfill"/></svg>${p.rating}</span></div>
            <button class="add" data-add="${p.id}" aria-label="Add ${p.name}"><svg class="ic"><use href="#i-plus"/></svg><span>Add</span></button>
          </div>
        </div>
      </article>`).join('');
    none.hidden = list.length > 0;
    reveal(grid);
  }
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    active = b.dataset.cat;
    $$('.chip', chips).forEach(c => c.classList.toggle('is-on', c === b));
    render();
  });
  search.addEventListener('input', render);
  grid.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-quick]')) Shop.quickView(e.target.dataset.quick); });
  render();

  /* ---------- deal countdown (to midnight) ---------- */
  const cd = $('[data-countdown]');
  const tick = () => {
    const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const parts = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60];
    $$('b', cd).forEach((b, i) => b.textContent = String(parts[i]).padStart(2, '0'));
  };
  tick(); setInterval(tick, 1000);

  /* ---------- open now + today's hours ---------- */
  const hours = { 0: [12, 22], 1: [8, 22], 2: [8, 22], 3: [8, 22], 4: [8, 22], 5: [8, 22], 6: [9, 23] };
  const now = new Date(), [o, c] = hours[now.getDay()], h = now.getHours() + now.getMinutes() / 60;
  const open = h >= o && h < c;
  const pill = $('[data-open-pill]');
  pill.classList.toggle('is-closed', !open);
  $('span', pill).textContent = open ? `Open · till ${c > 12 ? c - 12 : c}pm` : `Closed · opens ${o > 12 ? o - 12 + 'pm' : o + 'am'}`;
  const rowIdx = now.getDay() === 0 ? 2 : now.getDay() === 6 ? 1 : 0;
  $$('[data-hours] tr')[rowIdx].classList.add('is-today');

  /* ---------- reviews ---------- */
  $$('.rv .stars').forEach(s => s.innerHTML = '<svg class="ic"><use href="#i-starfill"/></svg>'.repeat(5));
  const track = $('[data-rv-track]');
  $$('[data-rv]').forEach(b => b.onclick = () => track.scrollBy({ left: +b.dataset.rv * (track.firstElementChild.offsetWidth + 20), behavior: 'smooth' }));
})();
