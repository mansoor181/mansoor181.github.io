# EvoStruct project page

`evostruct/` is the deployable page, built on the [Academic Project Page](https://github.com/eliahuhorwitz/Academic-project-page-template) template (Bulma, CC BY-SA 4.0), in the family of the ChiMERa-Bench and ConTact pages. Copy the folder into the root of the `mansoor181.github.io` repository and it is served at `https://mansoor181.github.io/evostruct/`. The canonical and social-preview URLs assume that folder name, and the page cross-links to `/chimera-bench/` and `/contact/`.

The whole page is 0.9 MB, because it carries no video and no icon font: the icons are inline SVG and both animations run in the browser.

## Layout

| path | contents |
|---|---|
| `evostruct/index.html` | the page |
| `evostruct/static/images/architecture.png` | Figure 1 of the paper, rendered out of the arXiv PDF |
| `evostruct/static/images/vocab.png`, `pairs.png`, `positional.jpg` | the three result figures, from the arXiv HTML |
| `evostruct/static/js/figwalk.js`, `figdata.js` | the guided walkthrough of the architecture figure, and the steps it walks |
| `evostruct/static/js/designs.js`, `designdata.js` | the designs section, and the data it draws |
| `evostruct/static/css/index.css`, `static/js/index.js` | the page's style and the shared page script |
| `anim/make_design_data.py` | reads the stored per-complex outputs on jetstream2 and writes `designdata.js` |

## The architecture walkthrough

The figure is the one printed in the paper, untouched. `figwalk.js` lays an SVG over it, veils everything outside the part under discussion, frames that part, and prints a caption under the figure. The steps advance on their own and loop, the row of buttons jumps to any of them, and a click on the figure pauses it. `prefers-reduced-motion` leaves the figure unveiled.

Steps are declared in `figdata.js` as boxes in percent of the figure's width and height, so retuning one is a two-number edit. To measure a new box, overlay a grid:

```python
from PIL import Image, ImageDraw
im = Image.open('evostruct/static/images/architecture.png').convert('RGB'); W, H = im.size
d = ImageDraw.Draw(im)
for i in range(1, 20): d.line([(W*i/20, 0), (W*i/20, H)], fill=(255,120,120)); d.text((W*i/20+3, 4), str(i*5), fill=(200,0,0))
for j in range(1, 10): d.line([(0, H*j/10), (W, H*j/10)], fill=(150,150,255)); d.text((4, H*j/10+2), str(j*10), fill=(0,0,200))
im.save('/tmp/grid.png')
```

Neither the draw.io export nor a built PDF of this paper is on disk, and the arXiv HTML leaves Figure 1 out, so the figure was rendered out of the arXiv PDF, where it is vector rather than raster:

```bash
curl -L -o evostruct.pdf https://arxiv.org/pdf/2605.21485v1
pdftoppm -png -f 4 -l 4 -r 400 evostruct.pdf hi      # the page the figure sits on
# then crop the band above the caption, trim to the ink, and resize to 2600 px wide
```

## The designs section

Three views, all read from the per-complex outputs the evaluation harness stored, so nothing is redrawn by hand:

1. one designed loop placed on its antigen, next to the deposited loop and a baseline,
2. designed sequences against the deposited ones, with matches shaded and antigen-contacting positions underlined,
3. the amino acid usage of every design in the split.

`anim/make_design_data.py` builds all of it on jetstream2, where the predictions live:

```bash
scp anim/make_design_data.py jetstream2:/media/volume/data2/chimerax_1.12/work/
ssh jetstream2 '/media/volume/data2/chimera_env/bin/python3.10 /media/volume/data2/chimerax_1.12/work/make_design_data.py evostruct > /tmp/design_evostruct.json'
scp jetstream2:/tmp/design_evostruct.json /dev/shm/
python3 -c "import json; d=json.load(open('/dev/shm/design_evostruct.json')); open('evostruct/static/js/designdata.js','w').write('window.CB_DESIGN = '+json.dumps(d,separators=(',',':'))+';')"
```

Three things that script gets right and are easy to get wrong:

- **Which run.** The page uses `evostruct-eg-h3`, the epitope-group CDR-H3 run. Unlike ConTact, no stored run reproduces the printed table exactly: the closest on recovery is `evostruct` at 0.414 against the printed 0.43, and the closest on backbone error is `evostruct-eg-h3` at 1.97 against 1.84. For that reason the designs section carries no aggregate claim of its own, and the amino acid counts it shows are labelled as measured here rather than as the effective-vocabulary figures the paper reports.
- **Frames.** A design can only be drawn against the deposited complex if the harness stored it in that frame. The script checks each method on the deposited loop itself and skips any whose coordinates disagree by more than 0.05 Angstrom. DiffAb fails that check on this complex, by 6.6 Angstrom, so it is left out of the picture rather than quietly misplaced.
- **Which complex.** `PANEL_ID` is chosen for a loop that actually engages its epitope. The first pick had only one of seventeen positions in contact, which makes a poor illustration of a contact-first method. 7X7T has six of fourteen.

## Checking the page

Headless Firefox screenshots fail silently on chimera4, so use Chromium through Playwright, installed into `/dev/shm` because the root disk is full:

```bash
/media/volume/data/chimera_env/bin/python3 -m pip install --target /dev/shm/pwlib playwright
PYTHONPATH=/dev/shm/pwlib PLAYWRIGHT_BROWSERS_PATH=/dev/shm/pwbrowsers \
  /media/volume/data/chimera_env/bin/python3 -m playwright install chromium
/media/volume/data/chimera_env/bin/python3 -m http.server -d evostruct 8789
```

`window.__figwalk.goTo(i)` jumps the walkthrough to a step, which makes a screenshot of any step reproducible.

## Placeholders to fill before publishing

- Only Mansoor Ahmed's name links to a homepage. The placeholder is marked with an HTML comment in `index.html`.
- The cross-links to `/chimera-bench/` and `/evostruct/` resolve once those two folders are published alongside this one.
