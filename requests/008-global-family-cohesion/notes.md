# Request 008 notes

## Status

Planning only. No application code has been changed and no tests have been run.

## User clarification

The user explicitly does not care which gender is placed on which side. The requirement is to keep family structures together. Do not implement a fixed maternal-left and paternal-right convention.

## Confirmed problem

The current layout can make a local family group look reasonable while placing the previous generation inconsistently. The reported example has the user between their mother on the left and father on the right, but the grandparents then appear on switched sides. This indicates that local family positioning is not sufficient to guarantee whole-tree coherence.

## Design caution

Do not equate global coherence with a gender-based side convention. The intended result is a visually connected family structure across generations, regardless of which side a particular branch occupies.

The algorithm must also handle people who belong to multiple family groups without duplicating their cards. Parentage comes only from recorded biological or adoptive relationships. Partnership records alone must not create parentage.

## Open technical questions

The current implementation should be traced with a deterministic multigenerational fixture before choosing a new ordering algorithm. Candidate approaches such as global generation ordering, barycentric sweeps, and overlapping family-cluster constraints require evaluation against the existing code. No specific algorithm is committed to until that inspection is complete.

## Related work

- Request 007 introduced deterministic generation-by-generation family-centred placement and preserved unique people, exact parent-set junctions, and manual position precedence.
- This request extends the objective from local family centring to global branch coherence. Request 007 behaviour should remain as a soft constraint where compatible.


## Implementation outcome

Implemented the first global ordering pass in `src/domain/layout.ts`:

- Keeps sibling clusters together using recorded biological and adoptive parentage.
- Performs repeated downward and upward ordering sweeps across all generations.
- Evaluates each candidate order against the complete ancestry graph.
- Prioritises fewer ancestry edge crossings, then shorter total parentage and partnership spans.
- Uses partnership links as a soft proximity preference only. They do not create parentage or merge sibling groups.
- Preserves parent to child centring by shifting each generation as a whole after packing its clusters.
- Keeps exact parent-set family junctions distinct.
- Keeps deterministic tie breaking based on the existing order.
- Updates the layout cache key when partnership endpoints change.
- Leaves manual position precedence, drag persistence, incompleteness, dark mode, and the data schema unchanged.

## Regression and verification

Added tests for:
- A three-generation tree with deliberately interleaved ancestor input order.
- Consistent relative ordering of grandparent branches and their descendant parents.
- Gender independent horizontal placement.
- Stable repeated calculations.

The first CI run exposed a regression in parent to child centring. The generation-wide offset correction restored that behaviour while retaining the global ordering pass.

GitHub Actions run 320, run ID `41334435323`, passed:
- TypeScript type checking.
- 57 unit tests across 9 files.
- 10 Playwright browser tests.
- Production build.
- PWA build verification.

No visual inspection of the user's real populated family tree has been performed yet. The automated fixtures verify the targeted structural behaviour, but this is not a substitute for reviewing the actual tree.
