// Project page: copy BibTeX, reveal on scroll, play media only while visible, and switch tabbed panels.
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
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // tabs of the structure comparisons
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const name = group.getAttribute('data-tabs');
    const panes = document.querySelectorAll(`[data-tab-pane="${name}"]`);
    group.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        panes.forEach((p) => { p.hidden = p.getAttribute('data-tab') !== btn.getAttribute('data-tab'); });
        const v = document.querySelector(`[data-tab-pane="${name}"]:not([hidden]) video`);
        if (v && v.dataset.userPaused !== '1') { const pr = v.play(); if (pr) pr.catch(() => {}); }
      });
    });
  });

});
