// The architecture animation at the top of the page, with chapters.
//
// The video is the printed figure animated on its own pixels, rendered by anim/make_arch_anim.py. This
// script puts it on the page, prints the caption of whichever chapter is running, and turns the row of
// chapter buttons into seek controls. The video loops, pauses when it scrolls out of view, and a click
// pauses or resumes it. Under prefers-reduced-motion it holds its poster instead of playing.
//
// window.FIGWALK = { src, poster, width, height, alt, steps: [{ title, text, t }] }

(function () {
  const F = window.FIGWALK;
  const host = document.getElementById('figwalk');
  if (!F || !host) return;

  const frame = document.createElement('div');
  frame.className = 'fw-frame';
  const video = document.createElement('video');
  video.className = 'fw-video';
  video.src = F.src;
  video.poster = F.poster;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', F.alt || 'Architecture animation');
  frame.appendChild(video);
  host.appendChild(frame);

  const rail = document.createElement('div');
  rail.className = 'fw-rail';
  const buttons = F.steps.map((s, i) => {
    const b = document.createElement('button');
    b.className = 'fw-step';
    b.type = 'button';
    b.innerHTML = '<span class="fw-num">' + (i + 1) + '</span>' + s.title;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      video.currentTime = s.t + 0.01;
      const p = video.play();
      if (p) p.catch(() => {});
      host.classList.remove('is-paused');
      mark(i);
    });
    rail.appendChild(b);
    return b;
  });
  host.appendChild(rail);

  const caption = document.createElement('figcaption');
  caption.className = 'fw-caption';
  const capTitle = document.createElement('strong');
  const capText = document.createElement('span');
  caption.appendChild(capTitle);
  caption.appendChild(capText);
  host.appendChild(caption);

  let cur = -1;
  function mark(i) {
    if (i === cur) return;
    cur = i;
    buttons.forEach((b, k) => b.classList.toggle('is-active', k === i));
    capTitle.textContent = F.steps[i].title + '. ';
    capText.textContent = F.steps[i].text;
  }
  function stepAt(t) {
    let i = 0;
    for (let k = 0; k < F.steps.length; k++) if (t >= F.steps[k].t) i = k;
    return i;
  }
  mark(0);
  video.addEventListener('timeupdate', () => mark(stepAt(video.currentTime)));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduce;
  if (reduce) host.classList.add('is-paused');
  host.addEventListener('click', (e) => {
    if (e.target.closest('.fw-step')) return;
    paused = !paused;
    host.classList.toggle('is-paused', paused);
    if (paused) video.pause();
    else { const p = video.play(); if (p) p.catch(() => {}); }
  });
  new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting && !paused) { const p = video.play(); if (p) p.catch(() => {}); }
      else video.pause();
    });
  }, { threshold: 0.2 }).observe(host);

  window.__figwalk = { goTo: function (i) { video.currentTime = F.steps[i].t + 0.01; mark(i); }, steps: F.steps.length, video: video };
})();
