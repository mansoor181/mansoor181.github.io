// A guided walkthrough of a printed architecture figure.
//
// The figure itself is the one from the paper, untouched. An svg overlay veils everything except the
// part under discussion, draws a frame around it, and a caption underneath names the step. The steps
// advance on their own and loop, the row of step buttons jumps to any of them, and a click on the
// figure pauses. The stages are given in percent of the figure's width and height by the page, so the
// same component serves any figure.
//
// window.FIGWALK = { src, width, height, alt, steps: [{ title, text, box: [x0, y0, x1, y1], tags? }] }

(function () {
  const F = window.FIGWALK;
  const host = document.getElementById('figwalk');
  if (!F || !host) return;
  const NS = 'http://www.w3.org/2000/svg';
  const W = F.width, H = F.height;
  const DWELL = F.dwell || 4.6;          // seconds per step
  const FADE = 0.55;                     // seconds of travel between two steps

  const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
  const ease = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // the box of a step in the figure's own pixels, with a little air around it
  function px(box, pad) {
    const p = pad === undefined ? 1.1 : pad;
    return {
      x: (box[0] - p) * W / 100, y: (box[1] - p) * H / 100,
      w: (box[2] - box[0] + 2 * p) * W / 100, h: (box[3] - box[1] + 2 * p) * H / 100,
    };
  }

  // ---------------------------------------------------------------- scaffold
  const frame = document.createElement('div');
  frame.className = 'fw-frame';
  host.appendChild(frame);
  const img = document.createElement('img');
  img.src = F.src;
  img.alt = F.alt || 'Architecture figure';
  img.className = 'fw-img';
  frame.appendChild(img);

  const svg = el('svg', { xmlns: NS, viewBox: '0 0 ' + W + ' ' + H, class: 'fw-overlay', 'aria-hidden': 'true' }, frame);
  const defs = el('defs', {}, svg);
  const mask = el('mask', { id: 'fw-mask', maskUnits: 'userSpaceOnUse' }, defs);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
  const hole = el('rect', { fill: '#000', rx: 14 }, mask);
  const veil = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0, mask: 'url(#fw-mask)' }, svg);
  const ring = el('rect', { fill: 'none', stroke: '#2C6E9B', 'stroke-width': 3.5, rx: 14, opacity: 0 }, svg);

  const caption = document.createElement('figcaption');
  caption.className = 'fw-caption';
  const capTitle = document.createElement('strong');
  const capText = document.createElement('span');
  caption.appendChild(capTitle);
  caption.appendChild(capText);

  const rail = document.createElement('div');
  rail.className = 'fw-rail';
  const buttons = F.steps.map((s, i) => {
    const b = document.createElement('button');
    b.className = 'fw-step';
    b.type = 'button';
    b.innerHTML = '<span class="fw-num">' + (i + 1) + '</span>' + s.title;
    b.addEventListener('click', () => { goTo(i, true); });
    rail.appendChild(b);
    return b;
  });
  host.appendChild(rail);
  host.appendChild(caption);

  // ---------------------------------------------------------------- state
  let cur = 0, prev = 0, t0 = performance.now(), raf = null, paused = false, started = false;

  function draw(now) {
    const dt = (now - t0) / 1000;
    const u = ease(dt / FADE);
    const a = px(F.steps[prev].box), b = px(F.steps[cur].box);
    const box = {
      x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u),
      w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u),
    };
    for (const n of [hole, ring]) {
      n.setAttribute('x', box.x.toFixed(1));
      n.setAttribute('y', box.y.toFixed(1));
      n.setAttribute('width', box.w.toFixed(1));
      n.setAttribute('height', box.h.toFixed(1));
    }
    const on = started ? Math.min(1, dt / 0.5) : 0;
    veil.setAttribute('opacity', (0.78 * on).toFixed(3));
    ring.setAttribute('opacity', (0.9 * on).toFixed(3));
    if (!paused && dt > DWELL) goTo((cur + 1) % F.steps.length, false);
    raf = requestAnimationFrame(draw);
  }

  function goTo(i, byUser) {
    prev = cur; cur = i; t0 = performance.now(); started = true;
    buttons.forEach((b, k) => b.classList.toggle('is-active', k === i));
    capTitle.textContent = F.steps[i].title + '. ';
    capText.textContent = F.steps[i].text;
    if (byUser) { paused = true; host.classList.add('is-paused'); }
    if (raf === null) draw(t0);   // keep the overlay correct even while the loop is not running
  }

  host.addEventListener('click', (e) => {
    if (e.target.closest('.fw-step')) return;
    paused = !paused;
    host.classList.toggle('is-paused', paused);
    if (!paused) t0 = performance.now();
  });

  goTo(0, false);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    paused = true;
    veil.setAttribute('opacity', 0);
    ring.setAttribute('opacity', 0);
  } else {
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && raf === null) { t0 = performance.now(); raf = requestAnimationFrame(draw); }
        else if (!e.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.2 }).observe(host);
  }
  window.__figwalk = { goTo: function (i) { goTo(i, true); }, steps: F.steps.length };
})();
