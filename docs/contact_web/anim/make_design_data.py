"""Design data for the ConTact and EvoStruct project pages, taken from the models' own stored outputs.

Each benchmarked run writes one torch file per test complex, holding the designed CDR-H3 sequence, the
deposited one, and the alpha-carbon coordinates of both. This script reads those files and writes a small
json per method with three things: a handful of designed loops next to the deposited sequence and the two
strongest baselines, the amino acid usage over the whole test split, and one complex projected to 2D so a
page can draw the designed loop against the antigen it is meant to bind.

The run for each row of each paper's tables was identified by matching the mean recovery and backbone
error of the stored predictions against the printed table. The mapping is recorded in RUNS below.

Run on jetstream2:
    /media/volume/data2/chimera_env/bin/python3.10 make_design_data.py > design.json
"""
import json, os, sys, csv, collections, math
import numpy as np
import torch
from scipy.spatial import cKDTree
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RES = '/media/volume/data2/chimera/results'
STRUCT = '/media/volume/data2/chimera/data/chimera/structures'
PANEL_ID = '7x7t_H_L_G'     # epitope-group test: a 14 residue CDR-H3, 6 of its positions touching a 187 residue antigen
PANEL_BASELINES = {'raad': 'raad/raad_cdr3_epitope_group', 'mean': 'mean/mean_cdr3_epitope_group',
                   'diffab': 'diffab/diffab_multicdrs_epitope_group'}
PERCOMPLEX = '/home/exouser/chimera/benchmark/analysis/per_complex_all.csv'
AA = 'ACDEFGHIKLMNPQRSTVWY'
CONTACT_CA = 8.0      # the alpha-carbon cutoff the benchmark uses for its interface metrics
BODY_R = 5.6

# run name -> (method label, split), matched to the printed tables by mean AAR and RMSD
RUNS = {
    'contact': {'epitope_group': 'compfirst/v4clean_cascade_nogermline',   # paper row 0.38 / 1.90
                'temporal': 'compfirst/compfirst-retrain-temporal'},        # paper row 0.37 / 1.73
    'evostruct': {'epitope_group': 'evostruct/evostruct-eg-h3',
                  'temporal': 'evostruct/evostruct-tp-h3'},
}
BASELINES = ['raad', 'mean']


# ------------------------------------------------------------------ small helpers
def load_run(run):
    d = os.path.join(RES, run, 'predictions', 'H3')
    out = {}
    for f in sorted(os.listdir(d)):
        r = torch.load(os.path.join(d, f), map_location='cpu', weights_only=False)
        out[f[:-3]] = r
    return out


def usage(seqs):
    c = collections.Counter(''.join(seqs))
    tot = sum(c[a] for a in AA)
    return {a: round(c[a] / tot, 5) for a in AA}


def read_pdb_ca(path):
    return np.array([[float(l[30:38]), float(l[38:46]), float(l[46:54])]
                     for l in open(path) if l.startswith('ATOM') and l[12:16].strip() == 'CA'])


def read_pdb_atoms(path):
    rows = []
    for l in open(path):
        if l.startswith('ATOM') and l[76:78].strip() != 'H':
            rows.append((l[21], l[22:27], l[12:16].strip(),
                         [float(l[30:38]), float(l[38:46]), float(l[46:54])]))
    return rows


def unit(v):
    return v / np.linalg.norm(v)


def resample(p, n, closed=False):
    p = np.asarray(p, float)
    if closed:
        p = np.vstack([p, p[:1]])
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]
    t = np.linspace(0, d[-1], n + (1 if closed else 0))
    q = np.column_stack([np.interp(t, d, p[:, 0]), np.interp(t, d, p[:, 1])])
    return q[:-1] if closed else q


def smooth(p, passes=3, closed=False):
    p = np.asarray(p, float)
    for _ in range(passes):
        if closed:
            p = (np.roll(p, 1, 0) + 2 * p + np.roll(p, -1, 0)) / 4
        else:
            q = p.copy()
            q[1:-1] = (p[:-2] + 2 * p[1:-1] + p[2:]) / 4
            p = q
    return p


def outline(pts2, radius=BODY_R, step=0.55, n=150):
    lo, hi = pts2.min(0) - radius * 2, pts2.max(0) + radius * 2
    gx, gy = np.meshgrid(np.arange(lo[0], hi[0] + step, step), np.arange(lo[1], hi[1] + step, step))
    dist, _ = cKDTree(pts2).query(np.column_stack([gx.ravel(), gy.ravel()]))
    segs = plt.contour(gx, gy, (radius - dist).reshape(gx.shape), levels=[0.0]).allsegs[0]
    plt.close('all')
    rings = [smooth(resample(s, n, closed=True), 3, closed=True) for s in segs if len(s) >= 12]
    return sorted(rings, key=lambda r: -abs(np.cross(r, np.roll(r, -1, 0)).sum()))


def r2(a):
    return np.round(np.asarray(a, float), 2).tolist()


def loop_contacts(cid, loop3):
    """which positions of the deposited loop lie within the interface cutoff of the antigen"""
    pdb, hc, lc, ag = cid.split('_')
    f = f'{STRUCT}/{pdb}.pdb'
    if not os.path.exists(f):
        return None
    agc = np.array([[float(l[30:38]), float(l[38:46]), float(l[46:54])] for l in open(f)
                    if l.startswith('ATOM') and l[12:16].strip() == 'CA' and l[21] == ag])
    if len(agc) == 0:
        return None
    d = np.linalg.norm(loop3[:, None, :] - agc[None, :, :], axis=2).min(1)
    return [bool(x) for x in (d <= CONTACT_CA)]


# ------------------------------------------------------------------ one complex, projected to 2D
def project_complex(cid, designs):
    """the deposited complex, with the deposited loop and every design placed on it"""
    pdb, hc, lc, ag = cid.split('_')
    chains = {}
    for ch, res, at, xyz in read_pdb_atoms(f'{STRUCT}/{pdb}.pdb'):
        chains.setdefault(ch, {}).setdefault(res, {})[at] = xyz

    def ca(ch):
        keys = [k for k in chains[ch] if 'CA' in chains[ch][k]]
        return keys, np.array([chains[ch][k]['CA'] for k in keys])

    hk, hca = ca(hc)
    lk, lca = ca(lc)
    gk, gca = ca(ag)
    heavy = {c: np.array([x for r in chains[c].values() for x in r.values()]) for c in (hc, lc, ag)}

    up = unit(gca.mean(0) - np.vstack([hca, lca]).mean(0))
    side = unit(np.cross(up, np.cross(lca.mean(0) - hca.mean(0), up)))
    ex, ey = np.cross(up, side), up
    if (lca.mean(0) - hca.mean(0)) @ ex < 0:
        ex = -ex
    origin = np.vstack([hca, lca, gca]).mean(0)
    to2d = lambda p: np.column_stack([(np.atleast_2d(np.asarray(p, float)) - origin) @ ex,
                                      (np.atleast_2d(np.asarray(p, float)) - origin) @ ey])

    abtree = cKDTree(np.vstack([heavy[hc], heavy[lc]]))
    epi = [i for i, k in enumerate(gk)
           if abtree.query_ball_point(np.array(list(chains[ag][k].values())), 4.5, return_length=True).sum()]

    # the deposited loop, located on the heavy chain by matching the coordinates the harness stored
    nat3 = np.asarray(designs.pop('__native__'), float)
    d = np.linalg.norm(hca[:, None, :] - nat3[None, :, :], axis=2).min(1)
    h3 = np.where(d < 0.05)[0]
    assert len(h3) == len(nat3), f'{cid}: matched {len(h3)} of {len(nat3)} loop residues on the heavy chain'

    ep3 = gca[epi]
    reach = lambda loop: [int(i) for i in np.where(np.linalg.norm(ep3[:, None, :] - loop[None, :, :], axis=2).min(1) <= CONTACT_CA)[0]]
    contacts = [bool(x) for x in (np.linalg.norm(nat3[:, None, :] - gca[None, :, :], axis=2).min(1) <= CONTACT_CA)]

    loops = {'native': {'xy': r2(smooth(resample(to2d(nat3), 60), 2)), 'reach': reach(nat3), 'rmsd': 0.0}}
    for name, coords in designs.items():
        c = np.asarray(coords, float)
        n = min(len(c), len(nat3))
        loops[name] = {'xy': r2(smooth(resample(to2d(c), 60), 2)), 'reach': reach(c),
                       'rmsd': round(float(np.sqrt(((c[:n] - nat3[:n]) ** 2).sum(1).mean())), 2)}

    return {
        'pdb': pdb.upper(), 'id': cid,
        'chains': {k: {'trace': r2(smooth(resample(to2d(v), 170), 4)), 'body': [r2(o) for o in outline(to2d(v))]}
                   for k, v in (('H', hca), ('L', lca), ('Ag', gca))},
        'epitope': {'body': [r2(o) for o in outline(to2d(gca)[epi], radius=4.6, n=110)],
                    'points': r2(to2d(gca)[epi]), 'n': len(epi)},
        'loops': loops,
        'contacts': contacts,
        'bbox': r2([to2d(np.vstack([hca, lca, gca])).min(0), to2d(np.vstack([hca, lca, gca])).max(0)]),
    }


# ------------------------------------------------------------------ assemble
def main(method):
    eg = load_run(RUNS[method]['epitope_group'])
    tp = load_run(RUNS[method]['temporal'])

    base = collections.defaultdict(dict)
    for row in csv.DictReader(open(PERCOMPLEX)):
        if row['cdr_type'] == 'H3' and row['split'] == 'epitope_group' and row['baseline'] in BASELINES:
            base[row['complex_id']][row['baseline']] = row['pred_sequence']

    # examples spread over the range of recovery, so the strip is not a highlight reel
    ok = [(cid, r) for cid, r in eg.items() if cid in base and len(base[cid]) == len(BASELINES)
          and r['pred_sequence'] and len(r['true_sequence']) >= 8]
    ok.sort(key=lambda kv: -kv[1]['aar'])
    picks = [ok[0], ok[len(ok) // 8], ok[len(ok) // 3], ok[len(ok) // 2], ok[3 * len(ok) // 4], ok[-6]]
    examples = []
    for cid, r in picks:
        ex = {'id': cid, 'native': r['true_sequence'], 'pred': r['pred_sequence'],
              'aar': round(float(r['aar']), 3), 'baselines': {b: base[cid][b] for b in BASELINES}}
        ex['contacts'] = loop_contacts(cid, np.asarray(r['true_coords'], float))
        examples.append(ex)

    cid = PANEL_ID
    rec = eg[cid]
    designs = {'__native__': np.asarray(rec['true_coords'], float), method: np.asarray(rec['pred_coords'], float)}
    skipped = {}
    seqs = {'native': rec['true_sequence'], method: rec['pred_sequence']}
    for b, run in PANEL_BASELINES.items():
        f = os.path.join(RES, run, 'predictions', 'H3', cid + '.pt')
        if not os.path.exists(f):
            continue
        rb = torch.load(f, map_location='cpu', weights_only=False)
        # a method is only comparable here if the harness stored it in the frame of the deposited
        # complex, which we test on the deposited loop itself before drawing anything
        n = min(len(rb['true_coords']), len(rec['true_coords']))
        off = float(np.abs(np.asarray(rb['true_coords'], float)[:n] - np.asarray(rec['true_coords'], float)[:n]).max())
        if off > 0.05:
            skipped[b] = round(off, 2)
            continue
        designs[b] = np.asarray(rb['pred_coords'], float)
        seqs[b] = rb['pred_sequence']
    panel = project_complex(cid, designs)
    panel['sequences'] = seqs
    panel['aar'] = round(float(rec['aar']), 3)
    panel['rmsd'] = round(float(rec['rmsd']), 2)
    panel['skipped'] = skipped

    return {
        'method': method,
        'runs': RUNS[method],
        'n_test': len(eg),
        'examples': examples,
        'usage': {
            'native': usage([r['true_sequence'] for r in eg.values()]),
            method: usage([r['pred_sequence'] for r in eg.values() if r['pred_sequence']]),
            **{b: usage([base[c][b] for c in base if b in base[c] and base[c][b]]) for b in BASELINES},
        },
        'panel': panel,
    }


if __name__ == '__main__':
    print(json.dumps(main(sys.argv[1]), separators=(',', ':')))
