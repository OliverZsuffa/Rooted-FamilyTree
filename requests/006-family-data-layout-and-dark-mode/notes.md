# Request 006 notes

## Status

Planning only. No application code has been changed and no tests have been run.

## Confirmed requirements

- The current improved ordering must be preserved as the starting point.
- The family layout should group siblings and centre them beneath their parents.
- Parent positioning is a global compromise when a person belongs to multiple family groups.
- The user identified edge crossings, lines through cards, and awkward family positioning as layout problems.
- Incomplete people use both a red border and light red background.
- Automatic and manual incompleteness are independent.
- No incompleteness overview or dashboard.
- The editor must expose the original name while cards can display the current married name.
- Name change effective dates are not needed.
- Partial date precision is required.
- Gender is empty by default and shown subtly on person cards.
- Great aunt and related extended kinship terms should be calculated and displayed as real kinship labels.
- Dark mode is required.

## Existing architecture observations

- `src/domain/kinship.ts` already calculates several kinship labels from parentage, but aunt and uncle detection only checks siblings of the subject's immediate parents. This misses a grandparent's sibling, which is a great aunt or great uncle.
- The same module currently returns the generic label `cousin` without degree or removal.
- `src/domain/relationshipPath.ts` can fall back to generic connection descriptions even when richer kinship terminology should be available.
- `src/domain/schema.ts` currently stores one person name and full ISO dates. Name history and partnership name changes include effective dates.
- `src/styles.css` currently defines a light paper palette with many hardcoded light surfaces. Dark mode therefore needs a systematic theme token pass, not a simple background colour change.
- Existing family grouping is based on exact parent sets and should remain the structural basis for sibling groups.

## Important implementation caution

Great aunt, cousin, and similar terms should normally be derived from the existing family graph, not stored as separate relationship records. A separately stored great aunt edge could become inconsistent when parentage changes.

No implementation or test result should be recorded here until work is approved and completed.


## Implementation progress

Implementation is being developed on `request/006-family-data-layout-dark-mode`.

Completed and committed so far:
- Structured first, middle, and last name fields while retaining legacy full-name records and preserving the current display name when a person has a name history.
- Partial precision date validation and text entry for year, month plus year, and full dates. Date ordering only rejects ranges that are definitely reversed.
- Legacy name-change effective dates are accepted during import and removed from canonical parsed records. New name changes no longer write effective dates.
- Automatic person incompleteness based on structured first name, last name, gender, and birth date, independently combined with a manual incomplete flag.
- Manual incomplete flags for parentage and partnership records, with red connection and family-junction indicators.
- Extended direct kinship labels for great aunts, great uncles, great nieces and great nephews, and cousin degree and removal.
- Persistent light and dark theme preference, with theme-specific application surfaces and edge colours.
- Family junction x positioning now uses the midpoint between the parent group centre and child group centre rather than weighting each person equally.

Known remaining work:
- Improve parent placement toward outer sides and investigate partnership-aware ELK constraints without regressing the existing ordering and manual positioning.
- Add more complete coverage for multiple partnerships and current married-name derivation.
- Add dedicated tests for manual incompleteness and relationship markers, adoption terminology, and complex ambiguous kinship graphs.
- Inspect the full dark theme visually across every editor and dialog surface.
- Verify backup export and reimport against representative legacy data and a complex current project.

## CI evidence

Commit `d04c44c14d119ecffd56108b94288dfd77a62753` passed GitHub Actions run `41329003228`:
- TypeScript type check passed.
- 49 unit tests passed across 9 test files.
- 8 Playwright browser tests passed and 2 were skipped by the configured project filters.
- Production build passed.
- PWA build verification passed.

This is a passing intermediate implementation checkpoint, not completion of the full request.


Additional progress after the first green build:
- Direct adoptive parent and adopted child labels are now distinguished when the recorded direct link is adoptive only.
- Manual incompleteness styling is covered for parentage and partnership edges.
- Family ordering now clusters children who share a recorded biological or adoptive parent. Overlapping groups merge into one soft ordering cluster, keeping half siblings together without duplicating people.


Latest verified CI checkpoint:
- Branch commit: `c934ea06437cd38f1f6e090c031cb7a351dc57f7`.
- GitHub Actions run: `41329675064`.
- TypeScript check passed.
- 52 unit tests passed across 9 files.
- 10 Playwright tests passed and 2 were skipped by the configured project filters.
- Production build passed.
- PWA build verification passed.
- Browser coverage includes dark theme persistence, partial date entry, and manually incomplete relationship markers persisting after reload.

The remaining items listed above are intentionally not marked complete.
