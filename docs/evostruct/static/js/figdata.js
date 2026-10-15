// Chapters of the EvoStruct architecture animation, which anim/make_arch_anim.py renders from the printed
// figure. Each time is the moment that stage begins in the video.
window.FIGWALK = {
  src: 'static/videos/architecture.mp4',
  poster: 'static/images/architecture_poster.jpg',
  width: 2799, height: 1083,
  alt: 'The EvoStruct architecture, animated: an equivariant encoder with virtual nodes and antigen context cropping on one path, a protein language model reading the masked heavy chain on the other, joined by a cross-attention adapter that produces the designed loop.',
  steps: [
    { title: 'Input', t: 0.0,
      text: 'An antibody-antigen complex, and the heavy chain with its CDR-H3 masked out, written here as YFC [mask]..[mask] QWG. Neither path can copy the answer.' },
    { title: 'Equivariant encoder', t: 1.1,
      text: 'The complex becomes a residue graph that a relation-aware E(3)-equivariant network encodes, returning both embeddings and updated coordinates. The virtual nodes, in teal, join the graph through their own learned edges and give distant residues a short path between them.' },
    { title: 'Antigen context', t: 4.2,
      text: 'Only the antigen residues nearest the loop are kept, which bounds the memory the adapter needs while preserving the part that binds. A branch of the same encoder carries its updated coordinates to the predicted structure.' },
    { title: 'Keys and values', t: 6.5,
      text: 'A projection turns the cropped structural context into the keys and values that the adapter will attend over.' },
    { title: 'Language model', t: 8.4,
      text: 'The masked heavy chain goes through ESM, which returns an embedding for each CDR position carrying substitution patterns learned from hundreds of millions of sequences. A second projection turns these into the queries.' },
    { title: 'Cross-attention', t: 11.3,
      text: 'The two priors meet. Queries from the language model attend over keys and values from the structure, so geometry modulates the evolutionary representation rather than overwriting it, and the head stays in the language model space that keeps its amino acid vocabulary calibrated.' },
    { title: 'Designed loop', t: 12.8,
      text: 'The adapter output becomes the designed CDR-H3, written back into the heavy chain in place of the mask.' },
  ],
};
