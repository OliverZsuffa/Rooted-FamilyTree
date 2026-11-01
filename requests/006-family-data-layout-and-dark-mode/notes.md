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
