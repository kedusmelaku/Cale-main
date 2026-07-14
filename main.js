/* ============================================================
   Cale — scrollytelling engine
   Vanilla JS + GSAP ScrollTrigger (no build step, no framework)
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- data (mirrors the real app mock) ---------------- */
  const SCHED = [
    { d: 'MON', dt: '7/13', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:64, x:36 }, { p:'o', n:'Morgan', top:2, h:90, x:66 }] },
    { d: 'TUE', dt: '7/14', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:90, x:36 }, { p:'r', n:'Casey', top:2, h:44, x:66 }] },
    { d: 'WED', dt: '7/15', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'o', n:'Morgan', top:2, h:90, x:54 }] },
    { d: 'THU', dt: '7/16', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:90, x:36 }] },
    { d: 'SAT', dt: '7/18', range: '10:00 AM – 2:00 PM', axis: ['10','11','12','1','2'],
      blocks: [{ p:'g', n:'Jordan', top:2, h:90, x:4 }, { p:'b', n:'Sam', top:42, h:52, x:36 }, { p:'o', n:'Morgan', top:42, h:36, x:66 }] },
  ];
  const HOURS = [
    { c: 'b', n: 'Sam',    v: 24   },
    { c: 'g', n: 'Jordan', v: 17   },
    { c: 'o', n: 'Morgan', v: 12.5 },
    { c: 'r', n: 'Casey',  v: 2.5  },
  ];
  const SIDE_MSGS = [
    'can you work thursday?', "wait, who's closing Friday?", 'resending the spreadsheet...',
    'I never got the schedule 😩', 'actually I can only do 4–8', 'is this the newest version??',
    'anyone free Saturday morning?', "I have a test tmrw, can't come", 'did you get my hours?',
    "the file won't open on my phone", 'can I swap with Jordan?', "I'm out next Tuesday",
    'wait, when do I work?', "who's on with me Monday?", 'I thought I was off??',
    'can we start at 4 instead?', 'my ride falls through at 6', "still waiting on Noah's hours",
    'check the group chat', 'schedule_v3_FINAL_final.xlsx ???', 'I sent mine last week...',
    'did Casey reply yet?', "I can cover if it's before 5", 'someone claim Saturday plz',
    'I only saw this now, sorry!!', 'screenshot it to me?',
    'we had 3 instructors for 2 kids??', '4pm was slammed, we needed one more',
    'why were we double staffed tuesday?',
  ];
  const POP_MSGS = ['??', 'hello??', 'bump', 'any update?', '@everyone', 'schedule??', '!!', 'pls respond', '😭', 'is it out yet?'];
  const STAFF = [
    { n: 'Sam',    rows: [['Mon', true, '3:00','8:00'], ['Tue', true, '3:00','8:00'], ['Thu', true, '3:00','8:00']] },
    { n: 'Priya',  rows: [['Mon', true, '4:00','8:00'], ['Wed', false], ['Sat', true, '10:00','2:00']] },
    { n: 'Diego',  rows: [['Tue', true, '3:00','7:00'], ['Thu', true, '3:00','8:00'], ['Sat', false]] },
    { n: 'Mia',    rows: [['Mon', false], ['Wed', true, '3:00','8:00'], ['Thu', true, '4:00','8:00']] },
    { n: 'Jordan', rows: [['Mon', true, '3:00','7:00'], ['Tue', true, '3:00','8:00'], ['Sat', true, '10:00','2:00']] },
    { n: 'Morgan', rows: [['Mon', true, '3:00','8:00'], ['Wed', true, '3:00','8:00'], ['Sat', true, '11:00','2:00']] },
    { n: 'Noah',   rows: [['Tue', false], ['Thu', true, '3:00','6:00'], ['Sat', true, '10:00','1:00']] },
    { n: 'Ava',    rows: [['Mon', true, '4:00','8:00'], ['Tue', true, '4:00','8:00'], ['Wed', false]] },
  ];
  const PEOPLE = ['Sam', 'Priya', 'Diego', 'Mia', 'Noah'];

  /* stage design coordinates (the stage is 1000 × 640 and scaled to fit) */
  const STAGE_W = 1000, STAGE_H = 640;
  const CARD_W = 226, CARD_H = 290, GAP_X = 22, GAP_Y = 18;

  /* ---------------- builders ---------------- */
  const fmtHours = (v) => (Number.isInteger(v) ? `${v}h` : `${v}h`);

  function schedHTML() {
    const cols = SCHED.map((c) => `
      <div class="col">
        <div class="col-head">${c.d} <span>${c.dt}</span></div>
        <div class="col-range">${c.range}</div>
        <div class="col-grid">
          <div class="axis">${c.axis.map((a) => `<span>${a}</span>`).join('')}</div>
          <div class="lane">
            ${[20, 40, 60, 80].map((t) => `<div class="gridline" style="top:${t}%"></div>`).join('')}
            ${c.blocks.map((b) => `<div class="blk ${b.p}" style="top:${b.top}%;height:${b.h}%;left:${b.x}%"><span>${b.n}</span></div>`).join('')}
          </div>
        </div>
      </div>`).join('');
    const hours = HOURS.map((h) => `
      <div class="hours-row">
        <span class="who"><span class="dot ${h.c}"></span>${h.n}</span>
        <span class="val" data-hours="${h.v}">${fmtHours(h.v)}</span>
      </div>`).join('');
    /* week-view booking calendar (GCal-style, no branding) shown before the schedule */
    const BOOKINGS = [
      [{ t: 6, h: 15, c: 1, l: '3:30' }, { t: 30, h: 13, c: 2, l: '4:30' }, { t: 58, h: 16, c: 1, l: '6:00' }],
      [{ t: 4, h: 13, c: 2, l: '3:00' }, { t: 22, h: 15, c: 1, l: '4:00' }, { t: 46, h: 13, c: 3, l: '5:30' }, { t: 70, h: 14, c: 1, l: '7:00' }],
      [{ t: 12, h: 15, c: 3, l: '3:30' }, { t: 52, h: 16, c: 1, l: '5:30' }],
      [{ t: 6, h: 13, c: 1, l: '3:00' }, { t: 34, h: 15, c: 2, l: '4:30' }, { t: 62, h: 13, c: 3, l: '6:30' }],
      [{ t: 8, h: 16, c: 2, l: '10:30' }, { t: 36, h: 14, c: 1, l: '11:30' }, { t: 64, h: 15, c: 3, l: '12:30' }],
    ];
    const calCols = SCHED.map((c, i) => `
      <div class="cal-col">
        <div class="cal-day">${c.d} <b>${c.dt.split('/')[1]}</b></div>
        <div class="cal-lane">
          ${[20, 40, 60, 80].map((t) => `<div class="gridline" style="top:${t}%"></div>`).join('')}
          ${BOOKINGS[i].map((b) => `<div class="cal-chip c${b.c}" style="top:${b.t}%;height:${b.h}%"><span>Session · ${b.l}</span></div>`).join('')}
        </div>
      </div>`).join('');
    return `
      <div class="window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">usecale.vercel.app</span></div>
      <div class="body-wrap">
        <div class="sched-body">
          <div class="sched-top">
            <div class="sched-top-left"><span class="sched-h">Schedule</span><span class="pill-connected">Connected</span></div>
            <div class="sched-top-right"><span class="mini-btn outline">Copy to Clipboard</span><span class="mini-btn blue">Generate Schedule</span></div>
          </div>
          <div class="cols">${cols}</div>
          <div class="hours-panel">
            <h4>Hours This Week</h4>
            ${hours}
          </div>
        </div>
        <div class="cal-body">
          <div class="cal-gutter">${['3 PM','4 PM','5 PM','6 PM','7 PM'].map((t) => `<span>${t}</span>`).join('')}</div>
          <div class="cal-cols">${calCols}</div>
        </div>
        <div class="scan-bar"></div>
      </div>`;
  }

  function buildForms(layer) {
    const gridW = 4 * CARD_W + 3 * GAP_X;
    const gridH = 2 * CARD_H + GAP_Y;
    const x0 = (STAGE_W - gridW) / 2;
    const y0 = (STAGE_H - gridH) / 2;
    STAFF.forEach((s, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const el = document.createElement('div');
      el.className = 'mini-form';
      el.style.left = `${x0 + col * (CARD_W + GAP_X)}px`;
      el.style.top = `${y0 + row * (CARD_H + GAP_Y)}px`;
      el.innerHTML = `
        <div class="mini-form-inner">
          <div class="hi">Hi ${s.n} 👋</div>
          <div class="week">Week of July 13, 2026</div>
          ${s.rows.map((r) => `
            <div class="day-row${r[1] ? ' fills' : ''}">
              <div class="day-line"><span class="box"><span class="tick">✓</span></span>${r[0]}</div>
              ${r[1] ? `<div class="times"><span class="time-chip">${r[2]} PM</span><span class="to">→</span><span class="time-chip">${r[3]} PM</span></div>` : ''}
            </div>`).join('')}
          <button class="mini-submit" type="button" tabindex="-1">Submit Availability</button>
        </div>`;
      layer.appendChild(el);
    });
  }

  function buildBubbles(layer, genBtn) {
    const sides = SIDE_MSGS.map((t, i) => {
      const el = document.createElement('div');
      el.className = 'bubble side';
      el.innerHTML = `<span class="bubble-inner">${t}</span>`;
      layer.insertBefore(el, genBtn);
      /* deterministic pseudo-random pile position */
      el._end = {
        x: ((i * 137) % 300) - 150,
        y: ((i * 71) % 230) - 115,
        r: ((i * 53) % 9) - 4,
      };
      el._start = {
        x: (i % 2 ? -1 : 1) * (STAGE_W / 2 + 260 + (i % 5) * 55),
        y: el._end.y + (((i * 31) % 3) - 1) * 46,
        r: (i % 2 ? -1 : 1) * (6 + (i % 4) * 3),
      };
      return el;
    });
    const pops = POP_MSGS.map((t, i) => {
      const el = document.createElement('div');
      el.className = 'bubble pop';
      el.innerHTML = `<span class="bubble-inner">${t}</span>`;
      layer.insertBefore(el, genBtn);
      el._end = {
        x: ((i * 197) % 240) - 120,
        y: ((i * 89) % 190) - 95,
        r: ((i * 41) % 10) - 5,
      };
      return el;
    });
    return { sides, pops };
  }

  function buildPeople(row) {
    PEOPLE.forEach((n) => {
      const el = document.createElement('div');
      el.className = 'person';
      el.innerHTML = `
        <div class="avatar">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
          </svg>
          <span class="thumb">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0l4.2-7.2a2 2 0 0 1 3.6 1.2L14 9h5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 20H7"/>
            </svg>
          </span>
        </div>
        <span class="name">${n}</span>`;
      row.appendChild(el);
    });
  }

  /* ---------------- render static DOM ---------------- */
  $('#storySched').innerHTML = schedHTML();
  buildForms($('#formsLayer'));
  const { sides, pops } = buildBubbles($('#chaosLayer'), $('#genBtn'));
  buildPeople($('#people'));

  /* ---------------- shared UI (works with or without GSAP) ---------------- */
  const nav = $('#nav');
  const progressBar = $('.progress');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.setProperty('--p', `${max > 0 ? (scrollY / max) * 100 : 0}%`);
  }, { passive: true });

  $('#navToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));

  /* reveal-on-scroll for the quiet sections */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.25 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* cursor-following glow in the dark CTA */
  const flow = $('.cta-flow');
  const glow = $('#cursorGlow');
  let gx = 0, gy = 0, tx = 0, ty = 0, glowRaf = null;
  flow.addEventListener('mousemove', (e) => {
    const r = flow.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (!glowRaf) glowLoop();
  });
  function glowLoop() {
    gx += (tx - gx) * 0.14;
    gy += (ty - gy) * 0.14;
    glow.style.left = `${gx}px`;
    glow.style.top = `${gy}px`;
    glowRaf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.4 ? requestAnimationFrame(glowLoop) : null;
  }

  /* Formspree submit */
  const form = $('#accessForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.email-submit');
    const errBox = $('#formError');
    errBox.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('bad status');
      form.hidden = true;
      errBox.hidden = true;
      $('#formSuccess').hidden = false;
    } catch {
      btn.disabled = false;
      btn.textContent = 'Try again';
      errBox.hidden = false;
    }
  });

  /* ---------------- auto-scroll guided tour ---------------- */
  (() => {
    const btn = $('#autoToggle');
    if (!btn) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { btn.style.display = 'none'; return; }

    const SPEED = 380;                 /* px per second — watchable but not sluggish */
    let autoOn = false, paused = false, raf = null, lastT = 0, expectedY = -1, resumeTimer = null;
    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const isLanding = () => scrollY < innerHeight * 0.6;   /* still on the hero */

    const render = () => {
      btn.classList.toggle('playing', autoOn);
      btn.setAttribute('aria-label', autoOn ? 'Pause guided tour' : 'Play guided tour');
    };
    function step(t) {
      if (!autoOn) return;
      if (!lastT) lastT = t;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      const next = Math.min(scrollY + SPEED * dt, maxScroll());
      scrollTo(0, next);
      expectedY = Math.round(next);
      if (next >= maxScroll() - 1) { stop(); return; }   /* reached the end */
      raf = requestAnimationFrame(step);
    }
    function start() {
      if (autoOn || paused) return;
      clearTimeout(resumeTimer);
      autoOn = true; lastT = 0;
      raf = requestAnimationFrame(step);
      render();
    }
    function stop() {
      autoOn = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null; lastT = 0;
      render();
    }
    function scheduleResume() {
      clearTimeout(resumeTimer);
      if (paused || scrollY >= maxScroll() - 2) return;   /* don't resume at the very bottom */
      resumeTimer = setTimeout(start, isLanding() ? 7000 : 2000);
    }
    function userTakeover() {
      if (autoOn) stop();
      scheduleResume();
    }

    /* user intent = real input; auto-scroll's own scrollTo never fires these */
    addEventListener('wheel', userTakeover, { passive: true });
    addEventListener('touchmove', userTakeover, { passive: true });
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(e.key)) userTakeover();
    });
    /* catch scrollbar drags / anything that moves scroll away from where we put it */
    addEventListener('scroll', () => {
      if (autoOn && expectedY >= 0 && Math.abs(scrollY - expectedY) > 12) userTakeover();
    }, { passive: true });

    btn.addEventListener('click', () => {
      if (autoOn) { paused = true; stop(); clearTimeout(resumeTimer); }
      else { paused = false; clearTimeout(resumeTimer); start(); }
    });

    render();
    resumeTimer = setTimeout(start, 7000);   /* the 7s-after-load rule */
  })();

  /* ---------------- animation setup ---------------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.body.classList.add('no-anim');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* fit the 1000×640 stage to any viewport */
  const stage = $('#stage');
  function fitStage() {
    const s = Math.min(1, (innerWidth - 20) / STAGE_W, (innerHeight - 90) / STAGE_H);
    stage.style.transform = `scale(${s})`;
  }
  fitStage();
  addEventListener('resize', fitStage);

  function init() {
    const schedWin = $('#storySched');
    const ring = $('#glowRing');
    const genBtn = $('#genBtn');
    const descCard = $('#descCard');
    const cards = $$('.mini-form');
    const cols = $$('.col', schedWin);
    const blocks = [];
    cols.forEach((c) => $$('.blk', c).forEach((b) => blocks.push(b)));
    const hourEls = $$('.val[data-hours]', schedWin);
    const descCard2 = $('#descCard2');
    const schedBody = $('.sched-body', schedWin);
    const schedTop = $('.sched-top', schedWin);
    const hoursPanel = $('.hours-panel', schedWin);
    const calBody = $('.cal-body', schedWin);
    const calCols = $$('.cal-col', schedWin);
    const calChips = $$('.cal-chip', schedWin);
    const calGutter = $('.cal-gutter', schedWin);
    const scanBar = $('.scan-bar', schedWin);

    /* line A — hangs from under the schedule down past the screen edge */
    const stagePin = $('#stagePin');
    const stageTravel = $('#stageTravel');
    const stemDownSvg = $('#stemDown');
    const stemDown = $('.a-stem-down', stemDownSvg);
    let stemDownLen = 0;
    const stemDownProg = { v: 0 };
    const applyStemDown = () => { stemDown.style.strokeDashoffset = stemDownLen * (1 - stemDownProg.v); };
    function layoutStemDown() {
      const pr = stagePin.getBoundingClientRect();
      const sr = schedWin.getBoundingClientRect();
      const W = pr.width, H = pr.height;
      const cx = (sr.left + sr.right) / 2 - pr.left;
      const startY = (sr.top - pr.top) + sr.height * 0.5; /* start mid-schedule so it sits under it */
      stemDownSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      /* draw well past the bottom so the line still fills the screen while it travels up */
      stemDown.setAttribute('d', `M${cx},${startY} L${cx},${H * 1.7}`);
      stemDownLen = stemDown.getTotalLength();
      stemDown.style.strokeDasharray = stemDownLen;
      applyStemDown();
    }

    /* size + place the glow ring to hug the schedule window */
    ring.style.left = `${schedWin.offsetLeft}px`;
    ring.style.top = `${schedWin.offsetTop}px`;
    ring.style.width = `${schedWin.offsetWidth}px`;
    ring.style.height = `${schedWin.offsetHeight}px`;

    /* merge targets: forms squash into the schedule window's rect */
    const T = { x: schedWin.offsetLeft, y: schedWin.offsetTop, w: schedWin.offsetWidth, h: schedWin.offsetHeight };
    const tcx = T.x + T.w / 2, tcy = T.y + T.h / 2;

    /* ---------- initial states ---------- */
    gsap.set(sides, { xPercent: -50, yPercent: -50, opacity: 0 });
    sides.forEach((el) => gsap.set(el, { x: el._start.x, y: el._start.y, rotation: el._start.r }));
    gsap.set(pops, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0 });
    pops.forEach((el) => gsap.set(el, { x: el._end.x, y: el._end.y, rotation: el._end.r }));
    gsap.set(genBtn, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
    gsap.set(descCard, { opacity: 0, y: 28 });
    gsap.set(descCard2, { opacity: 0, y: 28 });
    gsap.set(schedWin, { opacity: 0 });
    gsap.set(schedBody, { opacity: 0 });
    gsap.set(schedTop, { opacity: 0, scale: 0.92, transformOrigin: '50% 50%' });
    gsap.set(hoursPanel, { opacity: 0, scale: 0.92, transformOrigin: '50% 50%' });
    gsap.set(calBody, { opacity: 1, backgroundColor: '#FFFFFF', clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set(calChips, { opacity: 0, scale: 0.6, transformOrigin: '50% 0%' });
    gsap.set(scanBar, { opacity: 0, top: '0%', scaleX: 1 });
    gsap.set(cols, { opacity: 0, y: 14, scale: 0.95 });
    gsap.set(blocks, { scaleY: 0 });
    cards.forEach((card) => {
      gsap.set($$('.day-row.fills .tick', card), { opacity: 0, scale: 0.4 });
      gsap.set($$('.day-row.fills .times', card), { height: 0, opacity: 0 });
    });
    hourEls.forEach((el) => (el.textContent = '0h'));

    /* ---------- Act 2: the master pinned sequence ---------- */
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: '#stagePin',
        start: 'top top',
        end: '+=10080',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const p = self.progress;
          stage.classList.toggle('vibrate', p > 0.08 && p < 0.24);
          ring.classList.toggle('on', p > 0.80);
        },
      },
    });

    /* beat 1 — texts fly in from the sides and stack into a pile */
    sides.forEach((el, i) => {
      tl.to(el, { x: el._end.x, y: el._end.y, rotation: el._end.r, opacity: 1, duration: 3.2 }, i * 0.55);
    });

    /* beat 2 — more messages pop in directly on top of the pile */
    pops.forEach((el, i) => {
      tl.to(el, { scale: 1, opacity: 1, ease: 'back.out(2.2)', duration: 1.5 }, 15 + i * 0.9);
    });

    /* beat 3 — the Generate button appears… */
    tl.to(genBtn, { scale: 1, opacity: 1, ease: 'back.out(1.8)', duration: 2.2 }, 26);

    /* …and gets "clicked" */
    tl.to(genBtn, { scale: 0.86, ease: 'power2.in', duration: 0.8 }, 29.4)
      .to(genBtn, { scale: 1.05, ease: 'power2.out', duration: 0.7 }, 30.2)
      .to(genBtn, { scale: 1, duration: 0.6 }, 30.9);

    /* beat 4 — the click dispels the pile (completes before anything else happens) */
    sides.forEach((el, i) => {
      tl.to(el, { x: el._start.x * 1.06, y: el._start.y, rotation: el._start.r, opacity: 0, ease: 'power2.in', duration: 2.2 }, 32 + i * 0.06);
    });
    tl.to(pops, { opacity: 0, scale: 0.5, ease: 'power1.in', duration: 1.6, stagger: 0.06 }, 32);
    tl.to(genBtn, { opacity: 0, scale: 0.5, ease: 'power2.in', duration: 1.8 }, 33);

    /* beat 5 — a beat passes, THEN the 2×4 availability forms are revealed underneath, filling out */
    tl.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 2, stagger: 0.3 }, 37);
    cards.forEach((card, f) => {
      $$('.day-row.fills', card).forEach((row, r) => {
        const at = 39.5 + f * 1.5 + r * 1.3;
        const box = $('.box', row);
        tl.to(row, { backgroundColor: '#EFF5FF', borderColor: 'rgba(13,123,255,0.45)', duration: 0.9 }, at)
          .to(box, { backgroundColor: '#0D7BFF', borderColor: '#0D7BFF', duration: 0.9 }, at)
          .to($('.tick', row), { opacity: 1, scale: 1, ease: 'back.out(2)', duration: 0.8 }, at + 0.3)
          .to($('.times', row), { height: 20, opacity: 1, duration: 1 }, at + 0.4);
      });
    });

    /* glass description card over the forms */
    tl.to(descCard, { opacity: 1, y: 0, duration: 2.5 }, 46)
      .to(descCard, { opacity: 0, y: -20, ease: 'power1.in', duration: 2 }, 60.6);

    /* beat 6 — brief beat of fully-filled forms, then contents vanish fast */
    tl.to($$('.mini-form-inner'), { opacity: 0, duration: 1.6, stagger: 0.05, ease: 'power1.in' }, 60.5);

    /* beat 7 — the empty frames merge into the schedule window's frame */
    cards.forEach((card, i) => {
      const cw = card.offsetWidth, ch = card.offsetHeight;
      const cx = card.offsetLeft + cw / 2;
      const cy = card.offsetTop + ch / 2;
      tl.to(card, {
        x: tcx - cx, y: tcy - cy,
        scaleX: T.w / cw, scaleY: T.h / ch,
        borderRadius: 18,
        ease: 'power2.inOut',
        duration: 5,
      }, 62.5 + i * 0.22);
    });
    tl.to(schedWin, { opacity: 1, duration: 2.5 }, 65.2);
    tl.to(cards, { opacity: 0, duration: 1.6 }, 66.8);

    /* ===== NEW ACT — the window opens as a booking CALENDAR, which Cale reads ===== */
    /* student bookings pop into the week */
    tl.to(calChips, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1.4, stagger: 0.16 }, 67.5);
    /* the "Cale reads your bookings" card stays up through the read */
    tl.to(descCard2, { opacity: 1, y: 0, duration: 2 }, 71)
      .to(descCard2, { opacity: 0, y: -20, ease: 'power1.in', duration: 1.8 }, 81);

    /* --- READ PHASE: bar sweeps top → bottom, lighting up each booking as it passes --- */
    tl.set(scanBar, { opacity: 1, top: '0%', scaleY: 1, filter: 'hue-rotate(0deg)' }, 72.5);
    tl.fromTo(scanBar, { top: '0%' }, { top: '97%', ease: 'none', duration: 11 }, 72.5);
    /* each chip hovers up and switches on a steady glow as the reading bar reaches it,
       and stays lit for the rest of the read (chips ordered by vertical position) */
    const chipsByY = [...calChips].sort(
      (a, b) => (parseFloat(a.style.top) || 0) - (parseFloat(b.style.top) || 0)
    );
    const nChipSpan = Math.max(1, chipsByY.length - 1);
    chipsByY.forEach((chip, i) => {
      const at = 73 + (i / nChipSpan) * 9;
      tl.to(chip, {
        y: -5,
        filter: 'brightness(1.12)',
        boxShadow: '0 0 12px 1px rgba(13,123,255,0.5)',
        ease: 'power2.out',
        duration: 0.9,
      }, at);
    });

    /* --- TURNAROUND: bar holds at the bottom with a glow-swell (all chips now lit),
           then the bar rides back to the top, shifting blue → purple (reading → building) --- */
    tl.to(scanBar, {
      scaleY: 2.2,
      boxShadow: '0 0 26px 5px rgba(13,123,255,0.75), 0 0 60px 12px rgba(13,123,255,0.32)',
      duration: 0.75, yoyo: true, repeat: 1, ease: 'sine.inOut',
    }, 83.5);
    tl.to(scanBar, { top: '0%', ease: 'power2.inOut', duration: 3 }, 85);
    tl.to(scanBar, { filter: 'hue-rotate(42deg)', ease: 'power1.inOut', duration: 3 }, 85);

    /* the schedule body sits (empty) behind the still-opaque calendar; its background is
       uncovered by the wipe, and its pieces POP in as the bar sweeps past their position */
    tl.set(schedBody, { opacity: 1 }, 87.6);

    /* --- BUILD PHASE: bar sweeps down FAST — a quick transition, not a slow reveal —
           wiping the calendar away in its wake; schedule pieces pop in as it passes --- */
    tl.fromTo(scanBar, { top: '0%' }, { top: '97%', ease: 'power2.inOut', duration: 4 }, 88.5);
    tl.fromTo(calBody,
      { clipPath: 'inset(0% 0% 0% 0%)' },
      { clipPath: 'inset(100% 0% 0% 0%)', ease: 'power2.inOut', duration: 4 }, 88.5);
    /* pieces pop in right as the bar clears their row */
    tl.to(schedTop, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1 }, 89.3);
    tl.to(hoursPanel, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1 }, 91.6);
    tl.set(calBody, { opacity: 0 }, 92.6);
    tl.to(scanBar, { opacity: 0, duration: 0.8 }, 92.6);        /* day columns stay blank for now */

    /* beat 8 — days pop in left to right */
    cols.forEach((col, i) => {
      tl.to(col, { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.6)', duration: 1.6 }, 95.5 + i * 1.05);
    });

    /* beat 9 — worker blocks rise from the bottom of each day,
       first the most dramatic, each one after faster than the last */
    let t = 101;
    let dur = 3.2;
    blocks.forEach((b) => {
      tl.to(b, { scaleY: 1, ease: 'power3.out', duration: dur }, t);
      t += dur * 0.5;
      dur = Math.max(0.7, dur * 0.8);
    });

    /* hours scramble to their weekly totals alongside the blocks */
    const proxy = { p: 0 };
    tl.to(proxy, {
      p: 1,
      ease: 'none',
      duration: 10,
      onUpdate() {
        hourEls.forEach((el, i) => {
          const target = parseFloat(el.dataset.hours);
          if (proxy.p > 0.995) { el.textContent = fmtHours(target); return; }
          const noise = 0.5 + 0.5 * Math.sin(proxy.p * 46 + i * 9.3);
          const v = Math.round((target * proxy.p + noise * 26 * (1 - proxy.p)) * 2) / 2;
          el.textContent = fmtHours(v);
        });
      },
    }, 101);

    /* beat 10 — the finished schedule pops, then the revolving glow takes over (via onUpdate class) */
    tl.to(schedWin, { scale: 1.035, ease: 'power1.inOut', duration: 1.4 }, 112)
      .to(schedWin, { scale: 1, ease: 'power1.inOut', duration: 1.4 }, 113.4);

    /* line A grows downward out of the schedule, then the schedule + line travel
       upward together — so scrolling feels like descending the line toward the message */
    layoutStemDown();
    tl.to(stemDownProg, { v: 1, ease: 'none', duration: 4, onUpdate: applyStemDown }, 114);
    tl.to(stageTravel, { y: () => -innerHeight * 0.95, ease: 'none', duration: 11 }, 116);

    /* settle room so the glowing schedule holds before the pin releases */
    tl.to({}, { duration: Math.max(4, 140 - tl.duration()) });

    /* ---------- Act 3: line wraps the copied result, staff approve (pinned) ---------- */
    const svg = $('#approvalLines');
    const stem = $('.a-stem', svg);
    const wraps = $$('.a-wrap', svg);
    const pin = $('#approvalsPin');
    const bubble = $('#msgBubble');
    const msg = $('#resultMsg');
    const thumbs = $$('.thumb');
    const avatars = $$('.person');

    let stemLen = 0;
    const wrapLens = [];
    const stemProg = { v: 0 };
    const wrapProg = { v: 0 };
    const applyStem = () => { stem.style.strokeDashoffset = stemLen * (1 - stemProg.v); };
    const applyWrap = () => { wraps.forEach((p, i) => { p.style.strokeDashoffset = wrapLens[i] * (1 - wrapProg.v); }); };

    /* build the stem (from the top of the viewport) + two wrapping half-outlines around the bubble */
    function layoutApprovals() {
      const pr = pin.getBoundingClientRect();
      const br = bubble.getBoundingClientRect();
      const W = pr.width, H = pr.height;
      const x = br.left - pr.left, y = br.top - pr.top;
      const w = br.width, h = br.height;
      const cx = x + w / 2;
      const rTL = 20, rTR = 20, rBR = 20, rBL = 7; /* matches the bubble's border-radius */
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      /* stem: from the very top of the pinned viewport down to the top-center of the bubble
         (this is line B — it meets line A hanging from the schedule above) */
      stem.setAttribute('d', `M${cx},0 L${cx},${y}`);
      /* right half: top-center, clockwise around to bottom-center */
      $('.a-right', svg).setAttribute('d',
        `M${cx},${y} H${x + w - rTR} A${rTR},${rTR} 0 0 1 ${x + w},${y + rTR} V${y + h - rBR} A${rBR},${rBR} 0 0 1 ${x + w - rBR},${y + h} H${cx}`);
      /* left half: top-center, counter-clockwise around to bottom-center */
      $('.a-left', svg).setAttribute('d',
        `M${cx},${y} H${x + rTL} A${rTL},${rTL} 0 0 0 ${x},${y + rTL} V${y + h - rBL} A${rBL},${rBL} 0 0 0 ${x + rBL},${y + h} H${cx}`);
      /* dash each path to its own length so the draw traces smoothly */
      stemLen = stem.getTotalLength();
      stem.style.strokeDasharray = stemLen;
      wrapLens.length = 0;
      wraps.forEach((p) => { const L = p.getTotalLength(); wrapLens.push(L); p.style.strokeDasharray = L; });
      applyStem();
      applyWrap();
    }
    layoutApprovals();

    gsap.set(svg, { '--glow': 0 });
    gsap.set(msg, { opacity: 0 });
    gsap.set(avatars, { opacity: 0, scale: 0.4, y: 0 });
    gsap.set(thumbs, { scale: 0 });

    const lines = gsap.timeline({
      scrollTrigger: {
        trigger: '#approvalsPin',
        start: 'top top',
        end: '+=2000',
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
      },
    });
    /* stem draws down toward the message */
    lines.to(stemProg, { v: 1, ease: 'none', duration: 4, onUpdate: applyStem }, 0);
    /* the copied schedule fades in as the stem reaches it */
    lines.to(msg, { opacity: 1, ease: 'power2.out', duration: 2 }, 3);
    /* the line splits and traces both sides of the bubble, glow intensifying */
    lines.to(wrapProg, { v: 1, ease: 'none', duration: 5.5, onUpdate: applyWrap }, 4.4);
    lines.to(svg, { '--glow': 1, ease: 'power1.in', duration: 5.5 }, 4.4);

    const n = avatars.length;

    /* profiles pop in, left → right */
    const AV_START = 9.5;
    avatars.forEach((a, i) => {
      lines.to(a, { opacity: 1, scale: 1, ease: 'back.out(1.8)', duration: 1.1 }, AV_START + i * 0.6);
    });

    /* thumbs-up wave, right → left: each profile rises as its thumb pops, then settles.
       Sam (leftmost) reacts last, and the pin releases just after. */
    const TH_START = 14;
    avatars.forEach((a, i) => {
      const order = n - 1 - i;           /* rightmost reacts first */
      const t = TH_START + order * 0.9;
      lines.to(a, { y: -16, ease: 'power2.out', duration: 0.55 }, t);
      lines.to(thumbs[i], { scale: 1, ease: 'back.out(2.6)', duration: 0.7 }, t + 0.12);
      lines.to(a, { y: 0, ease: 'power2.inOut', duration: 0.7 }, t + 0.6);
    });
    /* small settle so the pin doesn't release the instant Sam's thumb lands */
    lines.to({}, { duration: 1.5 });

    ScrollTrigger.refresh();

    /* fonts/resize change the bubble height — re-measure everything and rebuild the wrap */
    const relayout = () => {
      ring.style.left = `${schedWin.offsetLeft}px`;
      ring.style.top = `${schedWin.offsetTop}px`;
      ring.style.width = `${schedWin.offsetWidth}px`;
      ring.style.height = `${schedWin.offsetHeight}px`;
      layoutStemDown();
      layoutApprovals();
      ScrollTrigger.refresh();
    };
    (document.fonts?.ready || Promise.resolve()).then(relayout);
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(relayout, 180); });

    /* ---------- Act 5: lock the CTA copy in the viewport as it centers ---------- */
    ScrollTrigger.create({
      trigger: '.cta-content',
      start: 'center center',
      end: '+=420',
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
    });
  }

  init();
})();
