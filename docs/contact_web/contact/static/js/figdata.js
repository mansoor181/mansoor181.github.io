// The walkthrough of the ConTact architecture figure. Boxes are in percent of the figure's width and
// height, measured on the printed figure, and the component veils everything outside the active one.
window.FIGWALK = {
  src: 'static/images/architecture.png',
  width: 2600, height: 983,
  alt: 'The ConTact architecture: an equivariant encoder, distance-biased cross-attention, and a three-stage decoder that fingerprints the binding environment, predicts contacts, and injects contact-gated antigen features into the sequence head.',
  dwell: 5.0,
  steps: [
    { title: 'Input', box: [0, 26, 13.5, 73],
      text: 'An antibody framework whose CDR-H3 is masked, written here as YFC?????QWG, together with the antigen and the epitope it is asked to target.' },
    { title: 'Encoder', box: [13, 20, 23.5, 63],
      text: 'A relation-aware E(3)-equivariant graph network over the complex. Three virtual nodes, drawn as the star, connect every epitope residue to every loop position, so antigen information reaches the loop in two hops instead of many.' },
    { title: 'Cross-attention', box: [23, 28, 35.5, 63],
      text: 'Loop positions query the antigen. A Gaussian bias on the attention logits, computed from the updated coordinates, favours residues that are spatially close, since a contact is necessarily a neighbour.' },
    { title: 'Stage 1: fingerprint', box: [33.5, 31, 55, 61],
      text: 'A compact fingerprint summarizes the binding environment each position faces. It is trained contrastively against the nearest antigen residue, so it encodes what kind of pocket a position sits against.' },
    { title: 'Stage 2: contacts', box: [40, 2, 79, 92],
      text: 'The contact head reads the position embedding, its nearest antigen neighbours, the distance to the antigen and the fingerprint, and predicts which positions will touch. A focal loss handles the imbalance between contacts and the rest.' },
    { title: 'Stage 3: gated injection', box: [68, 16, 80, 64],
      text: 'Local antigen features enter each position in proportion to its predicted contact confidence. Where no contact is expected, distant antigen noise is shut out; where one is, the full local chemistry flows in.' },
    { title: 'Designed loop', box: [80, 12, 100, 78],
      text: 'The sequence head emits the loop, with contact positions weighted up in the cross-entropy, and the contact-recovery loss places the designed backbone against its native epitope.' },
  ],
};
