# Request 015 testing checklist

## Status

Planning only. No application code has been changed and no tests have been run.

## Structural ordering

- [ ] Corrected CA / AB / BA parentage fixture uses both parents for every child.
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
- [ ] Comparison fixtures demonstrate improvement over the current algorithm.

## Geometry and regressions

- [ ] Cards do not overlap.
- [ ] Junctions do not overlap cards.
- [ ] Relationship lines do not pass through cards.
- [ ] Existing connector improvements remain intact.
- [ ] Generation bands remain unchanged.
- [ ] Manual positions and drag persistence remain unchanged.
- [ ] Incompleteness and dark mode remain unchanged.
- [ ] Import/export remains unchanged.

## Verification

- [ ] TypeScript type checking.
- [ ] Full unit test suite.
- [ ] Playwright desktop tests.
- [ ] Playwright mobile tests.
- [ ] Production build.
- [ ] PWA verification.
- [ ] Visual inspection of representative multigenerational trees.
- [ ] Actual populated family tree reviewed, or explicitly recorded as outstanding.

## Results

To be completed after implementation.