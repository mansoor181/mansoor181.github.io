# ConTact project page

`contact/` is the deployable page, built on the [Academic Project Page](https://github.com/eliahuhorwitz/Academic-project-page-template) template (Bulma, CC BY-SA 4.0), in the family of the ChiMERa-Bench and EvoStruct pages. Copy the folder into the root of the `mansoor181.github.io` repository and it is served at `https://mansoor181.github.io/contact/`. The canonical and social-preview URLs assume that folder name, and the page cross-links to `/chimera-bench/` and `/evostruct/`.

The whole page is 0.9 MB, because it carries no video and no icon font: the icons are inline SVG and both animations run in the browser.

## Layout

| path | contents |
|---|---|
| `contact/index.html` | the page |
| `contact/static/images/architecture.png` | Figure 1 of the paper, extracted from the arXiv HTML and trimmed |
| `contact/static/js/figwalk.js`, `figdata.js` | the guided walkthrough of the architecture figure, and the steps it walks |
| `contact/static/js/designs.js`, `designdata.js` | the designs section, and the data it draws |
| `contact/static/css/index.css`, `static/js/index.js` | the page's style and the shared page script |
| `anim/make_design_data.py` | reads the stored per-complex outputs on jetstream2 and writes `designdata.js` |

## The architecture walkthrough

The figure is the one printed in the paper, untouched. `figwalk.js` lays an SVG over it, veils everything outside the part under discussion, frames that part, and prints a caption under the figure. The steps advance on their own and loop, the row of buttons jumps to any of them, and a click on the figure pauses it. `prefers-reduced-motion` leaves the figure unveiled.

Steps are declared in `figdata.js` as boxes in percent of the figure's width and height, so retuning one is a two-number edit. To measure a new box, overlay a grid:

```python
from PIL import Image, ImageDraw
im = Image.open('contact/static/images/architecture.png').convert('RGB'); W, H = im.size
d = ImageDraw.Draw(im)
for i in range(1, 20): d.line([(W*i/20, 0), (W*i/20, H)], fill=(255,120,120)); d.text((W*i/20+3, 4), str(i*5), fill=(200,0,0))
for j in range(1, 10): d.line([(0, H*j/10), (W, H*j/10)], fill=(150,150,255)); d.text((4, H*j/10+2), str(j*10), fill=(0,0,200))
im.save('/tmp/grid.png')
```

The figure itself came from the arXiv HTML, since the draw.io export is not on disk:

```bash
curl -L -o contact.drawio.png https://arxiv.org/html/2605.21600v3/figures/contact.drawio.png
# then trim the white margin and resize to 2600 px wide
```

## The designs section

Three views, all read from the per-complex outputs the evaluation harness stored, so nothing is redrawn by hand:

1. one designed loop placed on its antigen, next to the deposited loop and a baseline,
2. designed sequences against the deposited ones, with matches shaded and antigen-contacting positions underlined,
3. the amino acid usage of every design in the split.

`anim/make_design_data.py` builds all of it on jetstream2, where the predictions live:

```bash
scp anim/make_design_data.py jetstream2:/media/volume/data2/chimerax_1.12/work/
ssh jetstream2 '/media/volume/data2/chimera_env/bin/python3.10 /media/volume/data2/chimerax_1.12/work/make_design_data.py contact > /tmp/design_contact.json'
scp jetstream2:/tmp/design_contact.json /dev/shm/
python3 -c "import json; d=json.load(open('/dev/shm/design_contact.json')); open('contact/static/js/designdata.js','w').write('window.CB_DESIGN = '+json.dumps(d,separators=(',',':'))+';')"
```

Three things that script gets right and are easy to get wrong:

- **Which run is which row.** There are 97 ConTact run directories. The script records in `RUNS` the two whose mean recovery and backbone error reproduce the printed table: `v4clean_cascade_nogermline` is the ConTact row of the epitope-group table (0.377 and 1.909 against the printed 0.38 and 1.90) and `v4clean_cascade_epi` is ConTact-G (0.407 and 1.912 against 0.41 and 1.92). The whole ablation table maps onto the other `v4clean_*` runs the same way.
- **Frames.** A design can only be drawn against the deposited complex if the harness stored it in that frame. The script checks each method on the deposited loop itself and skips any whose coordinates disagree by more than 0.05 Angstrom. DiffAb fails that check on this complex, by 6.6 Angstrom, so it is left out of the picture rather than quietly misplaced.
- **Which complex.** `PANEL_ID` is chosen for a loop that actually engages its epitope. The first pick had only one of seventeen positions in contact, which makes a poor illustration of a contact-first method. 7X7T has six of fourteen.

## Checking the page

Headless Firefox screenshots fail silently on chimera4, so use Chromium through Playwright, installed into `/dev/shm` because the root disk is full:

```bash
/media/volume/data/chimera_env/bin/python3 -m pip install --target /dev/shm/pwlib playwright
PYTHONPATH=/dev/shm/pwlib PLAYWRIGHT_BROWSERS_PATH=/dev/shm/pwbrowsers \
  /media/volume/data/chimera_env/bin/python3 -m playwright install chromium
/media/volume/data/chimera_env/bin/python3 -m http.server -d contact 8788
```

`window.__figwalk.goTo(i)` jumps the walkthrough to a step, which makes a screenshot of any step reproducible.

## Placeholders to fill before publishing

- Only Mansoor Ahmed's name links to a homepage. The placeholder is marked with an HTML comment in `index.html`.
- The cross-links to `/chimera-bench/` and `/evostruct/` resolve once those two folders are published alongside this one.
