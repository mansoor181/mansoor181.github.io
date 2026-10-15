// The designs panel: what this method actually produced on the held-out test split.
//
// Three views, all built from the per-complex outputs the evaluation harness stored, with nothing
// redrawn by hand. The first places the designed loop on the antigen it is meant to bind, the second
// lines the designed sequences up against the deposited ones, and the third counts which amino acids
// each method reaches for across the whole split.
//
// window.CB_DESIGN holds the data, and window.CB_DESIGN_STYLE the label and colour of this page's method.

(function () {
  const D = window.CB_DESIGN, ST = window.CB_DESIGN_STYLE;
  if (!D || !ST) return;
  const NS = 'http://www.w3.org/2000/svg';
  const M = D.method;
  const C = {
    native: '#2FB3A6', method: ST.color, raad: '#7A8089', mean: '#C07820',
    antigen: '#9AB34A', epitope: '#E8A33D', heavy: '#8C8C8C', light: '#E0456B',
    rule: '#DFE2E6', ink: '#1B2433', gray: '#5F6368', navy: '#1F4A6B',
  };
  C[M] = ST.color;
  const NAME = { native: 'deposited', raad: 'RAAD', mean: 'MEAN', diffab: 'DiffAb' };
  NAME[M] = ST.label;
  const AA = 'ACDEFGHIKLMNPQRSTVWY'.split('');

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const htm = (tag, cls, parent, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    if (parent) parent.appendChild(n);
    return n;
  };
  const poly = (pts, close) => 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + (close ? 'Z' : '');

  // ---------------------------------------------------------------- 1: the loop on its antigen
  (function loopPanel() {
    const host = document.getElementById('design-loop');
    if (!host) return;
    const P = D.panel, W = 760, H = 460;
    const svg = el('svg', { xmlns: NS, viewBox: '0 0 ' + W + ' ' + H, class: 'dz-svg' }, host);
    const defs = el('defs', {}, svg);

    const box = P.bbox, pad = 26;
    const s = Math.min((W * 0.52 - 2 * pad) / (box[1][0] - box[0][0]), (H - 2 * pad) / (box[1][1] - box[0][1]));
    const cx = (box[0][0] + box[1][0]) / 2, cy = (box[0][1] + box[1][1]) / 2;
    const put = (p) => [W * 0.26 + (p[0] - cx) * s, H / 2 - (p[1] - cy) * s];
    const whole = el('g', {}, svg);
    el('path', { d: poly(P.chains.Ag.body[0].map(put), true), fill: C.antigen, 'fill-opacity': 0.2, stroke: C.antigen, 'stroke-width': 1.3, 'stroke-opacity': 0.75 }, whole);
    const clip = el('clipPath', { id: 'dz-ag' }, defs);
    el('path', { d: poly(P.chains.Ag.body[0].map(put), true) }, clip);
    el('path', { d: poly(P.epitope.body[0].map(put), true), fill: C.epitope, 'fill-opacity': 0.85, stroke: '#C07820', 'stroke-width': 1, 'clip-path': 'url(#dz-ag)' }, whole);
    ['H', 'L'].forEach((ch) => el('path', {
      d: poly(P.chains[ch].body[0].map(put), true), fill: ch === 'H' ? C.heavy : C.light,
      'fill-opacity': 0.14, stroke: ch === 'H' ? C.heavy : C.light, 'stroke-width': 1.2, 'stroke-opacity': 0.6,
    }, whole));
    ['Ag', 'H', 'L'].forEach((ch) => el('path', {
      d: poly(P.chains[ch].trace.map(put)), fill: 'none', stroke: ch === 'Ag' ? '#6f8438' : (ch === 'H' ? '#79797b' : C.light),
      'stroke-width': 0.9, 'stroke-opacity': 0.7, 'stroke-linejoin': 'round',
    }, whole));
    // the window the zoom shows: the deposited loop and every design, with a little air around them
    const all = [].concat.apply([], Object.keys(P.loops).map((k) => P.loops[k].xy));
    const pad2 = 4.5;
    let bx0 = Math.min.apply(null, all.map((p) => p[0])) - pad2, bx1 = Math.max.apply(null, all.map((p) => p[0])) + pad2;
    let by0 = Math.min.apply(null, all.map((p) => p[1])) - pad2, by1 = Math.max.apply(null, all.map((p) => p[1])) + pad2;
    const ZX = W * 0.53, ZW = W - ZX - 6, ZH = H - 12;
    // match the window to the panel's shape so nothing is cropped
    const aspect = ZW / ZH;
    let bw2 = bx1 - bx0, bh2 = by1 - by0;
    if (bw2 / bh2 < aspect) { const g = (bh2 * aspect - bw2) / 2; bx0 -= g; bx1 += g; }
    else { const g = (bw2 / aspect - bh2) / 2; by0 -= g; by1 += g; }
    const lc = [(bx0 + bx1) / 2, (by0 + by1) / 2];
    const wv = [put([bx0, by1]), put([bx1, by0])];
    el('rect', { x: wv[0][0], y: wv[0][1], width: wv[1][0] - wv[0][0], height: wv[1][1] - wv[0][1], rx: 4, fill: 'none', stroke: C.navy, 'stroke-width': 1.6, 'stroke-dasharray': '4 3', opacity: 0.8 }, whole);

    // the zoom itself
    el('rect', { x: ZX, y: 6, width: ZW, height: ZH, rx: 12, fill: '#fff', stroke: C.rule }, svg);
    const zclip = el('clipPath', { id: 'dz-zoom' }, defs);
    el('rect', { x: ZX, y: 6, width: ZW, height: ZH, rx: 12 }, zclip);
    const zg = el('g', { 'clip-path': 'url(#dz-zoom)' }, svg);
    const zs = ZW / (bx1 - bx0);
    const zput = (p) => [ZX + ZW / 2 + (p[0] - lc[0]) * zs, 6 + ZH / 2 - (p[1] - lc[1]) * zs];
    el('path', { d: poly(P.chains.Ag.body[0].map(zput), true), fill: C.antigen, 'fill-opacity': 0.18, stroke: C.antigen, 'stroke-width': 1.2, 'stroke-opacity': 0.6 }, zg);
    const zclip2 = el('clipPath', { id: 'dz-ag2' }, defs);
    el('path', { d: poly(P.chains.Ag.body[0].map(zput), true) }, zclip2);
    el('path', { d: poly(P.epitope.body[0].map(zput), true), fill: C.epitope, 'fill-opacity': 0.8, stroke: '#C07820', 'stroke-width': 1, 'clip-path': 'url(#dz-ag2)' }, zg);
    ['H', 'L'].forEach((ch) => el('path', {
      d: poly(P.chains[ch].body[0].map(zput), true), fill: ch === 'H' ? C.heavy : C.light,
      'fill-opacity': 0.12, stroke: ch === 'H' ? C.heavy : C.light, 'stroke-width': 1.1, 'stroke-opacity': 0.5,
    }, zg));
    ['Ag', 'H', 'L'].forEach((ch) => el('path', {
      d: poly(P.chains[ch].trace.map(zput)), fill: 'none', stroke: ch === 'Ag' ? '#6f8438' : (ch === 'H' ? '#79797b' : C.light),
      'stroke-width': 1.1, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round',
    }, zg));

    const order = ['native', M].concat(Object.keys(P.loops).filter((k) => k !== 'native' && k !== M));
    const paths = {};
    order.forEach((k) => {
      const col = C[k] || C.raad;
      paths[k] = el('path', {
        d: poly(P.loops[k].xy.map(zput)), fill: 'none', stroke: col,
        'stroke-width': k === 'native' ? 4 : 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'pathLength': 1, 'stroke-dasharray': '1 1.01', 'stroke-dashoffset': 0,
      }, zg);
    });

    // the controls under the picture, one per loop, with the numbers measured for it
    const rail = htm('div', 'dz-rail', host);
    const readout = htm('div', 'dz-readout', host);
    const state = {};
    order.forEach((k, i) => {
      state[k] = true;
      const b = htm('button', 'dz-chip is-on', rail);
      b.type = 'button';
      b.innerHTML = '<i style="background:' + (C[k] || C.raad) + '"></i>' + (NAME[k] || k);
      b.addEventListener('click', () => {
        state[k] = !state[k];
        b.classList.toggle('is-on', state[k]);
        paths[k].setAttribute('opacity', state[k] ? 1 : 0.08);
      });
    });
    function readoutRow(k) {
      const L = P.loops[k];
      const r = htm('div', 'dz-row', readout);
      htm('span', 'dz-key', r, NAME[k] || k).style.color = C[k] || C.raad;
      htm('span', 'dz-val', r, k === 'native' ? 'the deposited loop' : L.rmsd.toFixed(2) + ' Å from it');
      htm('span', 'dz-val', r, L.reach.length + ' of ' + P.epitope.n + ' epitope residues reached');
    }
    order.forEach(readoutRow);

    // the loops draw in turn whenever the panel is on screen
    let raf = null, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      const t = (ts - t0) / 1000;
      order.forEach((k, i) => {
        const a = 0.25 + i * 0.75;
        const u = Math.max(0, Math.min(1, (t - a) / 1.0));
        paths[k].setAttribute('stroke-dashoffset', (1 - u * u * (3 - 2 * u)).toFixed(4));
      });
      if (t < 0.3 + order.length * 0.75 + 1.2) raf = requestAnimationFrame(step);
      else raf = null;
    }
    let played = false;
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && raf === null && !played) {
          played = true; t0 = null;
          order.forEach((k) => paths[k].setAttribute('stroke-dashoffset', 1));
          raf = requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.3 }).observe(host);
  })();

  // ---------------------------------------------------------------- 2: designed sequences
  (function sequences() {
    const host = document.getElementById('design-seq');
    if (!host) return;
    const P = D.panel;
    function strip(parent, title, note, rows, contacts) {
      const card = htm('div', 'dz-seqcard', parent);
      const head = htm('div', 'dz-seqhead', card);
      htm('span', 'dz-seqtitle', head, title);
      htm('span', 'dz-seqnote', head, note);
      const grid = htm('div', 'dz-grid', card);
      grid.style.gridTemplateColumns = 'auto repeat(' + rows[0].seq.length + ', 1fr)';
      rows.forEach((r) => {
        const lab = htm('div', 'dz-label', grid, r.name);
        lab.style.color = C[r.key] || C.raad;
        for (let i = 0; i < rows[0].seq.length; i++) {
          const ch = r.seq[i] || '';
          const same = r.key !== 'native' && rows[0].seq[i] === ch;
          const cell = htm('div', 'dz-cell' + (same ? ' is-match' : '') + (r.key === 'native' ? ' is-native' : ''), grid, ch);
          if (contacts && contacts[i]) cell.classList.add('is-contact');
        }
      });
      if (contacts) {
        htm('div', 'dz-label dz-sub', grid, 'contacts');
        contacts.forEach((c) => htm('div', 'dz-mark' + (c ? ' is-contact' : ''), grid, c ? '●' : ''));
      }
    }
    const rows = [{ key: 'native', name: 'deposited', seq: P.sequences.native }];
    [M].concat(Object.keys(P.sequences).filter((k) => k !== 'native' && k !== M)).forEach((k) => {
      if (P.sequences[k]) rows.push({ key: k, name: NAME[k] || k, seq: P.sequences[k] });
    });
    const nct = P.contacts.filter(Boolean).length;
    strip(host, P.pdb, 'CDR-H3 of ' + P.contacts.length + ' residues, ' + nct + ' of them touching the antigen', rows, P.contacts);

    const more = htm('div', 'dz-more', host);
    D.examples.forEach((e) => {
      const r = [{ key: 'native', name: 'deposited', seq: e.native }, { key: M, name: ST.label, seq: e.pred }];
      Object.keys(e.baselines).forEach((b) => r.push({ key: b, name: NAME[b] || b, seq: e.baselines[b] }));
      const hit = e.contacts ? e.contacts.reduce((a, c, i) => a + (c && e.native[i] === e.pred[i] ? 1 : 0), 0) : null;
      const ct = e.contacts ? e.contacts.filter(Boolean).length : 0;
      strip(more, e.id.split('_')[0].toUpperCase(),
        Math.round(e.aar * 100) + '% recovered' + (e.contacts ? ', ' + hit + ' of ' + ct + ' at contact positions' : ''),
        r, e.contacts);
    });
  })();

  // ---------------------------------------------------------------- 3: which amino acids a method uses
  (function usage() {
    const host = document.getElementById('design-usage');
    if (!host) return;
    const series = ['native', M].concat(Object.keys(D.usage).filter((k) => k !== 'native' && k !== M));
    const W = 760, H = 250, L = 34, B = 34, T = 16;
    const svg = el('svg', { xmlns: NS, viewBox: '0 0 ' + W + ' ' + H, class: 'dz-svg' }, host);
    const max = Math.max.apply(null, series.map((s) => Math.max.apply(null, AA.map((a) => D.usage[s][a] || 0))));
    const y = (v) => H - B - (v / max) * (H - B - T);
    const bw = (W - L - 10) / AA.length;
    [0, 0.1, 0.2, 0.3, 0.4].filter((v) => v <= max * 1.02).forEach((v) => {
      el('line', { x1: L, y1: y(v), x2: W - 6, y2: y(v), stroke: C.rule, 'stroke-width': 1 }, svg);
      const t = el('text', { x: L - 6, y: y(v) + 4, class: 'dz-axis', 'text-anchor': 'end' }, svg);
      t.textContent = Math.round(v * 100) + '%';
    });
    AA.forEach((a, i) => {
      const x0 = L + i * bw;
      const t = el('text', { x: x0 + bw / 2, y: H - B + 16, class: 'dz-axis', 'text-anchor': 'middle' }, svg);
      t.textContent = a;
      series.forEach((s, k) => {
        const v = D.usage[s][a] || 0;
        const w = (bw - 6) / series.length;
        el('rect', { x: x0 + 3 + k * w, y: y(v), width: w - 0.8, height: Math.max(0.6, H - B - y(v)),
                     fill: C[s] || C.raad, opacity: s === 'native' ? 0.45 : 0.95, rx: 1 }, svg);
      });
    });
    const leg = htm('div', 'dz-rail', host);
    series.forEach((s) => {
      const b = htm('span', 'dz-chip is-on is-static', leg);
      b.innerHTML = '<i style="background:' + (C[s] || C.raad) + '"></i>' + (NAME[s] || s);
    });
  })();
})();
