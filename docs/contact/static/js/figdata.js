// Chapters of the ConTact architecture animation, which anim/make_arch_anim.py renders from the printed
// figure. Each time is the moment that stage begins in the video.
window.FIGWALK = {
  src: 'static/videos/architecture.mp4',
  poster: 'static/images/architecture_poster.jpg',
  width: 2761, height: 1068,
  alt: 'The ConTact architecture, animated: an equivariant encoder with virtual nodes, distance-biased cross-attention, and a three-stage decoder that fingerprints the binding environment, predicts contacts, and injects contact-gated antigen features into the sequence head.',
  steps: [
    { title: 'Input', t: 0.0,
      text: 'An antibody framework whose CDR-H3 is masked, written here as YFC?????QWG, together with the antigen and the epitope it is asked to target.' },
    { title: 'Encoder', t: 1.15,
      text: 'A relation-aware E(3)-equivariant graph network over the complex. Three virtual nodes, drawn as the star, connect every epitope residue to every loop position, so antigen information reaches the loop in two hops instead of many.' },
    { title: 'Cross-attention', t: 2.6,
      text: 'Loop positions query the antigen. A Gaussian bias on the attention logits, computed from the updated coordinates, favours residues that are spatially close, since a contact is necessarily a neighbour.' },
    { title: 'Stage 1: fingerprint', t: 5.9,
      text: 'A compact fingerprint summarizes the binding environment each position faces. It is trained contrastively against the nearest antigen residue, so it encodes what kind of pocket a position sits against.' },
    { title: 'Stage 2: contacts', t: 7.9,
      text: 'The contact head reads the position embedding, its nearest antigen neighbours, the distance to the antigen and the fingerprint, and predicts which positions will touch. The bars are those probabilities against their threshold.' },
    { title: 'Stage 3: gated injection', t: 10.6,
      text: 'Local antigen features enter each position in proportion to its predicted contact confidence. Where no contact is expected, distant antigen noise is shut out; where one is, the full local chemistry flows in.' },
    { title: 'Designed loop', t: 13.9,
      text: 'The two bypass routes carry the encoder output to the final head, which emits the loop with contact positions weighted up in the cross-entropy, while the contact-recovery loss places the backbone against its native epitope.' },
  ],
};
