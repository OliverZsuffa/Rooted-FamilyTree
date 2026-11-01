# Request 005 implementation notes

## Status

Implementation complete on `request/005-family-rendering-and-relationship-finder`. Pull request #5 is open. Awaiting merge after final PR checks.

## Decisions

- Preserved the improved ordering and crossing prevention from Request 004.
- Did not modify the ELK layout algorithm, generation calculation, or person positions.
- Consolidated a partnership into a family junction only when its two people exactly match the two explicitly recorded biological or adoptive parents.
- Rendered the marriage or partnership symbol inside the shared junction and removed the redundant partnership edge for matching groups.
- Kept marriage and partnership records independent from parentage.
- Added a dedicated two-person relationship finder.
- The finder highlights the selected people and connecting family path, describes the relationship from the first person's perspective, supports swapping and clearing, and reports multiple equally short paths.
- Removed the old Family connections list from person details.

## Implementation details

- Added `src/domain/relationshipPath.ts` for shortest relationship path calculation and path metadata.
- Added domain tests for direct partnerships, ancestry paths, unrelated people, same-person selection, ambiguous paths, and sibling-in-law descriptions.
- Updated `src/domain/relationshipEdges.ts` to suppress only partnership edges that are represented by an exact matching two-parent family group.
- Updated the family junction node to display the appropriate marriage or partnership symbol.
- Added the relationship finder to the main tree interface, with searchable datalist inputs, swap, clear, close, and path highlighting.
- Added desktop and mobile browser coverage for the family junction and relationship finder.
- The existing kinship calculation is reused. No derived relationship labels are stored.

## Verification results

Latest GitHub Actions run for commit `90c947d7f9dc58cd2e208c3e07a679980a1c2901`:
- Dependency security check: passed at the repository's configured threshold. Existing 2 low and 8 moderate advisories remain.
- TypeScript: passed.
- Unit tests: passed.
- Playwright desktop and mobile tests: passed.
- Production build: passed.
- PWA verification: passed.

The browser test confirms that the symbol is rendered at the matching family junction, the redundant partnership edge is absent, the relationship finder returns the expected parent or child wording, swapping reverses the wording, and clearing removes the result.

No physical Android device test or independent manual visual inspection has been performed.
