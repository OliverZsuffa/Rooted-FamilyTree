# Request 015 notes

## Status

Planning only. No application code has been changed.

## User clarification

Every child in the user's illustrative naming convention is identified by both parents. For example, CA has parents C and A, while AB and BA both have parents A and B. AB and BA are therefore full siblings with the same exact parent set. The letters are illustrative labels, not sorting keys.

The layout must account for people participating in multiple family units without duplicating their person cards.

## Initial code inspection

The current ordering implementation is in `src/domain/familyTraversal.ts` and `src/domain/layout.ts`. The traversal builds overlapping sibling networks, then orders exact-parent-set subgroups using local heuristics. The resulting order is placed into generation rows without a global optimisation of the complete parentage graph.

The approved direction is to replace these local ordering heuristics with a bounded, deterministic layered-graph optimisation, preserving exact parent-set sibling blocks as hard constraints and treating overlapping family relationships as global soft constraints.

## Next step

Wait for explicit user approval of `implementation-plan.md` before changing application code.
