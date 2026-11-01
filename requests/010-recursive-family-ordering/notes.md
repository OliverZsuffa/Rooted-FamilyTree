# Request 010 notes

## Implementation architecture

The automatic layout now has a dedicated relationship traversal module, `src/domain/familyTraversal.ts`.

The traversal is deliberately separate from React Flow and coordinate geometry:

1. Build parent and child indexes from biological and adoptive parentage only.
2. Identify connected ancestry components without using partnerships.
3. Within each generation, build sibling networks from shared recorded parents. Exact parent-set family junctions remain separate and continue to come from `getFamilyGroups`.
4. Seed the traversal with the youngest generation in each component.
5. Walk upwards through parents, expanding each discovered ancestor's sibling network.
6. Walk downwards from the resulting oldest-generation order. This second pass includes descendants of ancestor siblings, including cousins and collateral branches that are not on the original path.
7. Track people by ID and produce one ordered entry per person per generation. All tie breaks use stable person IDs and relationship-derived encounter order, not person insertion order or gender.

The coordinate layer in `src/domain/layout.ts` converts those row orders into positions. It centres each generation row inside its ancestry component's horizontal block, prevents card overlap, and computes the existing exact-parent-set junction positions.

Partnerships are deliberately excluded from traversal and generation calculation. They only group otherwise disconnected ancestry components into adjacent layout neighbourhoods. Their internal ancestry order is not interleaved.

## Current implementation files

- `src/domain/familyTraversal.ts`: graph indexing, connected ancestry components, sibling networks, bottom-up ancestor discovery, and downward collateral expansion.
- `src/domain/layout.ts`: component grouping by partnership proximity, coordinate assignment, junction placement, and fallback handling.
- `src/domain/layout.test.ts`: existing layout regressions plus cousin expansion, multiple partnerships, partnership-connected components, insertion-order independence, one-position-per-person, and overlap coverage.

## Important constraints and limitations

- Sibling networks are connected components of shared-parent relationships. This intentionally keeps overlapping half-sibling relationships together as one sibling network while leaving exact parent-set junction identity unchanged.
- Pedigree collapse and multiple discovery paths reuse the same person ID and position.
- A graph with conflicting sibling and branch constraints cannot always be drawn without crossings. The algorithm prioritises coherent sibling networks and deterministic branch expansion rather than promising a crossing-free drawing for every possible pedigree.
- Partnership-connected ancestry components remain separate blocks. Partnership does not merge generations or imply parentage.
- The current application computes visible family junction positions from visible person coordinates. The layout module also returns junction positions for fallback and domain consumers.

## Verification

Implementation has been committed to `request/010-recursive-family-ordering`. Automated verification is pending CI. See `testing.md` for the actual results once available.
