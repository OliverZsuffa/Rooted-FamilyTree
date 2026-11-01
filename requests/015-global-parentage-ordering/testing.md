# Request 015 testing checklist

## Stage 1: Isolated algorithm comparison

- [ ] Inspect D3 Pedigree Tree source and document its graph and ordering assumptions.
- [ ] Reproduce its relevant parent and child position heuristic in an isolated prototype.
- [ ] Implement a constrained layered ordering prototype using downward and upward sweeps.
- [ ] Compare the current algorithm and candidate algorithms on identical fixtures.
- [ ] Test a hybrid only if evidence suggests it may improve results.
- [ ] Record crossing counts between adjacent generations.
- [ ] Record exact-parent-set sibling block integrity.
- [ ] Record shared-person uniqueness and branch coherence.
- [ ] Record deterministic behaviour under equivalent input permutations.
- [ ] Record runtime and evaluation counts.
- [ ] Recommend an algorithm based on the results, not intuition alone.

## Structural fixtures

- [ ] Corrected CA / AB / BA fixture uses both parents for every child.
- [ ] AB and BA remain a contiguous exact-parent-set sibling block.
- [ ] CA remains in its distinct exact-parent-set group.
- [ ] Shared people appear once even when they participate in multiple family units.
- [ ] Half-sibling networks remain readable without breaking exact-parent-set blocks.
- [ ] Multi-generation branches remain coherent.
- [ ] Cousins and collateral descendants remain included.
- [ ] Pedigree collapse does not duplicate people.
- [ ] Partnerships do not imply parentage.
- [ ] Gender does not affect ordering.

## Optimisation and stability

- [ ] Global crossing objective is measured on adjacent-generation parentage edges.
- [ ] Branch separation and family-unit proximity are evaluated globally.
- [ ] Hard constraints cannot be traded away for soft objective improvements.
- [ ] Repeated runs are deterministic.
- [ ] Equivalent input permutations do not cause arbitrary reordering.
- [ ] Optimisation has bounded runtime and a valid best-so-far fallback.
- [ ] Comparison fixtures demonstrate the selected approach's strengths and limitations against the current algorithm.

## Geometry and regressions after implementation

- [ ] Cards do not overlap.
- [ ] Junctions do not overlap cards.
- [ ] Relationship lines do not pass through cards.
- [ ] Existing connector improvements remain intact.
- [ ] Generation bands remain unchanged.
- [ ] Manual positions and drag persistence remain unchanged.
- [ ] Incompleteness and dark mode remain unchanged.
- [ ] Import/export remains unchanged.

## Verification after implementation

- [ ] TypeScript type checking.
- [ ] Full unit test suite.
- [ ] Playwright desktop tests.
- [ ] Playwright mobile tests.
- [ ] Production build.
- [ ] PWA verification.
- [ ] Visual inspection of representative multigenerational trees.
- [ ] Actual populated family tree reviewed, or explicitly recorded as outstanding.

## Results

To be completed during the relevant stage. Research and prototype results must be recorded before application implementation is proposed.
