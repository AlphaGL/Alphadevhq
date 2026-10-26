/* Shared site polish: reveals, header, mobile nav, counters, parallax, tilt, credits, sticky cart bar. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll reveal (staggered per parent)
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const sibs = $$('[data-r]', el.parentElement);
    el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 70 + 'ms';
    el.classList.add('is-in');
    io.unobserve(el);
  }), { threshold: .14, rootMargin: '0px 0px -40px 0px' });
  window.reveal = (root = document) => $$('[data-r]:not(.is-in)', root).forEach(el => io.observe(el));
  reveal();

  // header state
  const hdr = $('.hdr');
  const onScroll = () => { if (hdr) hdr.classList.toggle('is-scrolled', scrollY > 30); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile nav
  const burger = $('[data-burger]'), mnav = $('[data-mnav]');
  if (burger && mnav) {
    burger.onclick = () => { const on = !document.body.classList.contains('nav-open'); document.body.classList.toggle('nav-open', on); burger.setAttribute('aria-expanded', on); };
    mnav.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
  }

  // count-up
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = reduce ? 1 : 1400;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); cio.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // parallax backgrounds
  const px = $$('[data-parallax]');
  if (px.length && !reduce) {
    const tick = () => px.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - innerHeight / 2) * -0.18}px, 0) scale(1.15)`;
    });
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true }); tick();
  }

  // pointer tilt
  if (!reduce && matchMedia('(pointer: fine)').matches) $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--rx', `${-y * 6}deg`); el.style.setProperty('--ry', `${x * 8}deg`);
      el.style.setProperty('--mx', `${x * 18}px`); el.style.setProperty('--my', `${y * 18}px`);
    });
    el.addEventListener('pointerleave', () => ['--rx', '--ry', '--mx', '--my'].forEach(p => el.style.setProperty(p, '0')));
  });

  // year
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // sticky mobile cart bar
  const bar = $('[data-mbar]');
  if (bar && window.Shop) {
    const total = $('[data-mbar-total]', bar);
    const upd = () => {
      const lines = Shop.lines();
      const n = lines.reduce((s, l) => s + l.qty, 0), sum = lines.reduce((s, l) => s + l.qty * l.price, 0);
      bar.hidden = n === 0; if (total) total.textContent = Shop.fmt(sum);
    };
    Shop.on(upd); setTimeout(upd, 0);
  }

  // photo credits
  const cb = $('[data-credits]');
  if (cb) cb.onclick = () => {
    const c = window.PHOTO_CREDITS || {};
    const host = document.createElement('div');
    host.className = 'credits-pop';
    host.innerHTML = `<div class="credits-card" role="dialog" aria-label="Photo credits"><button class="shop-icon-btn" aria-label="Close">${window.icon ? icon('x') : '×'}</button><h3>Photo credits</h3><p>Photos from Wikimedia Commons, used under their open licences.</p><ul>${Object.values(c).map(x => `<li><a href="${x.source}" target="_blank" rel="noopener">${x.title}</a><span>${x.artist} · ${x.license}</span></li>`).join('')}</ul></div>`;
    document.body.appendChild(host);
    requestAnimationFrame(() => host.classList.add('is-on'));
    host.addEventListener('click', e => { if (e.target === host || e.target.closest('button')) { host.classList.remove('is-on'); setTimeout(() => host.remove(), 300); } });
  };

  // smooth anchor scroll with header offset
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-cart-open')) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - (hdr ? hdr.offsetHeight - 4 : 0), behavior: reduce ? 'auto' : 'smooth' });
  });
})();
