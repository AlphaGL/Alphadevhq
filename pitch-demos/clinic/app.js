(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => '₦' + Math.round(n).toLocaleString('en-NG');

  Shop.init({ key: 'mercyhill', name: 'Mercy Hill Specialist Hospital', whatsapp: '2348138582078', orderPrefix: 'MH', products: [] });

  const depts = [
    { id: 'emergency', name: 'Emergency & Trauma', icon: 'ambulance', img: 'img/corridor.jpg', fee: 0, short: '24/7, ambulance on standby', long: 'A doctor-led emergency unit open every hour of every day, with resuscitation bays, an observation ward and an ambulance on standby.', treats: ['Accidents and injuries', 'Chest pain and breathing problems', 'High fevers and seizures', 'Severe abdominal pain'] },
    { id: 'maternity', name: 'Maternity & Obstetrics', icon: 'baby', img: 'img/maternity.jpg', fee: 20000, short: 'Antenatal care to delivery', long: 'Antenatal clinics, private delivery suites, caesarean theatre and a newborn unit, with consultant obstetricians on call around the clock.', treats: ['Antenatal and postnatal care', 'Normal and caesarean delivery', 'High-risk pregnancy', 'Fertility consultations'] },
    { id: 'paediatrics', name: 'Paediatrics', icon: 'users', img: 'img/paediatrics.jpg', fee: 15000, short: 'Babies, children & teens', long: 'Child-friendly consulting rooms and a paediatric ward, from newborn checks and vaccinations to complex childhood illness.', treats: ['Vaccinations and growth checks', 'Malaria, fevers and infections', 'Asthma and allergies', 'Newborn care'] },
    { id: 'cardiology', name: 'Cardiology', icon: 'pulse', img: 'img/checkup.jpg', fee: 25000, short: 'Heart & blood pressure', long: 'ECG, echocardiography and 24-hour blood pressure monitoring, with consultant cardiologists to manage heart conditions long term.', treats: ['High blood pressure', 'Chest pain and palpitations', 'Heart failure', 'Pre-surgery heart checks'] },
    { id: 'general', name: 'General Medicine', icon: 'stethoscope', img: 'img/doctor-hands.jpg', fee: 10000, short: 'Your first port of call', long: 'Experienced family physicians for everyday illness, chronic conditions like diabetes, and referrals to the right specialist.', treats: ['Diabetes and hypertension', 'Infections and fevers', 'Routine check-ups', 'Specialist referrals'] },
    { id: 'surgery', name: 'General Surgery', icon: 'shield', img: 'img/ward.jpg', fee: 20000, short: 'Modern operating theatres', long: 'Two fully equipped theatres for planned and emergency surgery, including keyhole procedures for faster recovery.', treats: ['Hernia and appendix', 'Gallbladder surgery', 'Lumps and bumps', 'Keyhole (laparoscopic) surgery'] },
    { id: 'dental', name: 'Dental Care', icon: 'tooth', img: 'img/dental.jpg', fee: 12000, short: 'Check-ups to implants', long: 'Modern dental suites for check-ups, cleaning, fillings, root canals, braces and implants, for adults and children.', treats: ['Scaling and polishing', 'Fillings and root canals', 'Braces and aligners', 'Extractions and implants'] },
    { id: 'lab', name: 'Laboratory & Imaging', icon: 'flask', img: 'img/lab-sample.jpg', fee: 0, short: 'Results within 24 hours', long: 'An accredited laboratory with ultrasound, X-ray and ECG on site. Most results are ready within 24 hours and sent to your phone.', treats: ['Blood tests and full blood count', 'Ultrasound and X-ray', 'Malaria and typhoid tests', 'Hormone and fertility tests'] },
    { id: 'physio', name: 'Physiotherapy', icon: 'bone', img: 'img/physio.jpg', fee: 12000, short: 'Recovery & rehabilitation', long: 'A fully equipped gym and treatment rooms for back pain, sports injuries and recovery after surgery or stroke.', treats: ['Back and neck pain', 'Sports injuries', 'Post-surgery rehab', 'Stroke recovery'] },
  ];
  const doctors = [
    { id: 'okafor', name: 'Dr. Adaeze Okafor', role: 'Consultant Obstetrician', dept: 'maternity', yrs: 16, days: [1, 3, 5], langs: 'English, Igbo', hue: 172 },
    { id: 'nwosu', name: 'Dr. Chidi Nwosu', role: 'Consultant Cardiologist', dept: 'cardiology', yrs: 19, days: [2, 4, 6], langs: 'English, Igbo', hue: 205 },
    { id: 'eze', name: 'Dr. Ifeoma Eze', role: 'Consultant Paediatrician', dept: 'paediatrics', yrs: 12, days: [1, 2, 4, 5], langs: 'English, Igbo', hue: 340 },
    { id: 'bello', name: 'Dr. Musa Bello', role: 'Consultant Surgeon', dept: 'surgery', yrs: 21, days: [1, 3, 4], langs: 'English, Hausa', hue: 28 },
    { id: 'adeyemi', name: 'Dr. Tolu Adeyemi', role: 'Family Physician', dept: 'general', yrs: 9, days: [1, 2, 3, 4, 5, 6], langs: 'English, Yoruba', hue: 150 },
    { id: 'uche', name: 'Dr. Uchenna Obi', role: 'Family Physician', dept: 'general', yrs: 11, days: [1, 2, 3, 5, 6], langs: 'English, Igbo', hue: 260 },
    { id: 'ibe', name: 'Dr. Nkem Ibe', role: 'Dental Surgeon', dept: 'dental', yrs: 8, days: [2, 3, 5, 6], langs: 'English, Igbo', hue: 190 },
    { id: 'okon', name: 'Mr. Effiong Okon', role: 'Senior Physiotherapist', dept: 'physio', yrs: 10, days: [1, 2, 4, 6], langs: 'English, Efik', hue: 45 },
    { id: 'anyanwu', name: 'Dr. Grace Anyanwu', role: 'Obstetrician & Gynaecologist', dept: 'maternity', yrs: 10, days: [2, 4, 6], langs: 'English, Igbo', hue: 300 },
  ];
  const bookable = depts.filter(d => d.fee > 0);
  const initials = n => n.replace(/^(Dr\.|Mr\.)\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2);
  const deptOf = id => depts.find(d => d.id === id);
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- stars ---------- */
  $$('.stars-in').forEach(s => s.innerHTML = '<svg class="ic"><use href="#i-starfill"/></svg>'.repeat(5));

  /* ---------- hero finder + next slot ---------- */
  const fsel = $('[data-finder-dept]');
  fsel.innerHTML = '<option value="">Choose a department…</option>' + bookable.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
  $('[data-finder]').addEventListener('submit', e => {
    e.preventDefault();
    if (fsel.value) { state.dept = fsel.value; state.doc = null; go(1); } else go(0);
    $('#book').scrollIntoView({ behavior: 'smooth' });
  });
  const h = new Date().getHours();
  $('[data-next-slot]').textContent = h < 15 ? `Today, ${h < 12 ? '2:30pm' : '4:00pm'}` : 'Tomorrow, 9:00am';

  /* ---------- departments ---------- */
  $('[data-depts]').innerHTML = depts.map(d => `
    <button class="dept" data-dept="${d.id}" data-r>
      <span class="dept-ic"><svg class="ic"><use href="#i-${d.icon}"/></svg></span>
      <b>${esc(d.name)}</b><span>${esc(d.short)}</span>
      <svg class="ic dept-go"><use href="#i-arrowur"/></svg>
    </button>`).join('');
  const pop = $('[data-dept-pop]');
  const closePop = () => { pop.classList.remove('is-on'); setTimeout(() => pop.hidden = true, 300); };
  pop.addEventListener('click', e => { if (e.target === pop || e.target.closest('.dp-x')) closePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) closePop(); });
  $('[data-depts]').addEventListener('click', e => {
    const b = e.target.closest('[data-dept]'); if (!b) return;
    const d = deptOf(b.dataset.dept), docs = doctors.filter(x => x.dept === d.id);
    $('[data-dept-body]').innerHTML = `
      <div class="dp-img" style="background-image:url('${d.img}')"><span class="dept-ic"><svg class="ic"><use href="#i-${d.icon}"/></svg></span></div>
      <div class="dp-body">
        <h3>${esc(d.name)}</h3><p>${esc(d.long)}</p>
        <p class="dp-h">We help with</p><ul class="dp-list">${d.treats.map(t => `<li><svg class="ic"><use href="#i-check"/></svg>${esc(t)}</li>`).join('')}</ul>
        ${docs.length ? `<p class="dp-h">Consultants</p><div class="dp-docs">${docs.map(x => `<span class="mono" style="--h:${x.hue}">${initials(x.name)}</span><span><b>${esc(x.name)}</b><small>${esc(x.role)}</small></span>`).join('')}</div>` : ''}
        ${d.fee ? `<div class="dp-foot"><span>Consultation from <b>${fmt(d.fee)}</b></span><button class="btn btn-primary" data-dp-book="${d.id}">Book ${esc(d.name.split(' ')[0])}</button></div>`
        : `<div class="dp-foot"><span>${d.id === 'emergency' ? 'No appointment needed — just come in.' : 'Walk in Mon–Sat, 7am–6pm.'}</span><a class="btn btn-primary" href="tel:+2348138582078"><svg class="ic"><use href="#i-call"/></svg>Call us</a></div>`}
      </div>`;
    pop.hidden = false; requestAnimationFrame(() => pop.classList.add('is-on'));
    const bk = $('[data-dp-book]', pop);
    if (bk) bk.onclick = () => { state.dept = d.id; state.doc = null; go(1); closePop(); setTimeout(() => $('#book').scrollIntoView({ behavior: 'smooth' }), 150); };
  });

  /* ---------- booking wizard ---------- */
  const state = { step: 0, dept: null, doc: null, day: null, time: null, visit: 'new', pay: 'online' };
  const body = $('[data-wiz-body]'), next = $('[data-wiz-next]'), back = $('[data-wiz-back]'), sum = $('[data-wiz-sum]'), bar = $('[data-wiz-bar]');
  const days = Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; }).filter(d => d.getDay() !== 0);
  const slots = ['8:30am', '9:00am', '9:30am', '10:00am', '11:00am', '11:30am', '12:00pm', '2:00pm', '2:30pm', '3:00pm', '4:00pm', '4:30pm'];
  const taken = (d, i) => (d.getDate() * 3 + i * 7 + (state.doc ? state.doc.length : 0)) % 4 === 0;
  const docFor = () => doctors.find(x => x.id === state.doc);
  const dayOK = d => !state.doc || docFor().days.includes(d.getDay());

  function render() {
    const s = state.step;
    $$('[data-steps] li').forEach((li, i) => { li.classList.toggle('is-on', i === s); li.classList.toggle('is-done', i < s); });
    bar.style.width = ((s + 1) / 4 * 100) + '%';
    back.hidden = s === 0;
    next.innerHTML = s === 3 ? 'Confirm booking <svg class="ic"><use href="#i-check"/></svg>' : 'Continue <svg class="ic"><use href="#i-arrowr"/></svg>';
    const d = state.dept && deptOf(state.dept);
    sum.innerHTML = d ? `<b>${esc(d.name)}</b>${state.doc ? ' · ' + esc(docFor().name) : ''}${state.day != null && state.time ? ' · ' + DAY[days[state.day].getDay()] + ' ' + days[state.day].getDate() + ', ' + state.time : ''}` : '';
    body.classList.remove('is-in');
    if (s === 0) body.innerHTML = `<h3>Which department do you need?</h3><div class="opt-grid">${bookable.map(x => `<button type="button" class="opt ${state.dept === x.id ? 'is-on' : ''}" data-v="${x.id}"><span class="dept-ic"><svg class="ic"><use href="#i-${x.icon}"/></svg></span><span><b>${esc(x.name)}</b><small>From ${fmt(x.fee)}</small></span></button>`).join('')}</div>`;
    if (s === 1) {
      const list = doctors.filter(x => x.dept === state.dept);
      body.innerHTML = `<h3>Choose your doctor</h3><div class="opt-list">
        <button type="button" class="opt opt-row ${state.doc === 'any' ? 'is-on' : ''}" data-v="any"><span class="mono" style="--h:180"><svg class="ic"><use href="#i-sparkle"/></svg></span><span><b>First available doctor</b><small>Fastest — usually today or tomorrow</small></span></button>
        ${list.map(x => `<button type="button" class="opt opt-row ${state.doc === x.id ? 'is-on' : ''}" data-v="${x.id}"><span class="mono" style="--h:${x.hue}">${initials(x.name)}</span><span><b>${esc(x.name)}</b><small>${esc(x.role)} · ${x.yrs} yrs · ${x.days.map(n => DAY[n]).join(', ')}</small></span></button>`).join('')}</div>`;
    }
    if (s === 2) {
      const di = state.day;
      body.innerHTML = `<h3>Pick a date and time</h3>
        <div class="wdays">${days.map((d, i) => `<button type="button" class="${di === i ? 'is-on' : ''}" data-day="${i}" ${dayOK(d) ? '' : 'disabled'}><small>${i === 0 ? 'Today' : DAY[d.getDay()]}</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small></button>`).join('')}</div>
        ${di != null ? `<p class="wlabel">Available times on ${DAY[days[di].getDay()]} ${days[di].getDate()} ${MON[days[di].getMonth()]}</p><div class="wtimes">${slots.map((t, i) => { const past = di === 0 && (i < 7 ? 8 + i * .5 : 14 + (i - 7) * .5) <= new Date().getHours() + 1; const off = taken(days[di], i) || past; return `<button type="button" data-time="${t}" ${off ? 'disabled' : ''} class="${state.time === t ? 'is-on' : ''}">${t}</button>`; }).join('')}</div>` : '<p class="wlabel muted">Choose a date to see times.</p>'}`;
    }
    if (s === 3) {
      const f = state.form || {};
      body.innerHTML = `<h3>Your details</h3>
        <div class="seg2" data-visit><button type="button" class="${state.visit === 'new' ? 'is-on' : ''}" data-v="new">First visit</button><button type="button" class="${state.visit === 'returning' ? 'is-on' : ''}" data-v="returning">I've been before</button></div>
        <form class="wform" data-wform novalidate>
          <label class="fld"><span>Patient's full name</span><input name="name" value="${esc(f.name || '')}" required autocomplete="name" placeholder="As on your ID"></label>
          <label class="fld"><span>Phone number</span><input name="phone" value="${esc(f.phone || '')}" required inputmode="tel" autocomplete="tel" placeholder="0803 123 4567"></label>
          ${state.visit === 'returning' ? `<label class="fld"><span>Hospital number</span><input name="hospno" value="${esc(f.hospno || '')}" placeholder="e.g. MH/2024/0193"></label>` : `<label class="fld"><span>Date of birth</span><input name="dob" type="date" value="${esc(f.dob || '')}"></label>`}
          <label class="fld"><span>Payment</span><select name="cover"><option ${f.cover === 'Self-pay' ? 'selected' : ''}>Self-pay</option><option ${f.cover === 'NHIA' ? 'selected' : ''}>NHIA</option><option ${f.cover === 'Hygeia HMO' ? 'selected' : ''}>Hygeia HMO</option><option ${f.cover === 'AXA Mansard' ? 'selected' : ''}>AXA Mansard</option><option ${f.cover === 'Reliance HMO' ? 'selected' : ''}>Reliance HMO</option><option ${f.cover === 'Leadway Health' ? 'selected' : ''}>Leadway Health</option></select></label>
          <label class="fld wide"><span>Reason for visit <i>(optional)</i></span><input name="reason" value="${esc(f.reason || '')}" placeholder="e.g. follow-up on blood pressure"></label>
        </form>
        <div class="paybox" data-paybox></div>`;
      renderPay();
    }
    requestAnimationFrame(() => body.classList.add('is-in'));
  }

  function renderPay() {
    const box = $('[data-paybox]'); if (!box) return;
    const form = $('[data-wform]');
    const cover = form ? form.cover.value : 'Self-pay';
    const fee = deptOf(state.dept).fee;
    if (cover !== 'Self-pay') { state.pay = 'hmo'; box.innerHTML = `<div class="hmo-note"><svg class="ic"><use href="#i-shield"/></svg><span>Covered by <b>${esc(cover)}</b>. Bring your HMO card — nothing to pay now.</span></div>`; return; }
    if (state.pay === 'hmo') state.pay = 'online';
    box.innerHTML = `<p class="wlabel">Consultation fee: <b>${fmt(fee)}</b></p><div class="seg2" data-pay><button type="button" data-v="online" class="${state.pay === 'online' ? 'is-on' : ''}">Pay now (skip the queue)</button><button type="button" data-v="desk" class="${state.pay === 'desk' ? 'is-on' : ''}">Pay at the hospital</button></div>`;
  }

  body.addEventListener('click', e => {
    const o = e.target.closest('.opt');
    if (o) {
      if (state.step === 0) { if (state.dept !== o.dataset.v) { state.doc = null; state.day = null; state.time = null; } state.dept = o.dataset.v; }
      if (state.step === 1) { state.doc = o.dataset.v === 'any' ? 'any' : o.dataset.v; state.day = null; state.time = null; }
      $$('.opt', body).forEach(x => x.classList.toggle('is-on', x === o));
      setTimeout(() => go(state.step + 1), 260);
      return;
    }
    const dy = e.target.closest('[data-day]'); if (dy && !dy.disabled) { state.day = +dy.dataset.day; state.time = null; render(); return; }
    const tm = e.target.closest('[data-time]'); if (tm && !tm.disabled) { state.time = tm.dataset.time; $$('[data-time]', body).forEach(x => x.classList.toggle('is-on', x === tm)); render(); return; }
    const vs = e.target.closest('[data-visit] button'); if (vs) { keepForm(); state.visit = vs.dataset.v; render(); return; }
    const py = e.target.closest('[data-pay] button'); if (py) { state.pay = py.dataset.v; renderPay(); }
  });
  body.addEventListener('change', e => { if (e.target.name === 'cover') { keepForm(); renderPay(); } });
  const keepForm = () => { const f = $('[data-wform]'); if (f) state.form = Object.fromEntries(new FormData(f)); };

  function go(s) {
    if (s > state.step) {
      if (state.step === 0 && !state.dept) return nudge('Choose a department');
      if (state.step === 1 && !state.doc) return nudge('Choose a doctor');
      if (state.step === 2 && (state.day == null || !state.time)) return nudge('Pick a date and time');
    }
    if (state.doc === 'any') state.docAny = true;
    state.step = Math.max(0, Math.min(3, s)); render();
  }
  function nudge(msg) { Shop.toast(msg, 'clock'); body.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 }); }
  back.onclick = () => go(state.step - 1);
  next.onclick = () => state.step < 3 ? go(state.step + 1) : confirm();

  function confirm() {
    const f = $('[data-wform]'); keepForm();
    let ok = true;
    $$('[required]', f).forEach(i => { const bad = !i.value.trim() || (i.name === 'phone' && i.value.replace(/\D/g, '').length < 10); i.closest('.fld').classList.toggle('is-bad', bad); if (bad) ok = false; });
    if (!ok) return Shop.toast('Please add the patient\'s name and phone', 'x');
    const d = deptOf(state.dept), doc = state.doc === 'any' ? null : docFor(), day = days[state.day];
    const when = `${DAY[day.getDay()]} ${day.getDate()} ${MON[day.getMonth()]}, ${state.time}`;
    const who = doc ? doc.name : 'First available doctor';
    const ref = 'MH-A' + Math.floor(10000 + Math.random() * 89999);
    const done = paid => showSlip({ ref, d, who, when, day, paid, name: state.form.name, cover: state.form.cover });
    if (state.pay === 'online') {
      Shop.pay({
        title: 'Consultation fee', prefix: 'MH-A',
        lines: [{ name: `${d.name} consultation`, sub: `${who} · ${when}`, price: d.fee, qty: 1, img: d.img }],
        successTitle: 'Appointment booked and paid', successText: 'We\'ve sent the details to your phone. Arrive 15 minutes early and skip the payment queue.',
        metaLabel: 'Appointment', metaValue: when,
        timeline: [{ icon: 'checkcircle', title: 'Booked and paid', text: when }, { icon: 'phone', title: 'Reminder', text: 'We\'ll text you the day before' }, { icon: 'hospital', title: 'Check in', text: 'Go straight to the ' + d.name + ' desk' }],
        onSuccess: o => setTimeout(() => done(o.no), 50),
      });
    } else done(null);
  }

  function showSlip(b) {
    body.classList.remove('is-in');
    body.innerHTML = `<div class="slip">
      <div class="shop-done-badge"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
      <h3>You're booked, ${esc(b.name.split(' ')[0])}</h3>
      <p class="muted">A confirmation has been sent to your phone.</p>
      <div class="slip-card">
        <div class="slip-top"><span class="dept-ic"><svg class="ic"><use href="#i-${b.d.icon}"/></svg></span><div><b>${esc(b.d.name)}</b><small>${esc(b.who)}</small></div></div>
        <div class="slip-grid"><div><small>When</small><b>${esc(b.when)}</b></div><div><small>Reference</small><b class="mono-t">${b.ref}</b></div><div><small>Payment</small><b>${b.paid ? 'Paid online' : b.cover !== 'Self-pay' ? esc(b.cover) : 'Pay at the desk'}</b></div><div><small>Location</small><b>21 Okigwe Rd, Owerri</b></div></div>
      </div>
      <div class="slip-actions"><button class="btn btn-primary" data-slip-ics><svg class="ic"><use href="#i-calendar"/></svg>Add to calendar</button><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/2348138582078?text=${encodeURIComponent(`Hello Mercy Hill, confirming appointment ${b.ref}: ${b.d.name}, ${b.when}.`)}"><svg class="ic"><use href="#i-whatsapp"/></svg>WhatsApp</a><button class="btn btn-ghost" data-slip-new>Book another</button></div>
    </div>`;
    $('.wiz-foot').hidden = true;
    $$('[data-steps] li').forEach(li => { li.classList.remove('is-on'); li.classList.add('is-done'); });
    bar.style.width = '100%';
    requestAnimationFrame(() => body.classList.add('is-in'));
    $('[data-slip-new]').onclick = () => { Object.assign(state, { step: 0, dept: null, doc: null, day: null, time: null, form: null, pay: 'online' }); $('.wiz-foot').hidden = false; render(); };
    $('[data-slip-ics]').onclick = () => {
      let [hm, ap] = [b.when.split(', ').pop().slice(0, -2), b.when.slice(-2)];
      let [hh, mm] = hm.split(':').map(Number); if (ap === 'pm' && hh < 12) hh += 12;
      const st = new Date(b.day); st.setHours(hh, mm || 0, 0); const en = new Date(st.getTime() + 3600e3);
      const z = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MercyHill//EN', 'BEGIN:VEVENT', `UID:${b.ref}@mercyhill`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(st)}`, `DTEND:${z(en)}`, `SUMMARY:${b.d.name} appointment — Mercy Hill`, 'LOCATION:21 Okigwe Road\\, Owerri', `DESCRIPTION:Reference ${b.ref}. Arrive 15 minutes early.`, 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Hospital appointment', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `mercyhill-${b.ref}.ics`; a.click();
      Shop.toast('Calendar invite downloaded', 'calendar');
    };
  }
  render();

  /* ---------- doctors ---------- */
  const filt = $('[data-doc-filter]'), dg = $('[data-docs]');
  const fdepts = [['all', 'All'], ...[...new Set(doctors.map(x => x.dept))].map(id => [id, deptOf(id).name.split(' ')[0]])];
  filt.innerHTML = fdepts.map(([k, l], i) => `<button data-f="${k}" class="${i === 0 ? 'is-on' : ''}">${esc(l)}</button>`).join('');
  const renderDocs = f => {
    dg.innerHTML = doctors.filter(x => f === 'all' || x.dept === f).map(x => `
      <article class="doc" data-r>
        <div class="doc-top"><span class="mono mono-lg" style="--h:${x.hue}">${initials(x.name)}</span><span class="doc-avail"><i></i>${x.days.includes(new Date().getDay()) ? 'In today' : 'Next: ' + DAY[x.days.find(n => n > new Date().getDay()) ?? x.days[0]]}</span></div>
        <h3>${esc(x.name)}</h3><p class="doc-role">${esc(x.role)}</p>
        <ul class="doc-meta"><li><svg class="ic"><use href="#i-award"/></svg>${x.yrs} years' experience</li><li><svg class="ic"><use href="#i-calendar"/></svg>${x.days.map(n => DAY[n]).join(' · ')}</li><li><svg class="ic"><use href="#i-users"/></svg>${esc(x.langs)}</li></ul>
        <button class="btn btn-ghost btn-block" data-book-doc="${x.id}">Book with ${esc(x.name.split(' ').slice(0, 2).join(' '))}</button>
      </article>`).join('');
    reveal(dg);
  };
  filt.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; $$('[data-f]', filt).forEach(x => x.classList.toggle('is-on', x === b)); renderDocs(b.dataset.f); });
  dg.addEventListener('click', e => {
    const b = e.target.closest('[data-book-doc]'); if (!b) return;
    const doc = doctors.find(x => x.id === b.dataset.bookDoc);
    Object.assign(state, { dept: doc.dept, doc: doc.id, day: null, time: null, step: 2 }); $('.wiz-foot').hidden = false; render();
    $('#book').scrollIntoView({ behavior: 'smooth' });
  });
  renderDocs('all');

  /* ---------- packages ---------- */
  const pkgs = [
    { id: 'basic', name: 'Essential Check', price: 25000, for: 'Adults under 40', items: ['Doctor consultation', 'Blood pressure & BMI', 'Full blood count', 'Blood sugar (fasting)', 'Malaria & urine test'] },
    { id: 'exec', name: 'Executive Check', price: 85000, star: true, for: 'Adults 40+ and busy professionals', items: ['Everything in Essential', 'ECG & heart risk review', 'Cholesterol & kidney panel', 'Liver function test', 'Chest X-ray', 'Eye & dental screen'] },
    { id: 'women', name: 'Women\'s Wellness', price: 60000, for: 'Women of all ages', items: ['Doctor consultation', 'Breast examination', 'Pelvic ultrasound', 'Pap smear', 'Hormone panel', 'Full blood count'] },
  ];
  $('[data-pkgs]').innerHTML = pkgs.map(p => `
    <article class="pkg ${p.star ? 'is-star' : ''}" data-r>
      ${p.star ? '<span class="pkg-badge">Most booked</span>' : ''}
      <h3>${esc(p.name)}</h3><p class="pkg-for">${esc(p.for)}</p>
      <p class="pkg-price">${fmt(p.price)}</p>
      <ul>${p.items.map(i => `<li><svg class="ic"><use href="#i-check"/></svg>${esc(i)}</li>`).join('')}</ul>
      <button class="btn ${p.star ? 'btn-primary' : 'btn-ghost'} btn-block" data-pkg="${p.id}">Book &amp; pay</button>
    </article>`).join('');
  $('[data-pkgs]').addEventListener('click', e => {
    const b = e.target.closest('[data-pkg]'); if (!b) return;
    const p = pkgs.find(x => x.id === b.dataset.pkg);
    Shop.pay({
      title: 'Health check', prefix: 'MH-HC',
      lines: [{ name: p.name, sub: p.items.length + ' tests · walk in any weekday, 7–10am', price: p.price, qty: 1, img: 'img/lab.jpg' }],
      successTitle: 'Your health check is booked', successText: 'Come in any weekday between 7am and 10am. Please fast for 8 hours before your visit.',
      metaLabel: 'Package', metaValue: p.name,
      timeline: [{ icon: 'receipt', title: 'Payment received', text: 'Valid for 60 days' }, { icon: 'flask', title: 'Visit the lab', text: 'Fast for 8 hours, then walk in' }, { icon: 'stethoscope', title: 'Review with a doctor', text: 'Same day, in person or by phone' }],
    });
  });

  /* ---------- lab results lookup ---------- */
  $('[data-results]').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, out = $('[data-res-out]');
    let ok = true;
    $$('[required]', f).forEach(i => { const bad = !i.value.trim() || (i.name === 'phone' && i.value.replace(/\D/g, '').length < 10); i.closest('.fld').classList.toggle('is-bad', bad); if (bad) ok = false; });
    if (!ok) return;
    out.innerHTML = '<div class="shop-spinner"></div>';
    setTimeout(() => {
      const code = f.code.value.trim().toUpperCase(), digits = code.replace(/\D/g, '');
      const ready = digits && +digits.slice(-1) % 3 !== 0;
      out.innerHTML = ready
        ? `<div class="res-card ok"><svg class="ic"><use href="#i-checkcircle"/></svg><div><b>Results ready — ${esc(code)}</b><span>Full blood count, malaria parasite test. Reviewed by Dr. Tolu Adeyemi.</span><button type="button" class="btn btn-mint btn-sm" data-res-dl><svg class="ic"><use href="#i-download"/></svg>Download (demo)</button></div></div>`
        : `<div class="res-card wait"><svg class="ic"><use href="#i-clock"/></svg><div><b>Still processing — ${esc(code || 'your test')}</b><span>Expected by 4pm today. We'll text you the moment it's ready.</span></div></div>`;
      const dl = $('[data-res-dl]', out); if (dl) dl.onclick = () => Shop.toast('In the real site this downloads your PDF report', 'download');
    }, 1200);
  });
})();
