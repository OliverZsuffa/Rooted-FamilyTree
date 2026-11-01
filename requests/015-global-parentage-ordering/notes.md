# Request 015 notes

## Status

Planning and algorithm evaluation only. No application code has been changed. The next step is isolated research and prototyping, not production implementation.

## User clarification

Every child in the user's illustrative naming convention is identified by both parents. For example, CA has parents C and A, while AB and BA both have parents A and B. AB and BA are therefore full siblings with the same exact parent set. The letters are illustrative labels, not sorting keys.

The layout must account for people participating in multiple family units without duplicating their person cards.

## Initial code inspection

The current ordering implementation is in `src/domain/familyTraversal.ts` and `src/domain/layout.ts`. The traversal builds overlapping sibling networks, then orders exact-parent-set subgroups using local heuristics. The resulting order is placed into generation rows without a global optimisation of the complete parentage graph.

## External research summary

- D3 Pedigree Tree uses an iterative pedigree-oriented hill climbing approach that considers average parent and child positions. Its source should be inspected and the method prototyped before deciding whether it fits.
- Sugiyama style layered graph drawing provides a useful general baseline through generation layers, crossing minimisation sweeps, coordinate assignment, and edge routing. It requires explicit family constraints for this application.
- Tores and Barillot (2001) discuss the algorithmic difficulty of drawing complex pedigrees with consanguinity loops and multiple mates. This is a reason not to promise a universally crossing-free result.
- Madeline 2.0 PDE offers further pedigree-specific ideas around consanguinity loops and sibling ordering near related partners.
- PedVis uses a substantially different H-tree representation and is not currently the preferred direction because the existing generation-row presentation should be retained.
- DrawPed demonstrates that specialist pedigree tools also make tradeoffs around complex structures and ordering.

References:
- https://github.com/solgenomics/d3-pedigree-tree
- https://tikz.dev/gd-layered
- https://pubmed.ncbi.nlm.nih.gov/11238074/
- https://academic.oup.com/bioinformatics/article/23/14/1854/189087
- https://pubmed.ncbi.nlm.nih.gov/20975144/
- https://academic.oup.com/nar/article/52/W1/W61/7668056

## Agreed design constraints

- Exact parent-set sibling blocks are hard constraints.
- A person participating in several family units remains one unique node.
- Global topology matters; do not sort each branch independently.
- Do not use alphabetical names, gender, or branch size as ordering signals.
- Preserve the recent connector geometry improvements.
- Preserve manual positions and drag persistence.
- Do not promise zero crossings for arbitrary pedigree graphs.

## Next step

Inspect and prototype candidate algorithms in isolation. Compare the current algorithm, a D3 Pedigree Tree inspired method, and a constrained layered graph method using the same fixtures. Choose a hybrid only if results justify it. Present the evidence and update the implementation proposal before requesting approval for production code changes.
