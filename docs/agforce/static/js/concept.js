// The animated conceptual figure of the AgForce page: the distribution follows the antigen, the
// argmax does not.
//
// Everything drawn here is measured. The two targets are deposited complexes whose folds are held
// out of training, the columns are the per-position distribution that MEAN itself saved for them,
// and the decoded loops are the saved predictions of MEAN, dyMEAN and AgForce. Geometry and numbers
// come from scene-data.js, written by anim/make_scene_data.py.

(function () {
  const D = window.AF_DATA;
  const host = document.getElementById('af-concept');
  if (!D || !host) return;
  const P = D.profile, T = D.targets;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#1B2433', muted: '#5F6368', rule: '#DFE2E6', panel: '#FAFBFC', white: '#ffffff',
    ag: '#D4763C', agdark: '#9A5327', surf: '#D8D5CC', surfd: '#B9B4A6',
    cdr: '#4A90D9', cdrdark: '#2C5B8A', heavy: '#9EC0E0', light: '#CBD8E6',
    teal: '#2D8F83', olive: '#B8A932', purple: '#7B5EA7', red: '#C04E3E', grey: '#AEB4B9',
    dim: '#EDEFF1',
  };
  const W = 480, H = 640, GAP = 74;
  const T_END = 23;
  const AACOL = { A: '#A6C4E0', V: '#A6C4E0', L: '#A6C4E0', I: '#A6C4E0', M: '#A6C4E0',
    F: '#C4B0D4', W: '#C4B0D4', Y: '#C4B0D4', G: '#B8D8C0', P: '#B8D8C0', S: '#B8D8C0',
    T: '#B8D8C0', C: '#B8D8C0', D: '#D89888', E: '#D89888', K: '#E0A8A0', R: '#E0A8A0',
    H: '#E0A8A0', N: '#DCC8A0', Q: '#DCC8A0' };

  const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
  const ease = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const span = (t, a, b) => clamp01((t - a) / (b - a));
  const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.pow(Math.sin(Math.PI * (t - a) / (b - a)), 2));
  const lerp = (a, b, u) => a + (b - a) * u;

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, cls, extra) {
    const n = el('text', Object.assign({ x: x, y: y, class: cls || 'af-note' }, extra || {}), parent);
    n.textContent = str;
    return n;
  }
  function poly(points, close) {
    let d = 'M' + points[0][0].toFixed(2) + ' ' + points[0][1].toFixed(2);
    for (let i = 1; i < points.length; i++) d += 'L' + points[i][0].toFixed(2) + ' ' + points[i][1].toFixed(2);
    return close ? d + 'Z' : d;
  }
  const mapAll = (pts, f) => pts.map(f);
  function placer(box, w, h, pad, ox, oy) {
    const s = Math.min((w - 2 * pad) / (box[1][0] - box[0][0]), (h - 2 * pad) / (box[1][1] - box[0][1]));
    const cx = (box[0][0] + box[1][0]) / 2, cy = (box[0][1] + box[1][1]) / 2;
    return (p) => [ox + w / 2 + (p[0] - cx) * s, oy + h / 2 - (p[1] - cy) * s];
  }

  const svg = el('svg', { xmlns: NS, class: 'af-scene-svg' }, host);
  const defs = el('defs', {}, svg);
  const root = el('g', {}, svg);
  const arrows = [0, 1].map(() => el('path', { fill: 'none', stroke: C.cdr, 'stroke-width': 2.4, 'stroke-opacity': 0.45, 'marker-end': 'url(#af2-arrow)' }, root));
  const marker = el('marker', { id: 'af2-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 4.5, markerHeight: 4.5, orient: 'auto' }, defs);
  el('path', { d: 'M0 0 L8 4 L0 8 z', fill: C.cdr, 'fill-opacity': 0.45 }, marker);

  function panel(title, sub, step) {
    const g = el('g', {}, root);
    el('rect', { x: 0, y: 0, width: W, height: H, rx: 16, fill: C.panel, stroke: C.rule, 'stroke-width': 1.2 }, g);
    el('circle', { cx: 36, cy: 38, r: 13, fill: C.cdr, 'fill-opacity': 0.12 }, g);
    text(g, 36, 43, String(step), 'af-step', { 'text-anchor': 'middle' });
    text(g, 58, 36, title, 'af-act');
    text(g, 58, 56, sub, 'af-sub');
    return g;
  }
  const A = panel('Two targets', 'one antibody framework', 1);
  const B = panel('What it learns', 'the distribution at each position', 2);
  const Cg = panel('What comes out', 'after the argmax', 3);

  // ---- panel 1: the two held-out complexes ------------------------------------------------
  const actA = ['a', 'b'].map((key, k) => {
    const g = el('g', {}, A);
    const y0 = 92 + k * 268;
    const ring = el('rect', { x: 20, y: y0 - 10, width: W - 40, height: 256, rx: 13, fill: C.white, stroke: C.rule, 'stroke-width': 1.2 }, g);
    const S = T[key];
    const put = placer(S.bbox, W - 60, 196, 8, 30, y0);
    const agPath = poly(mapAll(S.antigen, put), true);
    el('path', { d: agPath, fill: C.surf, 'fill-opacity': 0.9, stroke: C.surfd, 'stroke-width': 1.1 }, g);
    const agClip = el('clipPath', { id: 'af2-agclip' + k }, defs);
    el('path', { d: agPath }, agClip);
    el('path', { d: poly(mapAll(S.epitope, put), true), fill: C.ag, 'fill-opacity': 0.9, 'clip-path': 'url(#af2-agclip' + k + ')' }, g);
    [['light', C.light], ['heavy', C.heavy]].forEach((q) => el('path', {
      d: poly(mapAll(S[q[0]], put), true), fill: q[1], 'fill-opacity': 0.5, stroke: C.cdr,
      'stroke-opacity': 0.35, 'stroke-width': 1,
    }, g));
    el('path', { d: poly(mapAll(S.heavy_trace, put)), fill: 'none', stroke: C.cdrdark, 'stroke-width': 0.9, 'stroke-opacity': 0.2 }, g);
    el('path', { d: poly(mapAll(S.native_h3, put)), fill: 'none', stroke: C.cdrdark, 'stroke-width': 2.4, 'stroke-dasharray': '5 5', 'stroke-linecap': 'round' }, g);
    text(g, 36, y0 + 222, D.names[key], 'af-lane');
    text(g, 36, y0 + 240, D.sizes[key] + ', ' + S.epitope_ca.length + ' in the epitope', 'af-note');
    return { g: g, ring: ring };
  });
  text(A, 36, 82, 'the same framework meets both', 'af-note', { 'font-style': 'italic' });

  // ---- panel 2: the distribution, and what the argmax keeps -------------------------------
  const actB = (function () {
    const g = B;
    const BASE = 452, TOPH = 262, x0 = 30, cw = (W - 62) / P.cols.length;
    el('line', { x1: x0 - 4, y1: BASE + 2, x2: W - 28, y2: BASE + 2, stroke: C.rule, 'stroke-width': 1 }, g);
    const cols = P.cols.map((col, i) => {
      const segs = col.res.map((r) => el('rect', { x: x0 + i * cw, width: cw - 4, y: BASE, height: 0, rx: 2, fill: AACOL[r] || C.dim }, g));
      const labs = col.res.map((r) => text(g, x0 + i * cw + (cw - 4) / 2, BASE, r, 'af-res', { 'text-anchor': 'middle', opacity: 0 }));
      const rest = el('rect', { x: x0 + i * cw, width: cw - 4, y: BASE, height: 0, rx: 2, fill: C.dim }, g);
      const tile = el('g', { opacity: 0 }, g);
      el('rect', { x: x0 + i * cw, y: 104, width: cw - 4, height: 32, rx: 5, fill: C.dim }, tile);
      const tileTx = text(tile, x0 + i * cw + (cw - 4) / 2, 126, '', 'af-res', { 'text-anchor': 'middle' });
      text(g, x0 + i * cw + (cw - 4) / 2, BASE + 18, String(i + 1), 'af-note', { 'text-anchor': 'middle', fill: C.grey });
      return { segs: segs, labs: labs, rest: rest, tile: tile, tileTx: tileTx, x: x0 + i * cw, w: cw - 4 };
    });
    const brack = el('path', { d: '', fill: 'none', stroke: C.teal, 'stroke-width': 1.4, opacity: 0 }, g);
    const brackTx = text(g, W / 2, 166, '', 'af-note', { 'text-anchor': 'middle', fill: C.teal, opacity: 0 });
    const note = text(g, W / 2, BASE + 46, '', 'af-tag', { 'text-anchor': 'middle', opacity: 0 });
    const sub = text(g, W / 2, BASE + 70, '', 'af-note', { 'text-anchor': 'middle', opacity: 0 });
    return { cols: cols, BASE: BASE, TOPH: TOPH, brack: brack, brackTx: brackTx, note: note, sub: sub };
  })();

  // ---- panel 3: the decoded loops, and how often they follow the target -------------------
  const actC = (function () {
    const g = Cg;
    const x0 = 30, tw = (W - 62) / 10;
    function row(y, label, seq) {
      const gg = el('g', { opacity: 0 }, g);
      text(gg, x0, y - 10, label, 'af-note');
      const tiles = [];
      for (let i = 0; i < seq.length; i++) {
        const t = el('g', { opacity: 0 }, gg);
        el('rect', { x: x0 + i * tw, y: y, width: tw - 3, height: 30, rx: 5, fill: AACOL[seq[i]] || C.dim }, t);
        text(t, x0 + i * tw + (tw - 3) / 2, y + 21, seq[i], 'af-res', { 'text-anchor': 'middle' });
        tiles.push(t);
      }
      return { g: gg, tiles: tiles, y: y };
    }
    const meanA = row(118, D.names.a, P.mean);
    const meanB = row(172, D.names.b, P.mean);
    const same = el('rect', { x: x0 - 7, y: 104, width: W - 48, height: 100, rx: 9, fill: 'none', stroke: C.red, 'stroke-width': 2, opacity: 0 }, g);
    const sameTx = text(g, W / 2, 222, 'the same ten residues', 'af-tag', { 'text-anchor': 'middle', fill: C.red, opacity: 0 });
    const dymTx = text(g, x0, 250, '', 'af-note', { opacity: 0 });
    const agfA = row(314, D.names.a, P.agforce.a);
    const agfB = row(368, D.names.b, P.agforce.b);
    const agfTag = text(g, x0, 268, 'AgForce', 'af-lane', { fill: C.teal, opacity: 0 });
    const marks = [];
    for (let i = 0; i < 10; i++) {
      if (P.agforce.a[i] === P.agforce.b[i]) continue;
      [314, 368].forEach((y) => marks.push(el('rect', { x: x0 + i * tw - 3, y: y - 4, width: tw + 3, height: 38, rx: 7, fill: 'none', stroke: C.teal, 'stroke-width': 2, opacity: 0 }, g)));
    }
    const ticks = [];
    [['a', 314], ['b', 368]].forEach((q) => T[q[0] === 'a' ? 'a' : 'b'].contacts.forEach((i) => {
      ticks.push(el('rect', { x: x0 + i * tw + 3, y: q[1] + 34, width: tw - 9, height: 4, rx: 2, fill: C.ag, opacity: 0 }, g));
    }));
    const diffTx = text(g, W / 2, 420, '', 'af-note', { 'text-anchor': 'middle', fill: C.teal, opacity: 0 });

    // the measured agreement between the designs a method returns for two different targets
    const ax0 = 42, ax1 = W - 30, ay = 524;
    const axis = el('line', { x1: ax0, y1: ay, x2: ax1, y2: ay, stroke: C.rule, 'stroke-width': 1.4, opacity: 0 }, g);
    const px = (v) => ax0 + (ax1 - ax0) * (v - 0.2) / 0.8;
    const SIDE = { 'native loops': 0, 'DiffAb': 1, 'AgForce': 0, 'MEAN': 1, 'RAAD': 0, 'dyMEAN': 1 };
    const dots = D.agreement.filter((m) => m.name !== 'dyAb').map((m, k) => {
      const up = SIDE[m.name] === 0;
      const gg = el('g', { opacity: 0 }, g);
      el('line', { x1: px(m.v), y1: ay, x2: px(m.v), y2: ay + (up ? -13 : 13), stroke: m.name === 'AgForce' ? C.teal : C.grey, 'stroke-width': 1.2 }, gg);
      el('circle', { cx: px(m.v), cy: ay, r: m.name === 'AgForce' ? 5.5 : 4,
        fill: m.name === 'AgForce' ? C.teal : m.name === 'dyMEAN' || m.name === 'dyAb' ? C.red : C.grey }, gg);
      const label = (m.name === 'native loops' ? 'native' : m.name) + ' ' + m.v.toFixed(2);
      const tx = text(gg, px(m.v) + (m.v < 0.3 ? -4 : 0), ay + (up ? -20 : 30), label, 'af-note',
        { 'text-anchor': m.v > 0.9 ? 'end' : m.v < 0.3 ? 'start' : 'middle' });
      if (m.name === 'AgForce') { tx.setAttribute('fill', C.ink); tx.setAttribute('font-weight', '700'); }
      return gg;
    });
    const axTx = text(g, W / 2, 576, '', 'af-note', { 'text-anchor': 'middle', opacity: 0 });
    const axTx2 = text(g, W / 2, 596, '', 'af-note', { 'text-anchor': 'middle', opacity: 0 });
    return { meanA, meanB, same, sameTx, dymTx, agfA, agfB, agfTag, marks, ticks, diffTx, axis, dots, axTx, axTx2 };
  })();

  function layout() {
    const wide = (host.clientWidth || 900) >= 840;
    if (wide) {
      svg.setAttribute('viewBox', '0 0 ' + (3 * W + 2 * GAP) + ' ' + H);
      A.setAttribute('transform', 'translate(0,0)');
      B.setAttribute('transform', 'translate(' + (W + GAP) + ',0)');
      Cg.setAttribute('transform', 'translate(' + (2 * (W + GAP)) + ',0)');
      arrows[0].setAttribute('d', 'M' + (W + 18) + ' ' + H / 2 + 'h' + (GAP - 40));
      arrows[1].setAttribute('d', 'M' + (2 * W + GAP + 18) + ' ' + H / 2 + 'h' + (GAP - 40));
    } else {
      const g2 = 52;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (3 * H + 2 * g2));
      A.setAttribute('transform', 'translate(0,0)');
      B.setAttribute('transform', 'translate(0,' + (H + g2) + ')');
      Cg.setAttribute('transform', 'translate(0,' + (2 * (H + g2)) + ')');
      arrows[0].setAttribute('d', 'M' + W / 2 + ' ' + (H + 12) + 'v' + (g2 - 30));
      arrows[1].setAttribute('d', 'M' + W / 2 + ' ' + (2 * H + g2 + 12) + 'v' + (g2 - 30));
    }
  }

  // ---------------------------------------------------------------- the timeline
  const T_SW = [8.2, 9.8];                       // when the target on screen changes
  function frame(t) {
    const u = ramp(t, T_SW[0], T_SW[1]);         // 0 on target A, 1 on target B
    const cur = u < 0.5 ? 0 : 1;
    actA.forEach((p, k) => {
      const on = (k === cur) ? 1 : 0.0;
      p.ring.setAttribute('stroke', on ? C.cdr : C.rule);
      p.ring.setAttribute('stroke-width', on ? 2.4 : 1.2);
      p.g.setAttribute('opacity', (0.45 + 0.55 * (k === cur ? 1 : 0.45)).toFixed(3));
    });

    // the columns: a real distribution, morphed between the two targets
    const b = actB;
    const grow = ramp(t, 1.4, 3.2);
    const collapse = clamp01(ramp(t, 5.2, 6.6) - ramp(t, 7.4, 8.1) + ramp(t, 9.8, 11.2));
    P.cols.forEach((col, i) => {
      const node = b.cols[i];
      let best = 0, bestP = -1;
      const ps = col.res.map((r, j) => lerp(col.a[j], col.b[j], u));
      ps.forEach((v, j) => { if (v > bestP) { bestP = v; best = j; } });
      let y = b.BASE, acc = 0;
      ps.forEach((v, j) => {
        const h = b.TOPH * v * grow;
        const keep = j === best;
        const yy = keep ? lerp(y - h, b.BASE - h, collapse) : y - h - 150 * collapse;
        const op = keep ? 1 : (1 - collapse);
        node.segs[j].setAttribute('y', yy.toFixed(1));
        node.segs[j].setAttribute('height', Math.max(0, h).toFixed(1));
        node.segs[j].setAttribute('opacity', op.toFixed(3));
        node.labs[j].setAttribute('y', (yy + h / 2 + 5).toFixed(1));
        node.labs[j].setAttribute('opacity', (h > 15 ? op : 0).toFixed(3));
        y -= h;
        acc += v;
      });
      const rh = b.TOPH * Math.max(0, 1 - acc) * grow;
      node.rest.setAttribute('y', (y - rh - 150 * collapse).toFixed(1));
      node.rest.setAttribute('height', Math.max(0, rh).toFixed(1));
      node.rest.setAttribute('opacity', (1 - collapse).toFixed(3));
      const show = Math.max(ramp(t, 5.6, 6.4), ramp(t, 10.0, 10.8));
      node.tile.setAttribute('opacity', show.toFixed(3));
      node.tileTx.textContent = col.res[best];
      node.tile.firstChild.setAttribute('fill', AACOL[col.res[best]] || C.dim);
    });
    const br = bump(t, 3.6, 5.4);
    if (br > 0.01) {
      const x0 = b.cols[2].x, x1 = b.cols[6].x + b.cols[6].w, yb = b.BASE - b.TOPH * 0.92;
      b.brack.setAttribute('d', 'M' + x0 + ' ' + (yb + 12) + 'V' + yb + 'H' + x1 + 'V' + (yb + 12));
      b.brackTx.setAttribute('y', (yb - 10).toFixed(1));
      b.brackTx.textContent = 'up to ' + P.eff_max.toFixed(0) + ' residues of spread here';
    }
    b.brack.setAttribute('opacity', br.toFixed(3));
    b.brackTx.setAttribute('opacity', br.toFixed(3));
    const nA = bump(t, 5.4, 7.4), nB = bump(t, 9.4, 12.2);
    b.note.setAttribute('opacity', Math.max(nA, nB).toFixed(3));
    b.note.setAttribute('fill', nB > nA ? C.teal : C.red);
    b.note.textContent = nB > nA ? 'the distribution moved by ' + P.tv.toFixed(2) + ' in total variation'
      : 'the argmax keeps one of them';
    b.sub.setAttribute('opacity', nB > nA ? nB.toFixed(3) : 0);
    b.sub.textContent = 'and the ten residues it decodes do not change';

    // panel 3
    const c = actC;
    c.meanA.g.setAttribute('opacity', ramp(t, 6.4, 7.0).toFixed(3));
    c.meanA.tiles.forEach((n, i) => n.setAttribute('opacity', ramp(t, 6.5 + 0.06 * i, 6.9 + 0.06 * i).toFixed(3)));
    c.meanB.g.setAttribute('opacity', ramp(t, 10.8, 11.4).toFixed(3));
    c.meanB.tiles.forEach((n, i) => n.setAttribute('opacity', ramp(t, 10.9 + 0.06 * i, 11.3 + 0.06 * i).toFixed(3)));
    const sm = bump(t, 11.8, 14.4);
    c.same.setAttribute('opacity', sm.toFixed(3));
    c.sameTx.setAttribute('opacity', sm.toFixed(3));
    c.dymTx.setAttribute('opacity', ramp(t, 12.6, 13.2).toFixed(3));
    c.dymTx.textContent = 'dyMEAN decodes ' + P.dymean + ' for both';
    c.agfTag.setAttribute('opacity', ramp(t, 14.0, 14.6).toFixed(3));
    c.agfA.g.setAttribute('opacity', ramp(t, 14.2, 14.8).toFixed(3));
    c.agfA.tiles.forEach((n, i) => n.setAttribute('opacity', ramp(t, 14.3 + 0.06 * i, 14.7 + 0.06 * i).toFixed(3)));
    c.agfB.g.setAttribute('opacity', ramp(t, 15.4, 16.0).toFixed(3));
    c.agfB.tiles.forEach((n, i) => n.setAttribute('opacity', ramp(t, 15.5 + 0.06 * i, 15.9 + 0.06 * i).toFixed(3)));
    c.marks.forEach((n, i) => n.setAttribute('opacity', ramp(t, 16.4 + 0.05 * i, 16.9 + 0.05 * i).toFixed(3)));
    c.ticks.forEach((n, i) => n.setAttribute('opacity', ramp(t, 16.8 + 0.04 * i, 17.3 + 0.04 * i).toFixed(3)));
    c.diffTx.setAttribute('opacity', ramp(t, 17.4, 18.0).toFixed(3));
    c.diffTx.textContent = 'four positions follow the target, the four closest to the antigen';
    c.axis.setAttribute('opacity', ramp(t, 18.4, 19.0).toFixed(3));
    c.dots.forEach((n, i) => n.setAttribute('opacity', ramp(t, 18.6 + 0.16 * i, 19.1 + 0.16 * i).toFixed(3)));
    c.axTx.setAttribute('opacity', ramp(t, 20.0, 20.6).toFixed(3));
    c.axTx.textContent = 'how often the designs for two different targets agree,';
    c.axTx2.setAttribute('opacity', ramp(t, 20.0, 20.6).toFixed(3));
    c.axTx2.textContent = 'over the 292 test complexes';
  }

  layout();
  window.addEventListener('resize', layout);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = null, raf = null, paused = false;
  function step(ts) {
    if (t0 === null) t0 = ts;
    frame(((ts - t0) / 1000) % T_END);
    raf = requestAnimationFrame(step);
  }
  const play = () => { if (raf === null && !reduce && !paused) raf = requestAnimationFrame(step); };
  const stop = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; t0 = null; } };
  if (reduce) {
    frame(T_END - 1.4);
  } else {
    new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { t0 = null; play(); } else stop(); });
    }, { threshold: 0.1 }).observe(host);
    frame(0);
  }
  host.addEventListener('click', () => {
    paused = !paused;
    host.classList.toggle('is-paused', paused);
    if (paused) stop(); else { t0 = null; play(); }
  });
  window.__afConcept = { seek: function (t) { stop(); paused = true; frame(t); }, total: T_END, frame: frame };
})();
