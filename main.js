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
    { d: 'MONDAY', dt: '7/13', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:64, x:36 }, { p:'o', n:'Morgan', top:2, h:90, x:66 }] },
    { d: 'TUESDAY', dt: '7/14', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:90, x:36 }, { p:'r', n:'Casey', top:2, h:44, x:66 }] },
    { d: 'WEDNESDAY', dt: '7/15', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'o', n:'Morgan', top:2, h:90, x:54 }] },
    { d: 'THURSDAY', dt: '7/16', range: '3:00 PM – 8:00 PM', axis: ['3','4','5','6','7','8'],
      blocks: [{ p:'b', n:'Sam', top:2, h:90, x:4 }, { p:'g', n:'Jordan', top:2, h:90, x:36 }] },
    { d: 'SATURDAY', dt: '7/18', range: '10:00 AM – 2:00 PM', axis: ['10','11','12','1','2'],
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

  /* day columns for the story's schedule window */
  function colsHTML() {
    return SCHED.map((c) => `
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
  }

  function schedHTML() {
    const cols = colsHTML();
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
      <div class="window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">app.usecale.com</span></div>
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
          <div class="cal-gutter">${["3 PM", "4 PM", "5 PM", "6 PM", "7 PM"].map((t) => `<span>${t}</span>`).join("")}</div>
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
  /* hero animations report here so the guided tour never starts scrolling mid-animation */
  const heroAnim = { flights: 0, until: performance.now() + 3400 };   /* entrance runs ~3.3s */
  const heroBusy = () => heroAnim.flights > 0 || performance.now() < heroAnim.until;
  const holdHero = (ms) => { heroAnim.until = Math.max(heroAnim.until, performance.now() + ms); };

  /* ---------------- hero collage: three interactive cards ----------------
     01 form → 02 schedule → 03 group chat share one schedule model. Submitting the form
     flies Sam's availability into the schedule; Copy to Clipboard flies the current hours
     into the chat. Focus (hover / tap / keyboard) straightens a card, brings it forward
     and dims the others; leaving is debounced and never happens mid-drag or mid-select. */
  (() => {
    const stage = $('#heroStage');
    if (!stage) return;
    const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const app = $('#heroApp'), form = $('#heroForm'), chat = $('#heroChat');
    const cards = { app, form, chat };
    const colsEl = $('#heroCols');
    const linesEl = $('#hcLines'), sumEl = $('#hcSum');
    const bubble = $('.hs-bubble', chat);
    const phoneMQ = matchMedia('(max-width: 620px)');
    const isPhone = () => phoneMQ.matches;
    const HINTS = {
      form: 'Tick days, set times, then submit.',
      app: 'Drag a shift, or drag its top or bottom edge.',
      chat: 'Tap a name to see their shifts.',
    };
    let order = ['form', 'app', 'chat'];   /* most recently focused first (the phone deck) */

    /* same formatting helpers as Cale-App (utils.js) */
    const clock = (m) => { const h = Math.floor(m / 60), mm = m % 60, dh = h % 12 || 12; return mm ? `${dh}:${String(mm).padStart(2, '0')}` : String(dh); };
    const label = (m) => { const h = Math.floor(m / 60), mm = m % 60, dh = h % 12 || 12; return `${dh}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
    const cap = (w) => w.charAt(0) + w.slice(1).toLowerCase();
    const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

    /* ----- schedule model (minutes since midnight), seeded from the story's data ----- */
    const SPAN = [[900, 1200], [900, 1200], [900, 1200], [900, 1200], [600, 840]];
    const DEFAULT = [
      [['Sam', 900, 1200], ['Jordan', 900, 1080], ['Morgan', 900, 1200]],
      [['Sam', 900, 1200], ['Jordan', 900, 1200], ['Casey', 900, 1020]],
      [['Sam', 900, 1200], ['Morgan', 900, 1200]],
      [['Sam', 900, 1200], ['Jordan', 900, 1200]],
      [['Jordan', 600, 840], ['Sam', 720, 840], ['Morgan', 720, 840]],
    ];
    let samAvail = null;   /* last availability submitted through the form */
    let model = [];
    function buildModel() {
      model = SCHED.map((c, i) => ({
        name: cap(c.d), d: c.d, dt: c.dt, range: c.range, axis: c.axis,
        s0: SPAN[i][0], e0: SPAN[i][1],
        shifts: DEFAULT[i].map(([n, s, e], k) => ({ n, s, e, p: c.blocks[k].p, x: c.blocks[k].x, gone: false })),
      }));
      if (samAvail) applyAvail(samAvail);
    }
    function applyAvail(av) {
      av.forEach((a, di) => {
        const sh = model[di].shifts.find((x) => x.n === 'Sam');
        if (!sh) return;
        sh.gone = !a.on;
        if (a.on) { sh.s = a.s; sh.e = a.e; }
      });
    }
    const pct = (d, m) => ((m - d.s0) / (d.e0 - d.s0)) * 100;

    function render() {
      let n = 0;
      colsEl.innerHTML = model.map((d, di) => {
        const hours = (d.e0 - d.s0) / 60;
        const lines = Array.from({ length: hours - 1 }, (_, h) => `<div class="gridline" style="top:${((h + 1) / hours) * 100}%"></div>`).join('');
        return `
        <div class="col">
          <div class="col-head">${d.d} <span>${d.dt}</span></div>
          <div class="col-range">${d.range}</div>
          <div class="col-grid">
            <div class="axis">${d.axis.map((a) => `<span>${a}</span>`).join('')}</div>
            <div class="lane">${lines}${d.shifts.map((sh, k) => `
              <div class="blk ${sh.p}${sh.gone ? ' gone' : ''}" data-d="${di}" data-k="${k}"
                style="left:${sh.x}%;top:${pct(d, sh.s)}%;height:${pct(d, sh.e) - pct(d, sh.s)}%;--i:${n++}">
                <span>${sh.n}</span><i class="blk-time">${clock(sh.s)}–${clock(sh.e)}</i>
              </div>`).join('')}
            </div>
          </div>
        </div>`;
      }).join('');
    }
    function updateBlocks() {
      $$('.blk', colsEl).forEach((el) => {
        const d = model[+el.dataset.d], sh = d.shifts[+el.dataset.k];
        el.style.top = `${pct(d, sh.s)}%`;
        el.style.height = `${pct(d, sh.e) - pct(d, sh.s)}%`;
        el.classList.toggle('gone', sh.gone);
        $('.blk-time', el).textContent = `${clock(sh.s)}–${clock(sh.e)}`;
      });
    }
    /* the exact clipboard format Cale-App produces (buildClipboardText) */
    function hoursText() {
      return model.map((d) => {
        const vis = d.shifts.filter((s) => !s.gone);
        if (!vis.length) return '';
        return `Hours for ${d.name} (${d.dt}):\n${vis.map((s) => `${s.n}: ${clock(s.s)}-${clock(s.e)}`).join('\n')}\n`;
      }).filter(Boolean).join('\n');
    }
    function renderLines() {
      const out = [];
      model.forEach((d) => {
        const vis = d.shifts.filter((s) => !s.gone);
        if (!vis.length) return;
        out.push(`<span class="ln-h">Hours for ${d.name} (${d.dt}):</span>`);
        vis.forEach((s) => out.push(`<span class="ln" data-n="${s.n}" data-h="${(s.e - s.s) / 60}">${s.n}: ${clock(s.s)}-${clock(s.e)}</span>`));
      });
      linesEl.innerHTML = out.join('');
      highlight(null);
    }

    /* ----- focus management ----- */
    let focus = null, leaveTimer = 0, drag = null, selectOpen = false;
    let ptr = { x: -1e4, y: -1e4 };
    /* "still on the card" means inside its box plus a margin. A focused card straightens,
       scales and slides, so a strict :hover test would drop focus when the card moves out
       from under a cursor that entered near its edge, and it would flicker back and forth. */
    const near = (el, pad = 28) => {
      const r = el.getBoundingClientRect();
      return ptr.x >= r.left - pad && ptr.x <= r.right + pad && ptr.y >= r.top - pad && ptr.y <= r.bottom + pad;
    };
    function setFocus(k) {
      clearTimeout(leaveTimer);
      if (!k && isPhone()) return;   /* the phone deck always has a card on top */
      if (focus === k) return;
      focus = k;
      if (k) stage.dataset.focus = k; else delete stage.dataset.focus;
      Object.entries(cards).forEach(([name, el]) => el.classList.toggle('is-focus', name === k));
      if (k !== 'chat') { closeTray(); pinned = null; highlight(null); }
      if (k) order = [k, ...order.filter((x) => x !== k)];
      order.forEach((name, i) => { cards[name].dataset.depth = i; });
      $$('.hs-steps button', stage).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.go === k)));
      $('#hsHint').textContent = k ? HINTS[k] : '';
      holdHero(600);
      fitPhone();
    }
    /* phones: scale the scheduler to the screen and size the stage to the top card */
    function fitPhone() {
      if (!isPhone()) {
        app.style.zoom = '';
        app.style.removeProperty('--z');
        stage.style.height = '';
        return;
      }
      const z = stage.clientWidth / 600;
      app.style.zoom = String(z);
      app.style.setProperty('--z', String(z));
      const top = cards[focus || 'form'];
      requestAnimationFrame(() => {
        const r = top.getBoundingClientRect();
        const sc = new DOMMatrix(getComputedStyle(top).transform).a || 1;
        stage.style.height = `${140 + r.height / sc + 12}px`;
      });
    }
    const ro = new ResizeObserver(() => fitPhone());
    Object.values(cards).forEach((el) => ro.observe(el));
    addEventListener('resize', fitPhone);
    phoneMQ.addEventListener('change', () => { if (isPhone() && !focus) setFocus('form'); else if (!isPhone()) { setFocus(null); fitPhone(); } });
    stage.addEventListener('click', (e) => {
      const b = e.target.closest('.hs-steps button');
      if (b) setFocus(b.dataset.go);
    });
    /* phones: a tap on a card that's behind only brings it forward; it must not also press
       whatever control happened to be under the finger */
    let tappedBehind = false;
    stage.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.hs-card');
      tappedBehind = !!(isPhone() && card && !card.classList.contains('is-focus'));
    }, true);
    stage.addEventListener('click', (e) => {
      if (tappedBehind) { e.preventDefault(); e.stopPropagation(); tappedBehind = false; }
    }, true);
    function maybeLeave() {
      clearTimeout(leaveTimer);
      if (isPhone()) return;
      leaveTimer = setTimeout(() => {
        const el = focus && cards[focus];
        if (!el || drag || selectOpen) return;
        if (near(el)) return;
        const ae = document.activeElement;
        if (el.contains(ae) && ae.matches(':focus-visible')) return;
        setFocus(null);
      }, 180);
    }
    Object.entries(cards).forEach(([name, el]) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag) setFocus(name); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') maybeLeave(); });
      el.addEventListener('pointerdown', () => setFocus(name));
      el.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) setFocus(name); });
    });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.hs-card')) setFocus(null); });
    document.addEventListener('pointermove', (e) => {
      ptr = { x: e.clientX, y: e.clientY };
      if (focus && e.pointerType === 'mouse' && !near(cards[focus])) maybeLeave();
    }, { passive: true });
    stage.addEventListener('focusout', (e) => { if (!stage.contains(e.relatedTarget)) maybeLeave(); });

    /* ----- flights + impact shimmer ----- */
    const flightPath = $('#hsFlightPath');
    const PLANE = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M2.5 11.2 21 3.5l-5.6 17.2-4.1-6.6-8.8-2.9z" fill="#fff" stroke="#0d7bff" stroke-width="1.6" stroke-linejoin="round"/><path d="M11.3 14.1 21 3.5" stroke="#0d7bff" stroke-width="1.4" stroke-linecap="round"/></svg>';
    const toStage = (x, y) => { const r = stage.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const centerOf = (el) => { const r = el.getBoundingClientRect(); return toStage(r.left + r.width / 2, r.top + r.height / 2); };
    /* Flight timing works like a vehicle's speed plan. Each point on the path gets a
       speed limit from how sharply it bends (the loop and turns are slow), then the speed
       can only rise or fall at a capped rate: a forward pass limits acceleration and a
       backward pass makes it start braking early enough for the next turn. A final pass
       rounds off the ramps, so the plane never jumps from one speed to another. */
    function flightTimeline(len) {
      const step = 2, n = Math.max(2, Math.ceil(len / step)), ds = len / n;
      const ang = [];
      for (let i = 0; i <= n; i++) {
        const l = i * ds;
        const a = flightPath.getPointAtLength(Math.max(0, l - 1)), b = flightPath.getPointAtLength(Math.min(len, l + 1));
        ang.push(Math.atan2(b.y - a.y, b.x - a.x));
      }
      const curv = ang.map((_, i) => {
        if (i === 0) return 0;
        let d = Math.abs(ang[i] - ang[i - 1]);
        if (d > Math.PI) d = 2 * Math.PI - d;
        return d / ds;
      });
      const avg = (arr, w) => arr.map((_, i) => {
        let sum = 0, c = 0;
        for (let j = Math.max(0, i - w); j <= Math.min(n, i + w); j++) { sum += arr[j]; c++; }
        return sum / c;
      });
      const V = 0.75, K = 85, A = 0.0011;   /* top speed px/ms · how hard turns brake · max accel px/ms² */
      const v = avg(curv, 10).map((c) => V / (1 + K * c));
      v[0] = 0.16;      /* launch speed */
      v[n] = 0.2;       /* touchdown speed */
      for (let i = 1; i <= n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * A * ds));
      for (let i = n - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * A * ds));
      const vs = avg(v, 15);
      const ls = [0], ts = [0];
      for (let i = 1; i <= n; i++) {
        ls.push(i * ds);
        ts.push(ts[i - 1] + ds / ((vs[i - 1] + vs[i]) / 2));
      }
      return { ls, ts, total: ts[n] };
    }
    function fly(d, onLand) {
      if (!motionOK) { onLand(); return; }
      flightPath.setAttribute('d', d);
      const len = flightPath.getTotalLength();
      const tl = flightTimeline(len);
      heroAnim.flights++;
      const plane = document.createElement('div');
      plane.className = 'hs-plane';
      plane.innerHTML = PLANE;
      stage.appendChild(plane);
      const t0 = performance.now();
      let frame = 0, k = 0;
      requestAnimationFrame(function tick(now) {
        const el = Math.min(tl.total, now - t0);
        while (k < tl.ts.length - 2 && tl.ts[k + 1] < el) k++;
        const f = (el - tl.ts[k]) / (tl.ts[k + 1] - tl.ts[k] || 1);
        const l = tl.ls[k] + (tl.ls[k + 1] - tl.ls[k]) * Math.min(1, f);
        const p = flightPath.getPointAtLength(l);
        const a = flightPath.getPointAtLength(Math.max(0, l - 1.5)), b = flightPath.getPointAtLength(Math.min(len, l + 1.5));
        /* the icon's nose points up-right (-45°), so offset the heading by 45° */
        const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 45;
        plane.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${ang}deg)`;
        if (frame++ % 3 === 0) {
          const dot = document.createElement('span');
          dot.className = 'hs-trail';
          dot.style.setProperty('--at', `translate(${p.x}px, ${p.y}px)`);
          stage.appendChild(dot);
          setTimeout(() => dot.remove(), 750);
        }
        if (el < tl.total) requestAnimationFrame(tick);
        else { plane.remove(); heroAnim.flights--; holdHero(1500); onLand(); }
      });
    }
    /* Impact: the hit card comes out of its dimmed state, thumps, glows from the edges and
       sends a ring and a spark burst out from exactly where the plane landed. */
    function impact(card, host, pt) {
      clearTimeout(card._hitT);
      retrigger(card, 'hs-hit');
      card._hitT = setTimeout(() => card.classList.remove('hs-hit'), 1400);
      const shine = $('.hs-shine', host);
      retrigger(shine, 'hs-glow');
      if (!motionOK) return;
      const r = shine.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const z = r.width / shine.offsetWidth || 1;   /* account for CSS zoom on phones */
      const lx = (pt.x + sr.left - r.left) / z, ly = (pt.y + sr.top - r.top) / z;
      ['hs-ripple', 'hs-ring', 'hs-ring late'].forEach((cls) => {
        const el = document.createElement('span');
        el.className = cls;
        el.style.left = `${lx}px`;
        el.style.top = `${ly}px`;
        shine.appendChild(el);
        setTimeout(() => el.remove(), 1400);
      });
      for (let i = 0; i < 18; i++) {
        const sp = document.createElement('span');
        const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.35, dist = 46 + Math.random() * 46;
        sp.className = 'hs-spark';
        sp.style.left = `${pt.x}px`;
        sp.style.top = `${pt.y}px`;
        sp.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
        sp.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
        sp.style.background = i % 3 ? '#9f8fff' : '#0d7bff';
        stage.appendChild(sp);
        setTimeout(() => sp.remove(), 800);
      }
    }

    /* ----- 01: the availability form ----- */
    const FORM_DAYS = [0, 1, 2];
    const avail = [{ on: true, s: 900, e: 1200 }, { on: true, s: 900, e: 1200 }, { on: false, s: 900, e: 1200 }];
    const opts = (from, to, sel) => {
      let o = '';
      for (let m = from; m <= to; m += 30) o += `<option value="${m}"${m === sel ? ' selected' : ''}>${label(m)}</option>`;
      return o;
    };
    function renderForm() {
      $('#hfDays').innerHTML = FORM_DAYS.map((di, i) => {
        const a = avail[i], [s0, e0] = SPAN[di], nm = cap(SCHED[di].d);
        const tab = a.on ? '' : ' tabindex="-1"';
        return `
          <div class="hs-day${a.on ? ' on' : ''}" data-i="${i}">
            <label class="hs-day-top"><input type="checkbox" data-act="day"${a.on ? ' checked' : ''} /> ${nm}</label>
            <div class="hs-times"><div class="hs-times-inner">
              <select data-act="start" aria-label="${nm} start time"${tab}>${opts(s0, e0 - 30, a.s)}</select>
              <span class="to">–</span>
              <select data-act="end" aria-label="${nm} end time"${tab}>${opts(s0 + 30, e0, a.e)}</select>
            </div></div>
          </div>`;
      }).join('');
      syncAll();
    }
    function syncAll() {
      const all = $('#hfAll'), on = avail.filter((a) => a.on).length;
      all.checked = on === avail.length;
      all.indeterminate = on > 0 && on < avail.length;
    }
    function setDay(i, on) {
      avail[i].on = on;
      const row = $(`.hs-day[data-i="${i}"]`, form);
      row.classList.toggle('on', on);
      $('[data-act="day"]', row).checked = on;
      $$('select', row).forEach((s) => (on ? s.removeAttribute('tabindex') : s.setAttribute('tabindex', '-1')));
    }
    form.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'hfAll') { avail.forEach((_, i) => setDay(i, t.checked)); syncAll(); return; }
      const row = t.closest('.hs-day');
      if (!row) return;
      const i = +row.dataset.i, a = avail[i];
      if (t.dataset.act === 'day') { setDay(i, t.checked); syncAll(); $('#hfMsg').textContent = ''; return; }
      const sSel = $('[data-act="start"]', row), eSel = $('[data-act="end"]', row);
      a.s = +sSel.value; a.e = +eSel.value;
      if (a.s >= a.e) {   /* keep the range valid, like the real form */
        if (t === sSel) { a.e = a.s + 30; eSel.value = a.e; } else { a.s = a.e - 30; sSel.value = a.s; }
      }
      selectOpen = false;
      maybeLeave();
    });
    form.addEventListener('pointerdown', (e) => { if (e.target.tagName === 'SELECT') selectOpen = true; });
    form.addEventListener('focusout', (e) => { if (e.target.tagName === 'SELECT') { selectOpen = false; maybeLeave(); } });
    form.addEventListener('keydown', (e) => { if (e.key === 'Escape') selectOpen = false; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = $('#hfMsg'), btn = $('#hfSubmit');
      if (!avail.some((a) => a.on)) { msg.textContent = 'Select at least one day.'; retrigger(form, 'shake'); return; }
      msg.textContent = '';
      btn.textContent = 'Submitted ✓';
      retrigger(btn, 'sent');
      retrigger(form, 'popped');
      const snapshot = avail.map((a) => ({ ...a }));
      setTimeout(() => {
        /* out of the form, a lap to the left, a loop, then into 02 */
        const S = centerOf(btn);
        const sr = stage.getBoundingClientRect(), fr = form.getBoundingClientRect(), ar = app.getBoundingClientRect();
        const T = isPhone()
          ? toStage(ar.left + ar.width * 0.62, ar.top + 10)
          : toStage(Math.min(fr.right + 80, ar.right - 80), ar.top + ar.height * 0.45);
        const r = 30;
        const C = { x: Math.max(S.x - 125, -sr.left + r + 16), y: Math.max(S.y - 210, r + 8) };
        const path = `M${S.x},${S.y} C${S.x - 30},${S.y - 70} ${C.x + r + 14},${C.y + 70} ${C.x + r},${C.y}`
          + ` A${r},${r} 0 1 0 ${C.x - r},${C.y} A${r},${r} 0 1 0 ${C.x + r},${C.y}`
          + ` C${C.x + r},${C.y - 90} ${T.x - 130},${T.y - 120} ${T.x},${T.y}`;
        fly(path, () => {
          impact(app, app, T);
          const before = model.map((d) => d.shifts.map((x) => `${x.s}-${x.e}-${x.gone}`));
          samAvail = snapshot;
          applyAvail(snapshot);
          updateBlocks();
          if (isPhone()) setTimeout(() => setFocus('app'), 450);
          /* outline the shifts that just changed, so you can see what the form did */
          $$('.blk', colsEl).forEach((el) => {
            const d = +el.dataset.d, k = +el.dataset.k, sh = model[d].shifts[k];
            if (before[d][k] !== `${sh.s}-${sh.e}-${sh.gone}` && !sh.gone) {
              /* on phones, scroll that day into view inside 02 */
              if (isPhone()) el.closest('.col').scrollIntoView({ block: 'nearest', inline: 'nearest' });
              el.classList.add('changed');
              setTimeout(() => {
                el.classList.add('fade-out');
                el.classList.remove('changed');
                setTimeout(() => el.classList.remove('fade-out'), 950);
              }, 1300);
            }
          });
        });
      }, 260);
      setTimeout(() => { btn.classList.remove('sent'); btn.textContent = 'Submit Availability'; }, 2800);
    });

    /* ----- 02: drag shifts, resize from their edges, regenerate, copy ----- */
    colsEl.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.blk');
      if (!el || e.button > 0) return;
      if (isPhone() && !app.classList.contains('is-focus')) return;   /* behind in the deck: the tap just brings it forward */
      const d = model[+el.dataset.d], sh = d.shifts[+el.dataset.k];
      const r = el.getBoundingClientRect(), lane = el.parentElement.getBoundingClientRect();
      const y = e.clientY - r.top, edge = Math.min(9, r.height / 4);
      drag = {
        el, d, sh, y0: e.clientY, s0: sh.s, e0: sh.e,
        mode: y < edge ? 'top' : y > r.height - edge ? 'bottom' : 'move',
        px: lane.height / ((d.e0 - d.s0) / 30),
      };
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      setFocus('app');
      e.preventDefault();
    });
    colsEl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const { d, sh, s0, e0, mode } = drag;
      const delta = Math.round((e.clientY - drag.y0) / drag.px) * 30;
      if (mode === 'move') {
        const len = e0 - s0;
        sh.s = Math.min(Math.max(s0 + delta, d.s0), d.e0 - len);
        sh.e = sh.s + len;
      } else if (mode === 'top') {
        sh.s = Math.min(Math.max(s0 + delta, d.s0), sh.e - 30);
      } else {
        sh.e = Math.max(Math.min(e0 + delta, d.e0), sh.s + 30);
      }
      drag.el.style.top = `${pct(d, sh.s)}%`;
      drag.el.style.height = `${pct(d, sh.e) - pct(d, sh.s)}%`;
      $('.blk-time', drag.el).textContent = `${clock(sh.s)}–${clock(sh.e)}`;
    });
    const endDrag = () => {
      if (!drag) return;
      drag.el.classList.remove('dragging');
      drag = null;
      maybeLeave();
    };
    colsEl.addEventListener('pointerup', endDrag);
    colsEl.addEventListener('pointercancel', endDrag);

    $('#hsGen').addEventListener('click', (e) => {
      retrigger(e.currentTarget, 'pressed');
      buildModel();
      app.classList.add('regen');
      render();
      holdHero(1400);
    });

    const copyBtn = $('#hsCopy');
    let copyTimer = 0;
    copyBtn.addEventListener('click', () => {
      const text = hoursText();
      try { navigator.clipboard?.writeText(text).catch(() => {}); } catch (err) { /* clipboard is a bonus */ }
      clearTimeout(copyTimer);
      copyBtn.classList.add('copied');
      $('.hs-copy-label', copyBtn).textContent = 'Copied ✓';
      copyTimer = setTimeout(() => { copyBtn.classList.remove('copied'); $('.hs-copy-label', copyBtn).textContent = 'Copy to Clipboard'; }, 1800);
      /* a short hop up and over into 03; if 02 is in front, aim for the part of 03 that shows */
      const S = centerOf(copyBtn);
      const cr = chat.getBoundingClientRect(), ar = app.getBoundingClientRect();
      const behind = focus === 'app' && !isPhone();
      const x = behind ? Math.max(Math.min(cr.right - 40, ar.right + 50), cr.left + 40) : cr.left + cr.width * 0.55;
      const T = toStage(x, isPhone() ? cr.top + 10 : cr.top + 70);
      const path = `M${S.x},${S.y} C${S.x + 20},${S.y - 150} ${T.x + 70},${T.y - 190} ${T.x},${T.y}`;
      fly(path, () => {
        if (behind) retrigger(chat, 'peek');
        impact(chat, bubble, T);
        renderLines();
        retrigger(linesEl, 'fresh');
        if (isPhone()) setTimeout(() => setFocus('chat'), 450);
        $$('.hs-react.staff', chat).forEach((el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
        $('#hcReacts').classList.add('again');
      });
    });

    /* ----- 03: find someone's shifts, react to the post ----- */
    let pinned = null;
    function highlight(n) {
      linesEl.classList.toggle('hl', !!n);
      let count = 0, hours = 0;
      $$('.ln', linesEl).forEach((l) => {
        const m = l.dataset.n === n;
        l.classList.toggle('match', m);
        if (m) { count++; hours += +l.dataset.h; }
      });
      sumEl.textContent = n ? `${n}: ${count} shift${count === 1 ? '' : 's'} · ${hours}h this week` : '';
      sumEl.classList.toggle('on', !!n);
    }
    linesEl.addEventListener('pointerover', (e) => { const ln = e.target.closest('.ln'); if (ln && !pinned) highlight(ln.dataset.n); });
    linesEl.addEventListener('pointerleave', () => { if (!pinned) highlight(null); });
    linesEl.addEventListener('click', (e) => {
      const ln = e.target.closest('.ln');
      if (!ln) return;
      pinned = pinned === ln.dataset.n ? null : ln.dataset.n;
      highlight(pinned);
    });

    const tray = $('#hcTray'), addBtn = $('#hcAdd');
    function closeTray() { tray.classList.remove('open'); addBtn.setAttribute('aria-expanded', 'false'); }
    addBtn.addEventListener('click', () => {
      const open = !tray.classList.contains('open');
      tray.classList.toggle('open', open);
      addBtn.setAttribute('aria-expanded', String(open));
    });
    tray.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-e]');
      if (!b) return;
      let mine = $('.hs-react.mine', chat);
      if (!mine) {
        mine = document.createElement('button');
        mine.type = 'button';
        mine.className = 'hs-react mine';
        mine.setAttribute('aria-label', 'Remove your reaction');
        addBtn.parentElement.before(mine);
      } else {
        mine.style.animation = 'none'; void mine.offsetWidth; mine.style.animation = '';
      }
      mine.textContent = `${b.dataset.e} You`;
      closeTray();
    });
    chat.addEventListener('click', (e) => { const m = e.target.closest('.hs-react.mine'); if (m) m.remove(); });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.hs-react-add')) closeTray(); });
    chat.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTray(); });

    buildModel();
    render();
    renderLines();
    renderForm();
    order.forEach((name, i) => { cards[name].dataset.depth = i; });
    if (isPhone()) setFocus('form');
    fitPhone();
  })();
  buildForms($('#formsLayer'));
  const { sides, pops } = buildBubbles($('#chaosLayer'), $('#genBtn'));
  buildPeople($('#people'));

  /* ---------------- shared UI (works with or without GSAP) ---------------- */
  let stopTour = () => {};   /* the auto-scroll IIFE fills this in; a nav click parks the tour */
  const nav = $('#nav');
  const progressBar = $('.progress');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.setProperty('--p', `${max > 0 ? (scrollY / max) * 100 : 0}%`);
  }, { passive: true });

  const navToggle = $('#navToggle');
  const setMenu = (open) => {
    $('#navLinks').classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  };
  navToggle.addEventListener('click', () => setMenu(!$('#navLinks').classList.contains('open')));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* smooth in-page anchor scrolling via GSAP ScrollToPlugin. A deliberate jump can't fight the
     tour, so we park the tour first. Falls back to a native jump without GSAP or under reduced-motion.
     Scrubbed sections still fast-forward as they pass under the scroll — that's expected, not a lock;
     the user keeps full control (autoKill stops the tween the moment they scroll themselves). */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;                       /* ignore a bare "#" */
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    stopTour();
    setMenu(false);
    const reducedM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canSmooth = !reducedM && typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined';
    const rawY = Math.max(0, target.getBoundingClientRect().top + scrollY);
    /* #top starts at 0; #access lands flush inside the dark section (no top gap — the chevron
       is only meant for the Under-the-hood view); everything else clears the floating nav */
    const destY = id === '#top' ? 0 : id === '#access' ? rawY + 25 : Math.max(0, rawY - 84);
    if (canSmooth) {
      const dur = Math.min(1.2, Math.max(0.45, Math.abs(destY - scrollY) / 12000));
      gsap.to(window, { duration: dur, ease: 'power2.inOut', scrollTo: { y: destY, autoKill: true } });
    } else {
      scrollTo(0, destY);
    }
  });

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

  /* email field: border glow that tracks the cursor (pointer devices only) */
  (() => {
    const field = $('.email-field');
    if (!field || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    field.addEventListener('mousemove', (e) => {
      const r = field.getBoundingClientRect();
      field.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      field.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      field.style.setProperty('--glow', '1');
    });
    field.addEventListener('mouseleave', () => field.style.setProperty('--glow', '0'));
  })();

  /* ---------------- auto-scroll guided tour ---------------- */
  (() => {
    const btn = $('#autoToggle');
    if (!btn) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      btn.style.display = 'none';
      const ht = $('#heroTour'); if (ht) ht.hidden = true;
      return;
    }

    const SPEED = 380;                 /* px per second — watchable but not sluggish */
    let autoOn = false, paused = false, raf = null, lastT = 0, expectedY = -1, resumeTimer = null;
    let ended = false, toBottom = false;
    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const isLanding = () => scrollY < innerHeight * 0.6;   /* still on the hero */
    /* the tour drives the scrubbed animation and hands off where the reading starts:
       the top of "Under the hood". Past that it's prose and a form — not ours to scroll. */
    const tourEnd = () => {
      const el = document.getElementById('extras');
      if (!el) return maxScroll();
      return Math.min(el.getBoundingClientRect().top + scrollY, maxScroll());
    };

    const render = () => {
      btn.classList.toggle('playing', autoOn);
      btn.setAttribute('aria-label', autoOn ? 'Pause guided tour' : 'Play guided tour');
    };
    function step(t) {
      if (!autoOn) return;
      if (!lastT) lastT = t;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      /* the limit is re-read every frame, so a late layout refresh can't move the stop point */
      const limit = toBottom ? maxScroll() : tourEnd();
      const next = Math.min(scrollY + SPEED * dt, limit);
      scrollTo(0, next);
      expectedY = Math.round(next);
      if (next >= limit - 1) { ended = true; stop(); return; }   /* done — hand back control */
      raf = requestAnimationFrame(step);
    }
    function start(explicit = false) {
      if (autoOn || paused) return;
      clearTimeout(resumeTimer);
      /* past the story's end: an explicit Play means "take me down"; an automatic resume
         (after the reader touched or scrolled) must never carry them past "Under the hood" */
      if (!explicit && heroBusy()) { resumeTimer = setTimeout(() => start(), 700); return; }
      const pastEnd = scrollY >= tourEnd() - 2;
      if (pastEnd && !explicit) { ended = true; render(); return; }
      toBottom = pastEnd;
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
      /* once the tour has finished, it stays finished — it must never grab the page back
         while the reader is working through the cards. Only an explicit Play restarts it. */
      if (paused || ended) return;
      resumeTimer = setTimeout(start, isLanding() ? 7000 : 2000);
    }
    function userTakeover() {
      if (autoOn) stop();
      scheduleResume();
    }
    /* a deliberate nav click parks the tour (button returns to Play); it won't auto-resume */
    stopTour = () => { clearTimeout(resumeTimer); if (autoOn) stop(); paused = true; };

    /* user intent = real input; auto-scroll's own scrollTo never fires these */
    addEventListener('wheel', userTakeover, { passive: true });
    /* playing with the hero cards is reading too: don't scroll the page out from under it */
    const heroStage = $('#heroStage');
    if (heroStage) ['pointermove', 'pointerdown', 'focusin', 'input'].forEach((ev) => heroStage.addEventListener(ev, userTakeover, { passive: true }));
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
      else { paused = false; ended = false; clearTimeout(resumeTimer); start(true); }
    });

    /* hero "Watch how it works" starts the same tour */
    const heroTour = $('#heroTour');
    if (heroTour) heroTour.addEventListener('click', () => { if (!autoOn) btn.click(); });

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
  if (typeof ScrollToPlugin !== 'undefined') gsap.registerPlugin(ScrollToPlugin);

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
    /* a brighter dashed pulse that streams DOWN line A — gives the line real, perceptible
       motion (a plain vertical line translating vertically reads as static otherwise) */
    const stemPulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stemPulse.setAttribute('class', 'a-stem-down-pulse');
    stemPulse.setAttribute('vector-effect', 'non-scaling-stroke');
    stemPulse.setAttribute('fill', 'none');
    gsap.set(stemPulse, { opacity: 0 });
    stemDownSvg.appendChild(stemPulse);
    /* continuous flow, independent of scroll, so the line stays alive even while it's still */
    gsap.to(stemPulse, { strokeDashoffset: -37, duration: 0.85, ease: 'none', repeat: -1 });
    function layoutStemDown() {
      const pr = stagePin.getBoundingClientRect();
      const sr = schedWin.getBoundingClientRect();
      const W = pr.width, H = pr.height;
      const cx = (sr.left + sr.right) / 2 - pr.left;
      const startY = (sr.top - pr.top) + sr.height * 0.5; /* start mid-schedule so it sits under it */
      stemDownSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      /* draw well past the bottom so the line fills the whole screen (and exits the bottom
         edge) after it travels up — no blank gap where it hands off to line B */
      stemDown.setAttribute('d', `M${cx},${startY} L${cx},${H * 2.0}`);
      stemPulse.setAttribute('d', `M${cx},${startY} L${cx},${H * 2.0}`);
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
        end: '+=8590',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const p = self.progress;
          stage.classList.toggle('vibrate', p > 0.098 && p < 0.272);
          ring.classList.toggle('on', p > 0.916);
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

    /* …and gets "clicked" — the downstroke bottoms out at ~30.0 */
    tl.to(genBtn, { scale: 0.86, ease: 'power2.in', duration: 0.8 }, 29.4)
      .to(genBtn, { scale: 1.08, ease: 'back.out(2)', duration: 0.6 }, 30.2)
      .to(genBtn, { opacity: 0, scale: 0.4, ease: 'power2.in', duration: 1.2 }, 30.9);

    /* beat 4 — the press ITSELF dispels the pile: the scatter fires on the downstroke (29.6),
       fast, so it reads as "pressing blew the texts away" — not a later, separate transition */
    sides.forEach((el, i) => {
      tl.to(el, { x: el._start.x * 1.06, y: el._start.y, rotation: el._start.r, opacity: 0, ease: 'power3.in', duration: 1, stagger: 0 }, 29.6 + i * 0.02);
    });
    tl.to(pops, { opacity: 0, scale: 0.5, ease: 'power2.in', duration: 0.9, stagger: 0.03 }, 29.6);

    /* beat 5 — a beat passes, THEN the 2×4 availability forms are revealed underneath, filling out */
    tl.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 2, stagger: 0.3 }, 34.3);
    cards.forEach((card, f) => {
      $$('.day-row.fills', card).forEach((row, r) => {
        const at = 36.8 + f * 1.5 + r * 1.3;
        const box = $('.box', row);
        tl.to(row, { backgroundColor: '#EFF5FF', borderColor: 'rgba(13,123,255,0.45)', duration: 0.9 }, at)
          .to(box, { backgroundColor: '#0D7BFF', borderColor: '#0D7BFF', duration: 0.9 }, at)
          .to($('.tick', row), { opacity: 1, scale: 1, ease: 'back.out(2)', duration: 0.8 }, at + 0.3)
          .to($('.times', row), { height: 20, opacity: 1, duration: 1 }, at + 0.4);
      });
    });

    /* glass description card over the forms */
    tl.to(descCard, { opacity: 1, y: 0, duration: 2.5 }, 43.3)
      .to(descCard, { opacity: 0, y: -20, ease: 'power1.in', duration: 2 }, 57.9);

    /* beat 6 — brief beat of fully-filled forms, then contents vanish fast */
    tl.to($$('.mini-form-inner'), { opacity: 0, duration: 1.6, stagger: 0.05, ease: 'power1.in' }, 57.8);

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
      }, 59.8 + i * 0.22);
    });
    tl.to(schedWin, { opacity: 1, duration: 2.5 }, 62.5);
    tl.to(cards, { opacity: 0, duration: 1.6 }, 64.1);

    /* ===== NEW ACT — the window opens as a booking CALENDAR, which Cale reads ===== */
    /* student bookings pop into the week */
    tl.to(calChips, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1.4, stagger: 0.16 }, 64.8);
    /* the "Cale reads your bookings" card stays up through the read */
    tl.to(descCard2, { opacity: 1, y: 0, duration: 2 }, 68.3)
      .to(descCard2, { opacity: 0, y: -20, ease: 'power1.in', duration: 1.8 }, 78.3);

    /* --- READ PHASE: bar sweeps top → bottom, lighting up each booking as it passes --- */
    tl.set(scanBar, { opacity: 1, top: '0%', scaleY: 1, filter: 'hue-rotate(0deg)' }, 69.8);
    tl.fromTo(scanBar, { top: '0%' }, { top: '97%', ease: 'none', duration: 11 }, 69.8);
    /* each chip hovers up and switches on a steady glow as the reading bar reaches it,
       and stays lit for the rest of the read (chips ordered by vertical position) */
    const chipsByY = [...calChips].sort(
      (a, b) => (parseFloat(a.style.top) || 0) - (parseFloat(b.style.top) || 0)
    );
    const nChipSpan = Math.max(1, chipsByY.length - 1);
    chipsByY.forEach((chip, i) => {
      const at = 70.3 + (i / nChipSpan) * 9;
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
    }, 80.8);
    tl.to(scanBar, { top: '0%', ease: 'power2.inOut', duration: 3 }, 82.3);
    tl.to(scanBar, { filter: 'hue-rotate(42deg)', ease: 'power1.inOut', duration: 3 }, 82.3);

    /* the schedule body sits (empty) behind the still-opaque calendar; its background is
       uncovered by the wipe, and its pieces POP in as the bar sweeps past their position */
    tl.set(schedBody, { opacity: 1 }, 84.9);

    /* --- BUILD PHASE: bar sweeps down FAST — a quick transition, not a slow reveal —
           wiping the calendar away in its wake; schedule pieces pop in as it passes --- */
    tl.fromTo(scanBar, { top: '0%' }, { top: '97%', ease: 'power2.inOut', duration: 4 }, 85.8);
    tl.fromTo(calBody,
      { clipPath: 'inset(0% 0% 0% 0%)' },
      { clipPath: 'inset(100% 0% 0% 0%)', ease: 'power2.inOut', duration: 4 }, 85.8);
    /* pieces pop in right as the bar clears their row */
    tl.to(schedTop, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1 }, 86.6);
    tl.to(hoursPanel, { opacity: 1, scale: 1, ease: 'back.out(1.7)', duration: 1 }, 88.9);
    tl.set(calBody, { opacity: 0 }, 89.9);
    tl.to(scanBar, { opacity: 0, duration: 0.8 }, 89.9);        /* day columns stay blank for now */

    /* beat 8 — days pop in left to right */
    cols.forEach((col, i) => {
      tl.to(col, { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.6)', duration: 1.6 }, 92.8 + i * 1.05);
    });

    /* beat 9 — worker blocks rise from the bottom of each day,
       first the most dramatic, each one after faster than the last */
    let t = 98.3;
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
    }, 98.3);

    /* beat 10 — the finished schedule pops, then the revolving glow takes over (via onUpdate class) */
    tl.to(schedWin, { scale: 1.035, ease: 'power1.inOut', duration: 1.4 }, 109.3)
      .to(schedWin, { scale: 1, ease: 'power1.inOut', duration: 1.4 }, 110.7);

    /* line A grows downward out of the schedule and the travel STARTS WHILE IT'S STILL DRAWING —
       overlapping (not sequencing) these keeps the momentum from the schedule pop rolling */
    layoutStemDown();
    tl.to(stemDownProg, { v: 1, ease: 'power2.out', duration: 2, onUpdate: applyStemDown }, 110.8);
    tl.to(stemPulse, { opacity: 1, ease: 'power1.out', duration: 1.5 }, 111.3);
    tl.to(stageTravel, { y: () => -innerHeight * 0.95, ease: 'power1.in', duration: 5.5 }, 112.3);

    /* one short beat before the pin releases — not a long dead hold */
    tl.to({}, { duration: Math.max(1.5, 119.3 - tl.duration()) });

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
    const stemProg = { v: 1 };   /* line B stem is PRE-DRAWN so it reads as one continuous line handed off from line A (no redraw) */
    const wrapProg = { v: 0 };
    const applyStem = () => { stem.style.strokeDashoffset = stemLen * (1 - stemProg.v); };
    const applyWrap = () => { wraps.forEach((p, i) => { p.style.strokeDashoffset = wrapLens[i] * (1 - wrapProg.v); }); };
    /* a pulse that flows down line B too, continuing the stream from line A into the message */
    const stemPulseB = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stemPulseB.setAttribute('class', 'a-stem-down-pulse');
    stemPulseB.setAttribute('vector-effect', 'non-scaling-stroke');
    stemPulseB.setAttribute('fill', 'none');
    gsap.set(stemPulseB, { opacity: 0 });
    svg.appendChild(stemPulseB);
    gsap.to(stemPulseB, { strokeDashoffset: -37, duration: 0.85, ease: 'none', repeat: -1 });

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
      stemPulseB.setAttribute('d', `M${cx},0 L${cx},${y}`);
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
        end: '+=1150',
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
      },
    });
    /* line B is already drawn (in layout) — the vertical line simply continues from Act 2.
       Its pulse fades in to keep the downward flow going, and the message appears right away. */
    lines.to(stemPulseB, { opacity: 1, ease: 'power1.out', duration: 1 }, 0);
    lines.to(msg, { opacity: 1, ease: 'power2.out', duration: 1.7 }, 0.3);
    /* the line splits and races around both sides of the bubble — starts while the message is
       still arriving (no dead gap), and eased rather than linear so it doesn't feel robotic */
    lines.to(wrapProg, { v: 1, ease: 'power1.inOut', duration: 3, onUpdate: applyWrap }, 2.2);
    lines.to(svg, { '--glow': 1, ease: 'power1.in', duration: 3 }, 2.2);

    const n = avatars.length;

    /* profiles pop in, left → right — they start WHILE the wrap is still closing, so the
       beats overlap instead of queueing up one after another */
    const AV_START = 4.6;
    avatars.forEach((a, i) => {
      lines.to(a, { opacity: 1, scale: 1, ease: 'back.out(1.8)', duration: 0.85 }, AV_START + i * 0.42);
    });

    /* thumbs-up wave, right → left: each profile rises as its thumb pops, then settles.
       Sam (leftmost) reacts last, and the pin releases just after. */
    const TH_START = 7;
    avatars.forEach((a, i) => {
      const order = n - 1 - i;           /* rightmost reacts first */
      const t = TH_START + order * 0.55;
      lines.to(a, { y: -16, ease: 'power2.out', duration: 0.45 }, t);
      lines.to(thumbs[i], { scale: 1, ease: 'back.out(2.6)', duration: 0.6 }, t + 0.1);
      lines.to(a, { y: 0, ease: 'power2.inOut', duration: 0.6 }, t + 0.5);
    });
    /* small settle so the pin doesn't release the instant Sam's thumb lands */
    lines.to({}, { duration: 1 });

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
    let lastW = innerWidth;
    addEventListener('resize', () => {
      /* Ignore height-only resizes (mobile keyboard show/hide): they'd fire a
         ScrollTrigger.refresh that re-clamps scroll and fights the focused input,
         creating a stutter loop that makes the form untypeable on phones. */
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      clearTimeout(rz);
      rz = setTimeout(relayout, 180);
    });

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
