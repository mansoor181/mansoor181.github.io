// The animated architecture figure of the AgForce page.
//
// Three panels run left to right: the complex is encoded as a graph with the loop masked, the loop
// attends to the epitope and the antigen gates what reaches the sequence head, and a mixture of
// components decodes the loop back onto the epitope. The molecules are the real coordinates of PDB
// 3MJ9 and the loop AgForce designed for it, projected to 2D by anim/make_scene_data.py and loaded
// from scene-data.js. The panels sit side by side on a wide screen and stack on a narrow one.

(function () {
  const D = window.AF_DATA;
  const host = document.getElementById('af-arch');
  if (!D || !host) return;
  const S = D.arch;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#1B2433', muted: '#5F6368', rule: '#DFE2E6', panel: '#FAFBFC', white: '#ffffff',
    ag: '#D4763C', agdark: '#9A5327', surf: '#D8D5CC', surfd: '#B9B4A6',
    cdr: '#4A90D9', cdrdark: '#2C5B8A', heavy: '#9EC0E0', light: '#CBD8E6',
    teal: '#2D8F83', olive: '#B8A932', purple: '#7B5EA7', red: '#C04E3E', grey: '#AEB4B9',
  };
  const W = 480, H = 640, GAP = 74;
  const T_END = 23;

  const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
  const ease = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const span = (t, a, b) => clamp01((t - a) / (b - a));
  const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.pow(Math.sin(Math.PI * (t - a) / (b - a)), 2));
  const lerp = (a, b, u) => a + (b - a) * u;
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

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
  function drawable(node) {
    node.setAttribute('pathLength', 1);
    node.setAttribute('stroke-dasharray', '1 1.01');
    return node;
  }
  const drawTo = (node, u) => node.setAttribute('stroke-dashoffset', (1 - clamp01(u)).toFixed(4));
  const mapAll = (pts, f) => pts.map(f);
  function placer(box, w, h, pad, ox, oy) {
    const s = Math.min((w - 2 * pad) / (box[1][0] - box[0][0]), (h - 2 * pad) / (box[1][1] - box[0][1]));
    const cx = (box[0][0] + box[1][0]) / 2, cy = (box[0][1] + box[1][1]) / 2;
    return (p) => [ox + w / 2 + (p[0] - cx) * s, oy + h / 2 - (p[1] - cy) * s];
  }
  function boxOf(sets) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    sets.forEach((pts) => pts.forEach((p) => {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }));
    return [[x0, y0], [x1, y1]];
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const AACOL = { A: '#A6C4E0', V: '#A6C4E0', L: '#A6C4E0', I: '#A6C4E0', M: '#A6C4E0',
    F: '#C4B0D4', W: '#C4B0D4', Y: '#C4B0D4', G: '#B8D8C0', P: '#B8D8C0', S: '#B8D8C0',
    T: '#B8D8C0', C: '#B8D8C0', D: '#D89888', E: '#D89888', K: '#E0A8A0', R: '#E0A8A0',
    H: '#E0A8A0', N: '#DCC8A0', Q: '#DCC8A0' };

  const svg = el('svg', { xmlns: NS, class: 'af-scene-svg' }, host);
  const defs = el('defs', {}, svg);
  const root = el('g', {}, svg);
  const arrows = [0, 1].map(() => el('path', { fill: 'none', stroke: C.cdr, 'stroke-width': 2.4, 'stroke-opacity': 0.45, 'marker-end': 'url(#af-arrow)' }, root));
  const marker = el('marker', { id: 'af-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 4.5, markerHeight: 4.5, orient: 'auto' }, defs);
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
  const A = panel('Encode', 'the complex, with CDR-H3 masked', 1);
  const B = panel('Attend and gate', 'the loop reads the epitope', 2);
  const Cg = panel('Decode', 'a mixture returns the loop', 3);

  // ---- panel 1: the complex, then the graph over it ---------------------------------------
  const actA = (function () {
    const g = A;
    const put = placer(S.bbox, W, H - 150, 24, 0, 82);
    const clip = el('clipPath', { id: 'af-clipA' }, defs);
    el('rect', { x: 14, y: 80, width: W - 28, height: H - 160, rx: 12 }, clip);
    const stage = el('g', { 'clip-path': 'url(#af-clipA)' }, g);

    const agPath = poly(mapAll(S.antigen, put), true);
    el('path', { d: agPath, fill: C.surf, 'fill-opacity': 0.85, stroke: C.surfd, 'stroke-width': 1.2 }, stage);
    const agClip = el('clipPath', { id: 'af-agclipA' }, defs);
    el('path', { d: agPath }, agClip);
    const epi = el('path', { d: poly(mapAll(S.epitope, put), true), fill: C.ag, 'fill-opacity': 0.9, stroke: 'none', 'clip-path': 'url(#af-agclipA)', opacity: 0 }, stage);
    const bodies = [['light', C.light], ['heavy', C.heavy]].map((q) => el('path', {
      d: poly(mapAll(S[q[0]], put), true), fill: q[1], 'fill-opacity': 0.55,
      stroke: C.cdr, 'stroke-opacity': 0.4, 'stroke-width': 1.1, opacity: 0,
    }, stage));
    const traces = ['light_trace', 'heavy_trace'].map((k) => drawable(el('path', {
      d: poly(mapAll(S[k], put)), fill: 'none', stroke: C.cdrdark, 'stroke-width': 1,
      'stroke-opacity': 0.22, 'stroke-linejoin': 'round',
    }, stage)));
    const loopPts = mapAll(S.native_h3, put);
    const loopSolid = drawable(el('path', { d: poly(loopPts), fill: 'none', stroke: C.cdrdark, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stage));
    const loopGhost = el('path', { d: poly(loopPts), fill: 'none', stroke: C.cdrdark, 'stroke-width': 2.4, 'stroke-dasharray': '5 5', 'stroke-linecap': 'round', opacity: 0 }, stage);
    const loopTag = text(g, 0, 0, 'CDR-H3, masked', 'af-tag', { fill: C.cdrdark, opacity: 0 });
    const mid = loopPts[Math.floor(loopPts.length / 2)];
    loopTag.setAttribute('x', 26);
    loopTag.setAttribute('y', 112);

    // framework dropout: a share of the heavy-chain residues is zeroed before message passing
    const fw = mapAll(S.framework_ca, put);
    const rnd = rng(5);
    const dropNodes = fw.filter((p, i) => i % 3 === 0).map((p) => ({
      node: el('circle', { cx: p[0], cy: p[1], r: 3.1, fill: C.white, stroke: C.muted, 'stroke-width': 1.1, opacity: 0 }, stage),
      keep: rnd() < 0.42, phase: rnd(),
    }));

    // the graph: epitope residues, the loop, and the framework around it
    const epiPts = mapAll(S.epitope_ca, put);
    const near = epiPts.map((p, i) => ({ p: p, d: Math.min.apply(null, loopPts.map((q) => dist(p, q))) }))
      .sort((u, v) => u.d - v.d).slice(0, 10).map((u) => u.p);
    const cross = [];
    near.forEach((e, i) => loopPts.forEach((l, j) => cross.push({ e: e, l: l, d: dist(e, l), i: i, j: j })));
    cross.sort((u, v) => u.d - v.d);
    const edges = cross.slice(0, 8);
    const edgeNodes = edges.map((q) => drawable(el('path', {
      d: 'M' + q.e[0].toFixed(1) + ' ' + q.e[1].toFixed(1) + 'L' + q.l[0].toFixed(1) + ' ' + q.l[1].toFixed(1),
      fill: 'none', stroke: C.red, 'stroke-width': 1.2, 'stroke-opacity': 0.5, 'stroke-dasharray': '3 3',
    }, stage)));
    const pulses = edges.map(() => el('circle', { r: 3, fill: C.red, opacity: 0 }, stage));
    const epiNodes = near.map((p) => el('circle', { cx: p[0], cy: p[1], r: 4.6, fill: C.ag, stroke: C.agdark, 'stroke-width': 1, opacity: 0 }, stage));
    const loopNodes = loopPts.map((p) => el('circle', { cx: p[0], cy: p[1], r: 5, fill: C.cdr, stroke: C.cdrdark, 'stroke-width': 1, opacity: 0 }, stage));
    // three virtual nodes bridging the epitope and the loop
    const ec = near.reduce((a, p) => [a[0] + p[0] / near.length, a[1] + p[1] / near.length], [0, 0]);
    const lc = loopPts.reduce((a, p) => [a[0] + p[0] / loopPts.length, a[1] + p[1] / loopPts.length], [0, 0]);
    const vdir = [-(lc[1] - ec[1]), lc[0] - ec[0]];
    const vn = Math.hypot(vdir[0], vdir[1]) || 1;
    const vns = [-1, 0, 1].map((k) => [(ec[0] + lc[0]) / 2 + (vdir[0] / vn) * k * 26, (ec[1] + lc[1]) / 2 + (vdir[1] / vn) * k * 26]);
    const vnNodes = vns.map((p) => el('path', {
      d: 'M0 -7 L2 -2 L7 -2 L3 1.5 L4.5 6.5 L0 3.5 L-4.5 6.5 L-3 1.5 L-7 -2 L-2 -2 Z',
      transform: 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')',
      fill: C.olive, opacity: 0,
    }, stage));
    const vnEdges = [];
    vns.forEach((v, k) => {
      [near[k * 3] || near[0], loopPts[k * 3] || loopPts[0]].forEach((tgt) => {
        vnEdges.push(el('path', {
          d: 'M' + v[0].toFixed(1) + ' ' + v[1].toFixed(1) + 'L' + tgt[0].toFixed(1) + ' ' + tgt[1].toFixed(1),
          fill: 'none', stroke: C.olive, 'stroke-width': 1, 'stroke-opacity': 0.4, 'stroke-dasharray': '2 3', opacity: 0,
        }, stage));
      });
    });

    const note = text(g, 26, H - 44, '', 'af-note');
    const round = text(g, W - 26, H - 44, '', 'af-count-sm', { 'text-anchor': 'end' });
    return { epi, bodies, traces, loopSolid, loopGhost, loopTag, dropNodes, edgeNodes, pulses,
      epiNodes, loopNodes, vnNodes, vnEdges, note, round, edges };
  })();

  // ---- panel 2: the hyperboloid, then the gate --------------------------------------------
  const actB = (function () {
    const g = B;
    const cx = W / 2, cy = 236, R = 136;
    el('circle', { cx: cx, cy: cy, r: R, fill: C.teal, 'fill-opacity': 0.07 }, g);
    [0.45, 0.7, 0.88].forEach((f) => el('circle', { cx: cx, cy: cy, r: R * f, fill: 'none', stroke: C.teal, 'stroke-opacity': 0.16, 'stroke-width': 1 }, g));
    const rim = drawable(el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: C.teal, 'stroke-width': 1.6, 'stroke-opacity': 0.75 }, g));
    const keyAng = [150, 116, 84, 52, 20, 186];
    const keys = keyAng.map((a) => [cx + R * 0.97 * Math.cos(a * Math.PI / 180), cy - R * 0.97 * Math.sin(a * Math.PI / 180)]);
    const qrel = [[-0.34, 0.18], [-0.02, 0.4], [0.3, 0.12], [-0.16, -0.26], [0.24, -0.34]];
    const qs = qrel.map((q) => [cx + q[0] * R, cy - q[1] * R]);
    const pairs = [[0, 1, 1], [0, 0, 0.5], [1, 2, 0.85], [1, 1, 0.45], [2, 3, 1], [2, 2, 0.5],
                   [3, 0, 0.7], [3, 5, 0.4], [4, 4, 0.9], [4, 3, 0.5]];
    // a geodesic of the Poincare disk is a circular arc that meets the rim at a right angle
    function geo(p, q) {
      const a = [(p[0] - cx) / R, (cy - p[1]) / R], b = [(q[0] - cx) / R, (cy - q[1]) / R];
      const det = 2 * (a[0] * b[1] - a[1] * b[0]);
      if (Math.abs(det) < 1e-6) return 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      const ba = a[0] * a[0] + a[1] * a[1] + 1, bb = b[0] * b[0] + b[1] * b[1] + 1;
      const ox = (ba * b[1] - bb * a[1]) / det, oy = (bb * a[0] - ba * b[0]) / det;
      const r2 = ox * ox + oy * oy - 1;
      if (r2 <= 1e-6) return 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      const r = Math.sqrt(r2), c = [cx + ox * R, cy - oy * R];
      let a0 = Math.atan2(p[1] - c[1], p[0] - c[0]), a1 = Math.atan2(q[1] - c[1], q[0] - c[0]);
      let dth = a1 - a0;
      while (dth > Math.PI) dth -= 2 * Math.PI;
      while (dth < -Math.PI) dth += 2 * Math.PI;
      const n = 22, out = [];
      for (let i = 0; i <= n; i++) {
        const th = a0 + dth * (i / n);
        out.push([c[0] + r * R * Math.cos(th), c[1] + r * R * Math.sin(th)]);
      }
      return poly(out);
    }
    const geos = pairs.map((pr) => drawable(el('path', {
      d: geo(qs[pr[0]], keys[pr[1]]), fill: 'none', stroke: C.teal,
      'stroke-width': (0.9 + 2.4 * pr[2]).toFixed(2), 'stroke-opacity': 0.35 + 0.45 * pr[2],
      'stroke-linecap': 'round',
    }, g)));
    const keyNodes = keys.map((p) => el('circle', { cx: p[0], cy: p[1], r: 5.4, fill: C.ag, stroke: C.agdark, 'stroke-width': 1, opacity: 0 }, g));
    const qNodes = qs.map((p) => el('circle', { cx: p[0], cy: p[1], r: 5, fill: C.cdr, stroke: C.cdrdark, 'stroke-width': 1, opacity: 0 }, g));
    text(g, 26, 96, 'keys: epitope residues', 'af-note', { fill: C.agdark });
    text(g, 26, 114, 'queries: CDR residues', 'af-note', { fill: C.cdrdark });
    const dLab = text(g, W / 2, 396, '', 'af-note', { 'text-anchor': 'middle', fill: C.teal });

    // the gate: the antigen stream passes a valve into the stream of the loop
    const gy = 492, gx = 206, xin = 40, xout = W - 58;
    const agLine = drawable(el('path', { d: 'M' + xin + ' ' + (gy - 62) + 'H' + gx, fill: 'none', stroke: C.ag, 'stroke-width': 7, 'stroke-linecap': 'round' }, g));
    const drop = el('path', { d: 'M' + gx + ' ' + (gy - 54) + 'V' + (gy - 8), fill: 'none', stroke: C.ag, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, g);
    const cdrLine = drawable(el('path', { d: 'M' + xin + ' ' + gy + 'H' + gx, fill: 'none', stroke: C.cdr, 'stroke-width': 7, 'stroke-linecap': 'round' }, g));
    const outLine = drawable(el('path', { d: 'M' + gx + ' ' + gy + 'H' + xout, fill: 'none', stroke: C.teal, 'stroke-width': 8, 'stroke-linecap': 'round' }, g));
    const esmLine = drawable(el('path', { d: 'M' + xin + ' ' + (gy + 66) + 'H' + (xout - 54) + 'V' + (gy + 8), fill: 'none', stroke: C.olive, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g));
    const valve = el('g', { opacity: 0 }, g);
    el('circle', { cx: gx, cy: gy - 34, r: 17, fill: C.white, stroke: C.purple, 'stroke-width': 2 }, valve);
    const valveArc = el('path', { d: '', fill: 'none', stroke: C.purple, 'stroke-width': 4, 'stroke-linecap': 'round' }, valve);
    text(g, xin, gy - 76, 'antigen context', 'af-note', { fill: C.agdark });
    text(g, xin, gy + 22, 'CDR features', 'af-note', { fill: C.cdrdark });
    text(g, xin, gy + 56, 'ESM-2, fixed', 'af-note', { fill: '#8d821f' });
    const gateTag = text(g, gx + 26, gy - 30, 'gate', 'af-tag', { fill: C.purple, opacity: 0 });
    const beads = [];
    for (let i = 0; i < 7; i++) beads.push(el('circle', { r: 3.2, fill: C.teal, opacity: 0 }, g));
    const bar = el('rect', { x: xout - 6, y: gy - 30, width: 12, height: 0, rx: 3, fill: C.teal, opacity: 0 }, g);
    el('rect', { x: xout - 6, y: gy - 30, width: 12, height: 60, rx: 3, fill: 'none', stroke: C.rule, 'stroke-width': 1 }, g);
    const barTag = text(g, xout, gy - 42, '768-d', 'af-note', { 'text-anchor': 'middle', opacity: 0 });
    return { rim, geos, keyNodes, qNodes, dLab, agLine, cdrLine, outLine, esmLine, drop, valve,
      valveArc, gateTag, beads, bar, barTag, gx, gy, xin, xout, pairs };
  })();

  // ---- panel 3: the mixture, then the loop it returns -------------------------------------
  const actC = (function () {
    const g = Cg;
    const rows = [0, 1, 2, 3].map((k) => {
      const y = 104 + k * 56;
      const card = el('rect', { x: 26, y: y, width: W - 52, height: 46, rx: 9, fill: C.white, stroke: C.rule, 'stroke-width': 1, opacity: 0 }, g);
      const bars = [];
      const rnd = rng(31 + k);
      for (let i = 0; i < 10; i++) {
        const stack = [];
        let acc = 0;
        for (let j = 0; j < 3; j++) {
          const h = (12 - 3 * j) * (0.55 + 0.75 * rnd());
          stack.push(el('rect', { x: 40 + i * 40, y: y + 38 - acc - h, width: 24, height: h, rx: 2, fill: ['#D89888', '#A6C4E0', '#B8D8C0', '#C4B0D4', '#DCC8A0'][(k + i + j) % 5], opacity: 0 }, g));
          acc += h;
        }
        bars.push(stack);
      }
      const tag = text(g, W - 36, y + 27, 'k = ' + (k + 1), 'af-note', { 'text-anchor': 'end', opacity: 0 });
      return { card: card, bars: bars, tag: tag, y: y };
    });
    const piBg = el('rect', { x: 60, y: 342, width: W - 120, height: 10, rx: 5, fill: C.rule, opacity: 0 }, g);
    const piSeg = [0, 1, 2, 3].map((k) => el('rect', { x: 60, y: 342, width: 0, height: 10, rx: 5, fill: k === 1 ? C.teal : C.grey, opacity: 0 }, g));
    const piTag = text(g, 36, 351, 'π', 'af-note', { opacity: 0 });
    const tauTag = text(g, W - 36, 351, '', 'af-note', { 'text-anchor': 'end', opacity: 0 });

    // the designed loop, on the epitope it was designed against
    const VY = 372, VH = 150;
    el('rect', { x: 26, y: VY, width: W - 52, height: VH, rx: 11, fill: C.white, stroke: C.rule, 'stroke-width': 1 }, g);
    const clip = el('clipPath', { id: 'af-clipC' }, defs);
    el('rect', { x: 26, y: VY, width: W - 52, height: VH, rx: 11 }, clip);
    const stage = el('g', { 'clip-path': 'url(#af-clipC)' }, g);
    const zbox = boxOf([S.designed_h3, S.epitope]);
    const zoom = placer(zbox, W - 52, VH, 34, 26, VY);
    const agPath = poly(mapAll(S.antigen, zoom), true);
    el('path', { d: agPath, fill: C.surf, 'fill-opacity': 0.9, stroke: 'none' }, stage);
    const agClip = el('clipPath', { id: 'af-agclipC' }, defs);
    el('path', { d: agPath }, agClip);
    el('path', { d: poly(mapAll(S.epitope, zoom), true), fill: C.ag, 'fill-opacity': 0.9, 'clip-path': 'url(#af-agclipC)' }, stage);
    el('path', { d: poly(mapAll(S.native_h3, zoom)), fill: 'none', stroke: C.cdrdark, 'stroke-width': 2, 'stroke-opacity': 0.35, 'stroke-dasharray': '4 4' }, stage);
    const des = drawable(el('path', { d: poly(mapAll(S.designed_h3, zoom)), fill: 'none', stroke: C.teal, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stage));
    const desDots = mapAll(S.designed_h3, zoom).map((p, i) => el('circle', {
      cx: p[0], cy: p[1], r: 4.4, fill: S.seq.designed[i] === S.seq.native[i] ? C.teal : C.red,
      stroke: C.white, 'stroke-width': 1.2, opacity: 0,
    }, stage));
    const tiles = [];
    const tw = 34, tx = (W - tw * S.seq.designed.length) / 2;
    for (let i = 0; i < S.seq.designed.length; i++) {
      const gg = el('g', { opacity: 0 }, g);
      el('rect', { x: tx + i * tw, y: VH + VY + 16, width: tw - 4, height: 30, rx: 5, fill: AACOL[S.seq.designed[i]] || '#E7EAEC' }, gg);
      text(gg, tx + i * tw + (tw - 4) / 2, VH + VY + 37, S.seq.designed[i], 'af-res', { 'text-anchor': 'middle' });
      if (S.contacts.indexOf(i) >= 0) el('rect', { x: tx + i * tw + 3, y: VH + VY + 50, width: tw - 10, height: 4, rx: 2, fill: C.ag }, gg);
      tiles.push(gg);
    }
    const score = text(g, W / 2, H - 26, '', 'af-note', { 'text-anchor': 'middle', opacity: 0 });
    return { rows, piBg, piSeg, piTag, tauTag, des, desDots, tiles, score };
  })();

  // ---------------------------------------------------------------- layout
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
  function frame(t) {
    // panel 1
    const a = actA;
    a.bodies.forEach((n, i) => n.setAttribute('opacity', ramp(t, 0.1 + 0.2 * i, 1.1 + 0.2 * i).toFixed(3)));
    a.traces.forEach((n, i) => drawTo(n, span(t, 0.4 + 0.2 * i, 1.8 + 0.2 * i)));
    a.epi.setAttribute('opacity', (0.9 * ramp(t, 0.8, 1.8)).toFixed(3));
    drawTo(a.loopSolid, span(t, 1.0, 2.0));
    const masked = ramp(t, 2.4, 3.2);
    a.loopSolid.setAttribute('opacity', (1 - masked).toFixed(3));
    a.loopGhost.setAttribute('opacity', masked.toFixed(3));
    a.loopTag.setAttribute('opacity', ramp(t, 2.6, 3.3).toFixed(3));
    const dropIn = ramp(t, 3.4, 4.2);
    a.dropNodes.forEach((d) => {
      const blink = d.keep ? (t > 3.4 && t < 5.2 ? (Math.sin((t * 5 + d.phase * 6.3)) > 0 ? 1 : 0.25) : (t >= 5.2 ? 1 : 0)) : 0;
      d.node.setAttribute('opacity', (dropIn * blink).toFixed(3));
    });
    const gIn = ramp(t, 5.4, 6.4);
    a.epiNodes.forEach((n, i) => n.setAttribute('opacity', ramp(t, 5.4 + 0.04 * i, 6.0 + 0.04 * i).toFixed(3)));
    a.loopNodes.forEach((n, i) => n.setAttribute('opacity', ramp(t, 5.6 + 0.04 * i, 6.2 + 0.04 * i).toFixed(3)));
    a.edgeNodes.forEach((n, i) => drawTo(n, span(t, 6.2 + 0.05 * i, 6.9 + 0.05 * i)));
    a.vnNodes.forEach((n, i) => n.setAttribute('opacity', ramp(t, 6.9 + 0.1 * i, 7.5 + 0.1 * i).toFixed(3)));
    a.vnEdges.forEach((n, i) => n.setAttribute('opacity', (0.45 * ramp(t, 7.1 + 0.05 * i, 7.7 + 0.05 * i)).toFixed(3)));
    const mp = span(t, 7.4, 11.0) * 5;
    a.pulses.forEach((n, i) => {
      if (t < 7.4 || t > 11.2) { n.setAttribute('opacity', 0); return; }
      const u = (mp + i * 0.08) % 1;
      const e = a.edges[i];
      n.setAttribute('cx', lerp(e.e[0], e.l[0], u).toFixed(1));
      n.setAttribute('cy', lerp(e.e[1], e.l[1], u).toFixed(1));
      n.setAttribute('opacity', (0.9 * Math.sin(Math.PI * u)).toFixed(3));
    });
    a.note.textContent = t < 3.4 ? '' : t < 5.3 ? 'framework dropout, p = 0.3'
      : t < 7.3 ? '10 edge types, 3 virtual nodes' : 'messages travel both ways';
    a.note.setAttribute('opacity', (t < 3.4 ? 0 : 1));
    a.round.textContent = (t >= 7.4 && t <= 11.2) ? 'round ' + Math.min(5, 1 + Math.floor(mp)) + ' of 5' : '';

    // panel 2
    const b = actB;
    drawTo(b.rim, span(t, 6.6, 7.6));
    b.keyNodes.forEach((n, i) => n.setAttribute('opacity', ramp(t, 7.2 + 0.07 * i, 7.8 + 0.07 * i).toFixed(3)));
    b.qNodes.forEach((n, i) => n.setAttribute('opacity', ramp(t, 7.6 + 0.07 * i, 8.2 + 0.07 * i).toFixed(3)));
    b.geos.forEach((n, i) => {
      const q = b.pairs[i][0];
      drawTo(n, span(t, 8.3 + 0.42 * q + 0.06 * (i % 2), 9.0 + 0.42 * q + 0.06 * (i % 2)));
    });
    b.dLab.textContent = t > 10.4 ? 'weight falls with hyperbolic distance' : '';
    drawTo(b.agLine, span(t, 11.6, 12.3));
    drawTo(b.cdrLine, span(t, 11.8, 12.5));
    drawTo(b.esmLine, span(t, 13.6, 14.6));
    b.valve.setAttribute('opacity', ramp(t, 12.4, 13.0).toFixed(3));
    b.gateTag.setAttribute('opacity', ramp(t, 12.6, 13.2).toFixed(3));
    const open = t < 12.8 ? 0 : 0.18 + 0.72 * (0.5 + 0.5 * Math.sin((t - 12.8) * 1.5 - Math.PI / 2));
    const a0 = -120 + 300 * (1 - open);
    const rr = 12, gxv = b.gx, gyv = b.gy - 34;
    const p0 = [gxv + rr * Math.cos(a0 * Math.PI / 180), gyv + rr * Math.sin(a0 * Math.PI / 180)];
    const p1 = [gxv + rr * Math.cos((a0 + 300 * open) * Math.PI / 180), gyv + rr * Math.sin((a0 + 300 * open) * Math.PI / 180)];
    b.valveArc.setAttribute('d', open < 0.02 ? '' : 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
      'A' + rr + ' ' + rr + ' 0 ' + (300 * open > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1));
    b.drop.setAttribute('opacity', (0.35 + 0.6 * open) * ramp(t, 12.8, 13.2));
    drawTo(b.outLine, span(t, 13.2, 14.2));
    b.beads.forEach((n, i) => {
      if (t < 13.4) { n.setAttribute('opacity', 0); return; }
      const u = ((t - 13.4) * 0.42 + i / b.beads.length) % 1;
      n.setAttribute('cx', lerp(b.gx + 8, b.xout - 14, u).toFixed(1));
      n.setAttribute('cy', b.gy);
      n.setAttribute('opacity', (0.9 * Math.sin(Math.PI * u) * (0.35 + 0.65 * open)).toFixed(3));
    });
    const bh = 60 * open * ramp(t, 13.8, 14.6);
    b.bar.setAttribute('y', (b.gy + 30 - bh).toFixed(1));
    b.bar.setAttribute('height', bh.toFixed(1));
    b.bar.setAttribute('opacity', ramp(t, 13.8, 14.4).toFixed(3));
    b.barTag.setAttribute('opacity', ramp(t, 14.0, 14.6).toFixed(3));

    // panel 3
    const c = actC;
    c.rows.forEach((r, k) => {
      const ap = ramp(t, 14.6 + 0.22 * k, 15.3 + 0.22 * k);
      r.card.setAttribute('opacity', ap.toFixed(3));
      r.tag.setAttribute('opacity', ap.toFixed(3));
      r.bars.forEach((stack, i) => stack.forEach((n) => n.setAttribute('opacity', (0.95 * ramp(t, 14.8 + 0.22 * k + 0.03 * i, 15.4 + 0.22 * k + 0.03 * i)).toFixed(3))));
      const lit = k === 1 ? ramp(t, 17.4, 18.0) : 0;
      r.card.setAttribute('stroke', lit > 0.4 ? C.teal : C.rule);
      r.card.setAttribute('stroke-width', (1 + 1.4 * lit).toFixed(2));
    });
    const sharp = ramp(t, 16.0, 17.6);
    const wts = [0.25 + (0.18 - 0.25) * sharp, 0.25 + (0.42 - 0.25) * sharp, 0.25 + (0.22 - 0.25) * sharp, 0.25 + (0.18 - 0.25) * sharp];
    const piIn = ramp(t, 15.8, 16.4);
    c.piBg.setAttribute('opacity', piIn.toFixed(3));
    c.piTag.setAttribute('opacity', piIn.toFixed(3));
    c.tauTag.setAttribute('opacity', piIn.toFixed(3));
    c.tauTag.textContent = piIn > 0.05 ? 'τ ' + lerp(2.0, 0.1, sharp).toFixed(1) : '';
    let xx = 60;
    const tot = W - 120;
    c.piSeg.forEach((n, k) => {
      n.setAttribute('x', xx.toFixed(1));
      n.setAttribute('width', (tot * wts[k]).toFixed(1));
      n.setAttribute('opacity', piIn.toFixed(3));
      xx += tot * wts[k];
    });
    drawTo(c.des, span(t, 18.2, 19.8));
    c.desDots.forEach((n, i) => n.setAttribute('opacity', ramp(t, 18.3 + 0.13 * i, 18.7 + 0.13 * i).toFixed(3)));
    c.tiles.forEach((n, i) => n.setAttribute('opacity', ramp(t, 18.5 + 0.13 * i, 18.9 + 0.13 * i).toFixed(3)));
    c.score.setAttribute('opacity', ramp(t, 20.4, 21.2).toFixed(3));
    c.score.textContent = '6 of 10 residues recovered, backbone within 0.45 Å';
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
  window.__afArch = { seek: function (t) { stop(); paused = true; frame(t); }, total: T_END, frame: frame };
})();
