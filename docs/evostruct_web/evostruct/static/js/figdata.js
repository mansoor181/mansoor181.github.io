// The walkthrough of the EvoStruct architecture figure. Boxes are in percent of the figure's width and
// height, measured on the printed figure, and the component veils everything outside the active one.
window.FIGWALK = {
  src: 'static/images/architecture.png',
  width: 2600, height: 759,
  alt: 'The EvoStruct architecture: a structural path through a relation-aware equivariant GNN and an evolutionary path through frozen ESM-2, joined by a cross-attention adapter that feeds the sequence head.',
  dwell: 5.2,
  steps: [
    { title: 'Input', box: [1, 36, 15, 62],
      text: 'The antibody-antigen complex, both its coordinates and its sequence. The CDR-H3 positions are masked, so neither path can copy the answer.' },
    { title: 'Structural path', box: [18, 3, 62, 37],
      text: 'A relation-aware E(3)-equivariant GNN encodes the whole complex graph and updates its coordinates. The antigen residues nearest the loop are then cropped as the structural context, which bounds memory and keeps the part that binds.' },
    { title: 'Evolutionary path', box: [18, 60, 50, 99],
      text: 'Frozen ESM-2 reads the heavy chain with the loop masked and returns an embedding for each CDR position. These carry substitution patterns learned from hundreds of millions of sequences, which a few thousand complexes cannot teach.' },
    { title: 'Adapter', box: [65, 20, 85, 74],
      text: 'One cross-attention block with a feed-forward network. The queries come from ESM-2 and the keys and values from the GNN, so structure answers the question the evolutionary representation asks, rather than overwriting it.' },
    { title: 'Sequence head', box: [85, 32, 100, 78],
      text: 'The head stays in ESM-2 embedding space, which is what preserves its calibrated amino acid vocabulary. A coordinate loss supervises the structural path at the same time.' },
  ],
};
