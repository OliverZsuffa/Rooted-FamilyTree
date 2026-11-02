# Request 015 notes

## Current implementation status

The constrained layered optimiser is implemented in `src/domain/familyTraversal.ts`. It preserves exact-parent-set sibling blocks, treats parentless people as singleton blocks, uses bounded alternating generation sweeps, and accepts only globally improving candidate row orders. The global score minimises adjacent-generation parentage crossings first and edge span second. Crossing counting uses a Fenwick tree to avoid quadratic pair counting.

Regression tests for the corrected CA / AB / BA topology and shared people were added to `src/domain/layout.test.ts`.

The work is proposed in PR #15. Local execution was not possible in the current environment because GitHub could not be reached from the shell, and no PR workflow runs were returned by the repository integration. Type checking, unit tests, browser tests, production build, PWA verification, and visual inspection therefore remain unverified. Do not merge until these checks have been run and the actual family tree has been reviewed.

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


## Stage 1 research and prototype results

### Source inspection: D3 Pedigree Tree

Inspected the published source at https://github.com/solgenomics/d3-pedigree-tree/blob/f799b499c8019cfccd550d4297196e365c208d5c/src/d3-pedigree-tree.js.

The implementation confirms that its method is more specific than a generic tree sort:

- It creates one node per person and derives a sibling group from the complete parent list.
- It can treat parent order as significant or canonicalise it with `parentsOrdered(false)`. This application must use canonical parent sets, not relationship insertion order.
- It initialises vertical positions within generations, then repeatedly calculates each node's target position from the mean positions of its immediate parents and children.
- It sorts sibling groups by their mean target position, then resolves collisions while retaining spacing.
- It can insert temporary intermediate nodes for edges spanning generations.
- The number of sorting iterations is configurable.

Important limitations for this project:

- The algorithm uses a local average-neighbour target and does not explicitly calculate a global crossing objective before accepting a move.
- Its default sibling grouping is based on ordered parent arrays unless configured otherwise.
- Its implementation assumes a single level assignment and is not a drop-in replacement for this app's generation calculation, family junction model, manual positions, or connector geometry.
- It is an older D3 plugin with an older dependency stack. Reusing the algorithmic idea is more sensible than introducing the package as a production dependency.

### Current implementation findings confirmed

The current application does already perform a bottom-up ancestry traversal followed by a downward expansion. It is therefore not accurate to describe it as having no global traversal at all.

The remaining weakness is in how row order is chosen:

- Overlapping sibling networks are joined when children share a parent.
- Exact-parent-set groups inside those networks are then ordered using group size and parent-set IDs.
- Parent clusters use a local count of how many distinct exact parent sets each person participates in.
- The resulting arrangement is not repeatedly evaluated against a whole-graph crossing objective.

This distinction matters: Request 015 should improve the ordering objective and optimisation process, not discard the useful ancestry traversal and collateral-descendant expansion.

### Isolated prototype

A small independent prototype compared four variants on five synthetic fixtures:

1. A stable ID-seeded baseline using exact-parent-set sibling blocks.
2. A D3-inspired repeated average-neighbour ordering.
3. A constrained layered approach using downward and upward barycenter sweeps.
4. A global pairwise block-swap search that accepts only improvements to a lexicographic score of crossings followed by edge span.

All candidates used the same generated generations and parentage edges. Exact-parent-set sibling groups were treated as indivisible blocks. People without recorded parents were treated as independent singleton blocks, since an empty parent set is not evidence that unrelated root people are siblings.

Observed crossing counts in the prototype:

| Fixture | Stable baseline | D3-inspired | Layered sweeps | Global block swaps |
|---|---:|---:|---:|---:|
| Corrected CA / AB / BA | 5 | 1 | 1 | 1 |
| Shared parent across three family units | 3 | 1 | 1 | 1 |
| Overlapping half siblings | 3 | 1 | 1 | 1 |
| Multi-generation cousin branches | 2 | 2 | 2 | 2 |
| Pedigree collapse | 1 | 1 | 1 | 1 |

The candidate methods produced these useful arrangements:

- In the corrected example, AB and BA stayed adjacent as a single exact-parent-set block, while CA stayed a separate block.
- In the shared-parent fixture, the shared person remained one node and the parent row could be repositioned relative to the three partner branches.
- In the overlapping half-sibling fixture, exact-parent-set blocks remained intact while the parent row was reordered to better match the child row.
- In the cousin and pedigree-collapse fixtures, all people remained unique and the existing topology did not require a different ordering to reduce the measured crossings.

After canonicalising initial block order and using stable IDs only for equivalent ties, both iterative candidates produced identical results under reversed person and parentage insertion order on all five fixtures.

### Interpretation and limitations

These are prototype results, not measurements from the production TypeScript implementation and not proof of improvement on the user's actual family data.

The baseline is a deliberately simple stable-order reference, not a byte-for-byte execution of the current `buildFamilyTraversal` implementation. The prototype also uses small synthetic graphs and a basic pairwise edge-crossing counter. It does not yet model card widths, junction positions, connector routing, manual coordinates, or all partnership proximity behaviour.

The D3-inspired and layered methods tied on these fixtures. This means the evidence does not justify adopting the D3 algorithm wholesale. The more important difference is that a layered sweep can be combined with an explicit global objective and hard constraints, while the D3 method's average-neighbour score alone does not guarantee that a candidate move improves the whole drawing.

### Recommendation for the implementation proposal

Retain the existing ancestry component discovery and downward collateral expansion. Replace only the row-order selection stage with a constrained, iterative layered optimiser:

1. Represent each exact-parent-set sibling group as an indivisible block. Keep people with no recorded parents as individual blocks.
2. Use D3's average-neighbour idea as a candidate ordering signal, not as the acceptance criterion.
3. Sweep downward and upward across generations, considering parent and child neighbours.
4. Evaluate proposed block moves against a global lexicographic objective. First preserve all hard structural constraints, then minimise parentage crossings, then improve edge span and family-unit coherence.
5. Accept a move only when the global objective improves. Use deterministic stable tie-breaking for genuinely equivalent arrangements.
6. Bound sweeps and candidate evaluations, retaining the best valid ordering.

The prototype supports this as the strongest next direction, but the final objective and move set still need to be specified in the implementation plan. No production code or dependency has been changed.
