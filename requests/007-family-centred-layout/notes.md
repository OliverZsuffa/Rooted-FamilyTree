# Implementation notes

## Initial diagnosis

The previous implementation used ELK coordinates as the primary ordering signal, then grouped siblings while preserving that order. It did not actively centre sibling groups beneath their parents. The previous tests checked sibling adjacency and junction placement, but did not assert the key parent-to-children centring requirement.

## Implementation

- Replaced the ELK ordering pass with a deterministic generation-by-generation placement algorithm.
- Groups full and half siblings into connected clusters using recorded biological and adoptive parentage.
- Centres each cluster on the average horizontal centre of its recorded parents, subject to collision-free packing.
- Keeps exact parent-set family junctions distinct.
- Recalculates junction coordinates after the global horizontal shift.
- Preserves manual position precedence in App.tsx without modifying the drag or persistence code.
- Does not read partnership records or infer parentage from them.
- Leaves incompleteness and dark mode implementation untouched.

## Verification outcome

GitHub Actions run 307 completed successfully:
- TypeScript type check passed.
- 54 unit tests passed across 9 test files.
- 10 Playwright browser tests passed.
- Production build passed.
- PWA build verification passed.

An earlier run identified one TypeScript inference issue, which was fixed with an explicit numeric annotation. A subsequent test assertion incorrectly required different generations to use unique x coordinates. That assertion was corrected because vertical generations may legitimately align in the same columns. The corrected suite passed.

## Remaining review

Automated checks pass. A separate visual inspection of the user's populated tree has not been performed. PR #7 remains open for review and has not been merged.
