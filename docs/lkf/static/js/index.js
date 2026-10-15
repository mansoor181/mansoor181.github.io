// LKF project page: copy BibTeX, reveal on scroll, animations that play only while visible, tabs, and the one-step demo of Figure 1.
function copyBibTeX() {
  const code = document.getElementById('bibtex-code');
  const btn = document.querySelector('.copy-bibtex-btn .copy-text');
  if (!code) return;
  const done = () => { if (btn) { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1600); } };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code.innerText).then(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = code.innerText; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } finally { document.body.removeChild(ta); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal sections as they scroll into view
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); revealer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  // scroll progress bar and scroll-to-top button
  const prog = document.getElementById('scrollProg');
  const topBtn = document.querySelector('.scroll-to-top');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100;
    if (prog) prog.style.width = pct + '%';
    if (topBtn) topBtn.classList.toggle('visible', h.scrollTop > 600);
  }, { passive: true });
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // the figure animations loop while on screen, pause off screen, and a click pauses or resumes them
  document.querySelectorAll('video.figure-video').forEach((v) => {
    v.dataset.userPaused = '0';
    v.addEventListener('click', () => {
      if (v.paused) { v.dataset.userPaused = '0'; v.play(); } else { v.dataset.userPaused = '1'; v.pause(); }
    });
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); v.dataset.userPaused = '1'; }
  });
  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && v.dataset.userPaused !== '1') { const p = v.play(); if (p) p.catch(() => {}); } else if (!e.isIntersecting) { v.pause(); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('video.figure-video').forEach((v) => player.observe(v));

  // tabs: a group of buttons [data-tabs=name] switches the panes [data-tab-pane=name]
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const name = group.getAttribute('data-tabs');
    const panes = document.querySelectorAll(`[data-tab-pane="${name}"]`);
    group.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.tab-btn').forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        panes.forEach((p) => { p.style.display = (p.getAttribute('data-tab') === btn.getAttribute('data-tab')) ? '' : 'none'; });
      });
    });
  });

  // the one-step demo of Figure 1: a factorized step draws the noun and the verb independently from .5/.5 marginals,
  // and an LKF step with M = 2 draws one latent k and lets that component fill both positions
  const demo = document.getElementById('demo');
  if (demo) {
    const NOUNS = ['dog', 'dogs'];
    const VERBS = ['barks', 'bark'];
    const AGREE = [true, false, false, true];      // outcome index = 2 * noun + verb: dog barks, dog bark, dogs barks, dogs bark
    const kernels = {
      fact: () => { const n = Math.random() < 0.5 ? 0 : 1; const v = Math.random() < 0.5 ? 0 : 1; return { o: 2 * n + v, how: 'noun and verb drawn independently' }; },
      lkf: () => { const k = Math.random() < 0.5 ? 1 : 2; return { o: k === 1 ? 0 : 3, how: `drew <span class="kchip">k = ${k}, ${k === 1 ? 'singular' : 'plural'}</span>` }; },
    };
    const counts = { fact: [0, 0, 0, 0], lkf: [0, 0, 0, 0] };
    const panel = (name) => demo.querySelector(`[data-kernel="${name}"]`);

    const render = (name, last, flip) => {
      const p = panel(name);
      const c = counts[name];
      const total = c.reduce((a, b) => a + b, 0);
      p.querySelectorAll('.bar-row').forEach((row, i) => {
        row.querySelector('.fill').style.width = total ? `${(100 * c[i]) / total}%` : '0';
        row.querySelector('.bar-count').textContent = c[i];
      });
      const agree = c[0] + c[3];
      p.querySelector('.demo-rate strong').textContent = total ? `${Math.round((100 * agree) / total)}% of ${total} draws` : 'no draws yet';
      const slots = p.querySelectorAll('.slot');
      if (last === null) {
        slots[0].innerHTML = '[Mask<sub>1</sub>]'; slots[1].innerHTML = '[Mask<sub>2</sub>]';
        slots.forEach((s) => s.classList.remove('is-good', 'is-bad', 'flip'));
        p.querySelector('.demo-how').innerHTML = '&nbsp;';
        return;
      }
      const n = last.o >> 1;
      const v = last.o & 1;
      slots[0].textContent = NOUNS[n]; slots[1].textContent = VERBS[v];
      slots.forEach((s) => {
        s.classList.remove('is-good', 'is-bad', 'flip');
        s.classList.add(AGREE[last.o] ? 'is-good' : 'is-bad');
        if (flip && !reduce) { void s.offsetWidth; s.classList.add('flip'); }
      });
      p.querySelector('.demo-how').innerHTML = last.how;
    };

    let timer = null;
    const draw = (n) => {
      if (timer) { clearInterval(timer); timer = null; }
      const once = () => {
        Object.keys(kernels).forEach((name) => { const r = kernels[name](); counts[name][r.o] += 1; kernels[name].last = r; });
      };
      if (n === 1 || reduce) {
        for (let j = 0; j < n; j++) once();
        Object.keys(kernels).forEach((name) => render(name, kernels[name].last, true));
        return;
      }
      let left = n;
      timer = setInterval(() => {
        const batch = Math.min(4, left);
        for (let j = 0; j < batch; j++) once();
        left -= batch;
        Object.keys(kernels).forEach((name) => render(name, kernels[name].last, false));
        if (left <= 0) { clearInterval(timer); timer = null; }
      }, 30);
    };
    demo.querySelectorAll('[data-draw]').forEach((b) => b.addEventListener('click', () => draw(parseInt(b.getAttribute('data-draw'), 10))));
    const reset = demo.querySelector('[data-reset]');
    if (reset) {
      reset.addEventListener('click', () => {
        if (timer) { clearInterval(timer); timer = null; }
        Object.keys(counts).forEach((name) => { counts[name] = [0, 0, 0, 0]; render(name, null, false); });
      });
    }
    Object.keys(counts).forEach((name) => render(name, null, false));
  }
});
