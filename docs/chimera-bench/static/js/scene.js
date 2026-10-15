// The animated architecture figure of the ChiMERa-Bench page.
//
// Three panels run left to right: the dataset is curated out of SAbDab and released as three splits, one
// held-out complex is annotated with its epitope and its CDR-H3 loop, and a method designs that loop and
// is scored against the deposited one. The molecules are the real coordinates of PDB 7N3C, projected to
// 2D by anim/make_scene_data.py and loaded from scene-data.js, so the figure is drawn from the
// benchmark's own structures. The panels sit side by side on a wide screen and stack on a narrow one.

(function () {
  const S = window.CB_SCENE;
  const host = document.getElementById('cb-scene');
  if (!S || !host) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#1B2433', muted: '#5F6368', rule: '#DFE2E6', panel: '#FAFBFC',
    blue: '#2C6E9B', navy: '#1F4A6B', amber: '#C07820', teal: '#18857A', brick: '#A8443C',
    native: '#2FB3A6', epitope: '#E8A33D', heavy: '#8C8C8C', light: '#E0456B', antigen: '#9AB34A',
    good: '#0072B2', weak: '#8C564B',
  };
  const W = 480, H = 640, GAP = 74;              // one panel, and the space between two panels
  const T_END = 21;

  // ---------------------------------------------------------------- helpers
  const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
  const ease = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const easeOut = (u) => { u = clamp01(u); return 1 - Math.pow(1 - u, 3); };
  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const span = (t, a, b) => clamp01((t - a) / (b - a));
  const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.pow(Math.sin(Math.PI * (t - a) / (b - a)), 2));
  const lerp = (a, b, u) => a + (b - a) * u;
  const fmt = (n) => n.toLocaleString('en-US');
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, cls, extra) {
    const n = el('text', Object.assign({ x: x, y: y, class: cls || 'sc-note' }, extra || {}), parent);
    n.textContent = str;
    return n;
  }
  function poly(points, close) {
    let d = 'M' + points[0][0].toFixed(2) + ' ' + points[0][1].toFixed(2);
    for (let i = 1; i < points.length; i++) d += 'L' + points[i][0].toFixed(2) + ' ' + points[i][1].toFixed(2);
    return close ? d + 'Z' : d;
  }
  function blobPath(r, wobble, seed) {
    const rnd = rng(seed), n = 9, rs = [];
    for (let i = 0; i < n; i++) rs.push(r * (1 - wobble / 2 + rnd() * wobble));
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = (2 * Math.PI * i) / n, a1 = (2 * Math.PI * (i + 1)) / n, am = (a0 + a1) / 2;
      const p0 = [rs[i] * Math.cos(a0), rs[i] * Math.sin(a0)];
      const p1 = [rs[(i + 1) % n] * Math.cos(a1), rs[(i + 1) % n] * Math.sin(a1)];
      const rm = ((rs[i] + rs[(i + 1) % n]) / 2) * 1.18;
      d += (i === 0 ? 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) : '') +
        'Q' + (rm * Math.cos(am)).toFixed(1) + ' ' + (rm * Math.sin(am)).toFixed(1) + ' ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
    }
    return d + 'Z';
  }
  function drawable(node) {
    node.setAttribute('pathLength', 1);
    node.setAttribute('stroke-dasharray', '1 1.01');
    return node;
  }
  const drawTo = (node, u) => node.setAttribute('stroke-dashoffset', (1 - clamp01(u)).toFixed(4));
  const mapAll = (pts, f) => pts.map(f);
  const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);

  function placer(box, w, h, pad, ox, oy) {
    const s = Math.min((w - 2 * pad) / (box[1][0] - box[0][0]), (h - 2 * pad) / (box[1][1] - box[0][1]));
    const cx = (box[0][0] + box[1][0]) / 2, cy = (box[0][1] + box[1][1]) / 2;
    return (p) => [ox + w / 2 + (p[0] - cx) * s, oy + h / 2 - (p[1] - cy) * s];
  }
  const zoomer = (c, s, w, h, ox, oy) => (p) => [ox + w / 2 + (p[0] - c[0]) * s, oy + h / 2 - (p[1] - c[1]) * s];

  // ---------------------------------------------------------------- scaffold
  const svg = el('svg', { xmlns: NS, class: 'cb-scene-svg' }, host);
  const defs = el('defs', {}, svg);
  const root = el('g', {}, svg);
  const arrows = [el('path', { fill: 'none', stroke: C.blue, 'stroke-width': 2.4, 'stroke-opacity': 0.45, 'marker-end': 'url(#cb-arrow)' }, root),
                  el('path', { fill: 'none', stroke: C.blue, 'stroke-width': 2.4, 'stroke-opacity': 0.45, 'marker-end': 'url(#cb-arrow)' }, root)];
  const marker = el('marker', { id: 'cb-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 4.5, markerHeight: 4.5, orient: 'auto' }, defs);
  el('path', { d: 'M0 0 L8 4 L0 8 z', fill: C.blue, 'fill-opacity': 0.45 }, marker);

  function panel(title, sub, step) {
    const g = el('g', {}, root);
    el('rect', { x: 0, y: 0, width: W, height: H, rx: 16, fill: C.panel, stroke: C.rule, 'stroke-width': 1.2 }, g);
    el('circle', { cx: 36, cy: 38, r: 13, fill: C.blue, 'fill-opacity': 0.12 }, g);
    text(g, 36, 43, String(step), 'sc-step', { 'text-anchor': 'middle' });
    text(g, 58, 36, title, 'sc-act');
    text(g, 58, 56, sub, 'sc-sub');
    return g;
  }
  const A = panel('Curate', '20,509 SAbDab entries to 2,922 complexes', 1);
  const B = panel('Annotate', 'one held-out complex: PDB ' + S.pdb, 2);
  const Cg = panel('Design and score', 'the epitope and the framework are given', 3);

  // ---- panel 1: a stream of entries through three gates, then the three splits -----------
  const actA = (function () {
    const g = A;
    const headline = text(g, 26, 112, '20,509', 'sc-count');
    const stage = text(g, 26, 134, 'deposited entries', 'sc-stagelabel');
    const Y0 = 150, Y1 = 386;
    const gates = [
      { p: 0.30, label: 'quality filters', note: 'paired chains, resolution 4.0 Å', left: '9,171' },
      { p: 0.56, label: '95% identity', note: 'MMseqs2 clustering', left: '2,981' },
      { p: 0.82, label: 'validate', note: 'numbering, CDRs, backbone', left: '2,922' },
    ];
    const gateNodes = gates.map((gt) => {
      const y = lerp(Y0, Y1, gt.p);
      el('rect', { x: 26, y: y, width: 236, height: 2.6, rx: 1.3, fill: C.rule }, g);
      const fill = el('rect', { x: 26, y: y, width: 0, height: 2.6, rx: 1.3, fill: C.blue }, g);
      const lab = text(g, 272, y + 2, gt.label, 'sc-gate');
      const note = text(g, 272, y + 18, gt.note, 'sc-note');
      const left = text(g, 454, y + 2, gt.left, 'sc-count-sm', { 'text-anchor': 'end' });
      return { fill: fill, lab: lab, note: note, left: left, y: y, p: gt.p };
    });

    // the entries: a continuous stream, so the loop has no seam. the share deflected at each
    // gate follows the pipeline, where 11,338 then 6,190 then 59 of the 20,509 entries are dropped
    const N = 76, rnd = rng(11), marks = [];
    const cloud = el('g', {}, g);
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const drop = u < 0.553 ? 0 : u < 0.855 ? 1 : u < 0.858 ? 2 : -1;
      marks.push({
        node: el('path', { d: blobPath(4.6 + rnd() * 3.4, 0.55, 100 + i), fill: C.blue, 'fill-opacity': 0.3, stroke: C.blue, 'stroke-width': 0.9, 'stroke-opacity': 0.55 }, cloud),
        x0: 36 + rnd() * 216, drift: (rnd() - 0.5) * 26, off: rnd(), side: rnd() < 0.5 ? -1 : 1,
        lane: Math.floor(rnd() * 3), drop: drop, speed: 0.9 + rnd() * 0.25,
      });
    }

    const lanes = [
      { name: 'Epitope-group', note: 'unseen epitope shapes' },
      { name: 'Antigen-fold', note: 'unseen antigen folds' },
      { name: 'Temporal', note: 'deposited later' },
    ];
    const laneNodes = lanes.map((ln, k) => {
      const y = 452 + k * 56;
      const card = el('rect', { x: 26, y: y, width: 428, height: 46, rx: 11, fill: '#fff', stroke: C.rule, 'stroke-width': 1.1 }, g);
      const edge = el('rect', { x: 26, y: y, width: 4, height: 46, rx: 2, fill: C.teal }, g);
      const nm = text(g, 46, y + 20, ln.name, 'sc-lane');
      const nt = text(g, 46, y + 36, ln.note, 'sc-note');
      const ct = text(g, 436, y + 29, '2,922 / 3', 'sc-count-sm', { 'text-anchor': 'end' });
      ct.textContent = k === 2 ? '2,337 / 292 / 293' : '2,338 / 292 / 292';
      return { card: card, edge: edge, nm: nm, nt: nt, ct: ct, y: y };
    });
    text(g, 26, 432, 'released as three splits, each withholding a different kind of structure', 'sc-note');
    return { headline: headline, stage: stage, gates: gateNodes, marks: marks, lanes: laneNodes, Y0: Y0, Y1: Y1 };
  })();

  // ---- panel 2: the annotated complex ----------------------------------------------------
  const actB = (function () {
    const g = B;
    const put = placer(S.bbox, W, H - 110, 44, 0, 76);
    const clip = el('clipPath', { id: 'cb-clipB' }, defs);
    el('rect', { x: 8, y: 72, width: W - 16, height: H - 104, rx: 12 }, clip);
    const stage = el('g', { 'clip-path': 'url(#cb-clipB)' }, g);

    const agBody = el('path', { d: poly(mapAll(S.chains.Ag.body[0], put), true), fill: C.antigen, 'fill-opacity': 0.2, stroke: C.antigen, 'stroke-width': 1.5, 'stroke-opacity': 0.8, opacity: 0 }, stage);
    const agClip = el('clipPath', { id: 'cb-agclip' }, defs);
    el('path', { d: poly(mapAll(S.chains.Ag.body[0], put), true) }, agClip);
    const epiWrap = el('g', { 'clip-path': 'url(#cb-agclip)', opacity: 0 }, stage);
    el('path', { d: poly(mapAll(S.epitope.body[0], put), true), fill: C.epitope, 'fill-opacity': 0.92, stroke: C.amber, 'stroke-width': 1 }, epiWrap);
    const agTrace = drawable(el('path', { d: poly(mapAll(S.chains.Ag.trace, put)), fill: 'none', stroke: '#6f8438', 'stroke-width': 1.1, 'stroke-opacity': 0.8, 'stroke-linejoin': 'round' }, stage));
    const abBodies = ['H', 'L'].map((ch) => el('path', {
      d: poly(mapAll(S.chains[ch].body[0], put), true), fill: ch === 'H' ? C.heavy : C.light,
      'fill-opacity': 0.15, stroke: ch === 'H' ? C.heavy : C.light, 'stroke-width': 1.3, 'stroke-opacity': 0.65, opacity: 0,
    }, stage));
    const abTraces = ['H', 'L'].map((ch) => drawable(el('path', {
      d: poly(mapAll(S.chains[ch].trace, put)), fill: 'none', stroke: ch === 'H' ? '#79797b' : C.light,
      'stroke-width': 1.05, 'stroke-opacity': 0.8, 'stroke-linejoin': 'round',
    }, stage)));
    const contacts = S.contacts.map((pq) => {
      const a = put(pq[0]), b = put(pq[1]);
      return el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.amber, 'stroke-width': 1.3, 'stroke-dasharray': '2.5 2.5', opacity: 0 }, stage);
    });
    const h3 = drawable(el('path', { d: poly(mapAll(S.h3, put)), fill: 'none', stroke: C.native, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stage));
    const epiGlow = el('path', { d: poly(mapAll(S.epitope.body[0], put), true), fill: 'none', stroke: C.amber, 'stroke-width': 2.6, opacity: 0 }, stage);
    const h3c = put(centroid(S.h3));
    const h3ring = el('circle', { cx: h3c[0], cy: h3c[1], r: 26, fill: 'none', stroke: C.native, 'stroke-width': 1.6, opacity: 0 }, stage);

    function tag(anchorPt, str, color, dir, dx, dy, sub) {
      const gg = el('g', { opacity: 0 }, g);
      const x = anchorPt[0], y = anchorPt[1];
      el('path', { d: 'M' + x + ' ' + y + 'L' + (x + dx) + ' ' + (y + dy), stroke: color, 'stroke-width': 1, 'stroke-opacity': 0.75, fill: 'none' }, gg);
      el('circle', { cx: x, cy: y, r: 2.4, fill: color }, gg);
      const tx = x + dx + (dir === 'end' ? -6 : 6);
      const t = text(gg, tx, y + dy + (sub ? -1 : 4.5), str, 'sc-tag', { 'text-anchor': dir });
      t.setAttribute('fill', color);
      if (sub) text(gg, tx, y + dy + 15, sub, 'sc-note', { 'text-anchor': dir });
      return gg;
    }
    const pick = (pts, f) => put(pts.reduce((a, p) => (f(p) > f(a) ? p : a)));
    const tags = [
      tag(pick(S.chains.Ag.body[0], (p) => p[1]), 'antigen', '#6f8438', 'start', 26, -14),
      tag(pick(S.epitope.body[0], (q) => q[0]), 'epitope', C.amber, 'start', 34, -4, 'residues within 4.5 Å'),
      tag(pick(S.chains.H.body[0], (p) => -p[0]), 'heavy chain', C.heavy, 'end', -26, 96),
      tag(pick(S.chains.L.body[0], (p) => p[0]), 'light chain', C.light, 'start', 24, 34),
      tag(h3c, 'CDR-H3', C.native, 'end', -92, 26, S.h3_length + ' residues, designed'),
    ];
    return { agBody: agBody, agTrace: agTrace, epiWrap: epiWrap, epiGlow: epiGlow, abBodies: abBodies, abTraces: abTraces, contacts: contacts, h3: h3, h3ring: h3ring, tags: tags };
  })();

  // ---- panel 3: the design task and the score --------------------------------------------
  const actCKeys = ['raad', 'dyab'];
  const actC = (function () {
    const g = Cg;
    const VY = 76, VH = 250;                        // the zoom window on the binding site
    el('rect', { x: 20, y: VY, width: W - 40, height: VH, rx: 12, fill: '#fff', stroke: C.rule, 'stroke-width': 1 }, g);
    const clip = el('clipPath', { id: 'cb-clipC' }, defs);
    el('rect', { x: 20, y: VY, width: W - 40, height: VH, rx: 12 }, clip);
    const stage = el('g', { 'clip-path': 'url(#cb-clipC)' }, g);
    // frame on everything the panel has to show: the loop, every design of it, and the epitope patch
    const focus = S.h3.concat(S.epitope.points, [].concat.apply([], actCKeys.map((k) => S.predictions[k])));
    const fbox = [[Math.min.apply(null, focus.map((p) => p[0])), Math.min.apply(null, focus.map((p) => p[1]))],
                  [Math.max.apply(null, focus.map((p) => p[0])), Math.max.apply(null, focus.map((p) => p[1]))]];
    const zoom = placer(fbox, W - 40, VH, 26, 20, VY);

    el('path', { d: poly(mapAll(S.chains.Ag.body[0], zoom), true), fill: C.antigen, 'fill-opacity': 0.18, stroke: C.antigen, 'stroke-width': 1.3, 'stroke-opacity': 0.6 }, stage);
    const agClip = el('clipPath', { id: 'cb-agclip2' }, defs);
    el('path', { d: poly(mapAll(S.chains.Ag.body[0], zoom), true) }, agClip);
    el('path', { d: poly(mapAll(S.epitope.body[0], zoom), true), fill: C.epitope, 'fill-opacity': 0.85, stroke: C.amber, 'stroke-width': 1, 'clip-path': 'url(#cb-agclip2)' }, stage);
    ['H', 'L'].forEach((ch) => el('path', {
      d: poly(mapAll(S.chains[ch].body[0], zoom), true), fill: ch === 'H' ? C.heavy : C.light,
      'fill-opacity': 0.13, stroke: ch === 'H' ? C.heavy : C.light, 'stroke-width': 1.2, 'stroke-opacity': 0.5,
    }, stage));
    el('path', { d: poly(mapAll(S.chains.L.trace, zoom)), fill: 'none', stroke: C.light, 'stroke-width': 1, 'stroke-opacity': 0.55 }, stage);
    S.framework.forEach((f) => el('path', { d: poly(mapAll(f, zoom)), fill: 'none', stroke: '#79797b', 'stroke-width': 1.7, 'stroke-opacity': 0.9, 'stroke-linejoin': 'round' }, stage));

    const e0 = zoom(S.h3[0]), e1 = zoom(S.h3[S.h3.length - 1]);
    const gap = el('path', {
      d: 'M' + e0[0] + ' ' + e0[1] + 'Q' + (e0[0] + e1[0]) / 2 + ' ' + ((e0[1] + e1[1]) / 2 - 42) + ' ' + e1[0] + ' ' + e1[1],
      fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '4 5', opacity: 0,
    }, stage);
    el('circle', { cx: e0[0], cy: e0[1], r: 3, fill: C.muted }, stage);
    el('circle', { cx: e1[0], cy: e1[1], r: 3, fill: C.muted }, stage);
    const native = drawable(el('path', { d: poly(mapAll(S.h3, zoom)), fill: 'none', stroke: C.native, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, stage));
    const shown = [{ key: actCKeys[0], name: 'RAAD', color: C.good }, { key: actCKeys[1], name: 'dyAb', color: C.weak }];
    const preds = shown.map((m) => drawable(el('path', {
      d: poly(mapAll(S.predictions[m.key], zoom)), fill: 'none', stroke: m.color, 'stroke-width': 3.2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0,
    }, stage)));

    // the chip naming the design on screen, the five metric groups, and one measured comparison
    const chip = el('g', { opacity: 0, transform: 'translate(20,' + (VY + VH + 16) + ')' }, g);
    el('rect', { x: 0, y: 0, width: W - 40, height: 34, rx: 10, fill: '#fff', stroke: C.rule }, chip);
    const chipDot = el('circle', { cx: 19, cy: 17, r: 5.5, fill: C.good }, chip);
    const chipTxt = text(chip, 34, 22, '', 'sc-chip');

    const board = el('g', { transform: 'translate(20,' + (VY + VH + 70) + ')' }, g);
    text(board, 0, 0, 'scored on five metric groups', 'sc-sub');
    const rows = [
      { label: 'sequence recovery', note: 'AAR, contact AAR' },
      { label: 'structure', note: 'RMSD, TM-score' },
      { label: 'interface', note: 'Fnat, iRMSD, DockQ' },
      { label: 'epitope specificity', note: 'precision, recall, F1', mark: true },
      { label: 'designability', note: 'liability motifs' },
    ];
    const rowNodes = rows.map((r, k) => {
      const y = 18 + k * 24;
      const dot = el('circle', { cx: 6, cy: y + 7, r: 4.5, fill: r.mark ? C.amber : C.blue, 'fill-opacity': 0.25, stroke: r.mark ? C.amber : C.blue, 'stroke-width': 1.2 }, board);
      const tick = el('path', { d: 'M3.2 ' + (y + 7) + 'l2.2 2.4 4-4.6', fill: 'none', stroke: r.mark ? C.amber : C.blue, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, board);
      const lab = text(board, 20, y + 11, r.label, r.mark ? 'sc-metric is-new' : 'sc-metric');
      const note = text(board, 168, y + 11, r.note, 'sc-note');
      return { dot: dot, tick: tick, lab: lab, note: note, y: y };
    });

    // the epitope residues of the deposited complex, and the ones each loop comes within 8 angstrom of
    const nEpi = S.epitope.points.length;
    const strip = el('g', { transform: 'translate(20,' + (VY + VH + 216) + ')', opacity: 0 }, g);
    el('line', { x1: 0, y1: -14, x2: W - 40, y2: -14, stroke: C.rule, 'stroke-width': 1 }, strip);
    text(strip, 0, 8, 'epitope residues the loop reaches, at 8 \u00c5', 'sc-sub');
    const stripRows = [{ key: 'native', name: 'deposited loop', color: C.native }, { key: null, name: '', color: C.good }].map((r, k) => {
      const y = 28 + k * 24;
      const nm = text(strip, 0, y + 10, r.name, 'sc-metric');
      const dots = [];
      for (let i = 0; i < nEpi; i++) {
        dots.push(el('circle', { cx: 150 + i * 12.4, cy: y + 6, r: 4.5, fill: '#fff', stroke: C.rule, 'stroke-width': 1.2 }, strip));
      }
      const score = text(strip, W - 40, y + 10, '', 'sc-count-sm', { 'text-anchor': 'end' });
      return { nm: nm, dots: dots, score: score, color: r.color, key: r.key };
    });
    return { gap: gap, native: native, preds: preds, shown: shown, rows: rowNodes, chip: chip, chipDot: chipDot, chipTxt: chipTxt, strip: strip, stripRows: stripRows, nEpi: nEpi };
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
  const COUNTS = [[0.0, 20509, 'deposited entries'], [1.8, 9171, 'pass the quality filters'],
                  [2.9, 2981, 'after clustering at 95%'], [3.9, 2922, 'complexes released']];
  function frame(t) {
    // ---- panel 1: the stream runs for the whole loop, the counts roll once at the start
    let i = 0;
    for (let k = 0; k < COUNTS.length; k++) if (t >= COUNTS[k][0]) i = k;
    const from = i === 0 ? 20509 : COUNTS[i - 1][1];
    actA.headline.textContent = fmt(Math.round(lerp(from, COUNTS[i][1], easeOut((t - COUNTS[i][0]) / 0.7))));
    actA.stage.textContent = COUNTS[i][2];
    actA.gates.forEach((gt, k) => {
      const a = 1.5 + k * 1.1;
      gt.fill.setAttribute('width', 236 * ramp(t, a, a + 0.5));
      const o = ramp(t, a - 0.3, a + 0.2);
      [gt.lab, gt.left].forEach((n) => n.setAttribute('opacity', o));
      gt.note.setAttribute('opacity', o * 0.9);
    });
    const PERIOD = 5.2;
    actA.marks.forEach((m) => {
      const p = (((t * m.speed) / PERIOD + m.off) % 1 + 1) % 1;
      const gate = m.drop < 0 ? 1.0 : actA.gates[m.drop].p;
      let x = m.x0 + m.drift * p, y = lerp(actA.Y0, actA.Y1, p), o = 0.95;
      if (p > gate) {
        const q = (p - gate) / Math.max(0.08, 1 - gate);
        if (m.drop < 0) {                               // a survivor slides into one of the three lanes
          const lane = actA.lanes[m.lane];
          x = lerp(x, 150 + m.lane * 60, ease(q));
          y = lerp(y, lane.y + 23, ease(q));
          o = 0.95 * (1 - clamp01((q - 0.55) / 0.45));
        } else {                                        // a dropped entry peels off to the side
          x += m.side * 190 * q * q;
          y += 22 * q;
          o = 0.95 * (1 - clamp01(q / 0.55));
        }
      }
      m.node.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
      m.node.setAttribute('opacity', (o * ramp(t, 0.1 + m.off * 0.6, 0.6 + m.off * 0.6)).toFixed(3));
      const drop = p > gate && m.drop >= 0;
      m.node.setAttribute('fill', drop ? C.brick : C.blue);
      m.node.setAttribute('stroke', drop ? C.brick : C.blue);
    });
    actA.lanes.forEach((ln, k) => {
      const a = 0.5 + k * 0.2;
      const o = ramp(t, a, a + 0.5);
      [ln.card, ln.edge, ln.nm, ln.nt, ln.ct].forEach((n) => n.setAttribute('opacity', o));
      const hi = k === 0 ? bump(t, 4.6, 6.2) : 0;       // the split this complex is held out of
      ln.card.setAttribute('stroke', hi > 0.3 ? C.teal : C.rule);
      ln.edge.setAttribute('width', 4 + 3 * hi);
    });

    // ---- panel 2: the complex is drawn once early, then its annotation is called out
    const b0 = 0.4;
    actB.agBody.setAttribute('opacity', ramp(t, b0, b0 + 0.6));
    drawTo(actB.agTrace, span(t, b0 + 0.2, b0 + 1.3));
    actB.abBodies.forEach((n, k) => n.setAttribute('opacity', ramp(t, b0 + 0.5 + k * 0.2, b0 + 1.2 + k * 0.2)));
    actB.abTraces.forEach((n, k) => drawTo(n, span(t, b0 + 0.7 + k * 0.2, b0 + 1.9 + k * 0.2)));
    drawTo(actB.h3, span(t, b0 + 1.5, b0 + 2.2));
    actB.epiWrap.setAttribute('opacity', ramp(t, b0 + 1.9, b0 + 2.6));
    actB.tags.forEach((n, k) => n.setAttribute('opacity', ramp(t, b0 + 1.0 + k * 0.35, b0 + 1.5 + k * 0.35)));
    // its turn: the interface contacts flash, the epitope patch glows, the designed loop is circled
    const bb = 6.6;
    actB.contacts.forEach((n, k) => {
      const a = bb + k * 0.06;
      n.setAttribute('opacity', (0.25 + 0.72 * bump(t, a, a + 1.8)).toFixed(3));
    });
    actB.epiGlow.setAttribute('opacity', (0.85 * bump(t, bb + 1.4, bb + 3.0)).toFixed(3));
    actB.h3ring.setAttribute('opacity', (0.8 * bump(t, bb + 3.2, bb + 4.6)).toFixed(3));
    actB.h3ring.setAttribute('r', lerp(32, 21, ease((t - (bb + 3.2)) / 1.4)));

    // ---- panel 3: the deposited loop is the resting state, two designs take their turn against it
    const c0 = 12.3;
    const erased = ramp(t, c0, c0 + 0.45) * (1 - ramp(t, c0 + 6.4, c0 + 7.0));
    actC.gap.setAttribute('opacity', (ramp(t, c0, c0 + 0.5) * (1 - ramp(t, c0 + 1.4, c0 + 1.9))).toFixed(3));
    const onDesign = t > c0 + 1.4 && t < c0 + 6.6;
    const which = t < c0 + 3.9 ? 0 : 1;
    const m = actC.shown[which], met = S.metrics[m.key];
    actC.preds.forEach((n, k) => {
      const a = c0 + 1.6 + k * 2.3;
      const out = k === 0 ? 1 - 0.85 * ramp(t, a + 2.1, a + 2.6) : 1 - ramp(t, c0 + 6.3, c0 + 6.8);
      n.setAttribute('opacity', (ramp(t, a, a + 0.2) * out).toFixed(3));
      drawTo(n, span(t, a, a + 0.9));
    });
    drawTo(actC.native, span(t, 1.4, 2.3));
    actC.native.setAttribute('opacity', (lerp(1, 0.3, erased) * ramp(t, 1.4, 1.8)).toFixed(3));
    actC.native.setAttribute('stroke-width', lerp(3.4, 2.2, erased).toFixed(2));
    actC.chip.setAttribute('opacity', (ramp(t, c0 + 1.7, c0 + 2.1) * (1 - ramp(t, c0 + 6.4, c0 + 6.9))).toFixed(3));
    actC.chipDot.setAttribute('fill', m.color);
    actC.chipTxt.textContent = m.name + ' designs ' + met.seq + ', ' + Math.round(met.aar * 100) + '% recovered';
    actC.rows.forEach((r, k) => {
      const a = 1.0 + k * 0.17;
      const o = ramp(t, a, a + 0.4);
      [r.lab, r.note].forEach((n) => n.setAttribute('opacity', o));
      r.dot.setAttribute('opacity', o * 0.9);
      r.tick.setAttribute('opacity', ramp(t, a + 0.3, a + 0.6));
    });
    // the measured comparison: the epitope residues each loop comes within 8 angstrom of
    actC.strip.setAttribute('opacity', ramp(t, 2.0, 2.6));
    actC.stripRows.forEach((r, k) => {
      const design = k === 1;
      const set = design ? (onDesign ? S.epitope_reach[m.key] : []) : S.epitope_reach.native;
      const color = design ? m.color : C.native;
      const a = design ? c0 + 2.0 : 2.6;
      const lit = Math.round(actC.nEpi * ramp(t, a, a + 0.9));
      r.dots.forEach((d, idx) => {
        const on = set.indexOf(idx) >= 0 && idx < lit;
        d.setAttribute('fill', on ? color : '#fff');
        d.setAttribute('stroke', on ? color : C.rule);
      });
      r.nm.textContent = design ? (onDesign ? m.name : 'a designed loop') : 'deposited loop';
      r.nm.setAttribute('fill', design && onDesign ? color : (design ? C.muted : C.navy));
      r.score.textContent = design && !onDesign ? '' : set.length + ' of ' + actC.nEpi;
      r.score.setAttribute('opacity', ramp(t, a + 0.7, a + 1.1));
    });
  }

  // ---------------------------------------------------------------- run
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
    frame(T_END - 1.6);
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
  window.__cbScene = { seek: function (t) { stop(); paused = true; frame(t); }, total: T_END, frame: frame };
})();
