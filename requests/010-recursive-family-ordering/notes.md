# Request 010 notes

## Initial architectural findings

- `src/domain/layout.ts` currently builds same-generation clusters by unioning people who share a recorded parent.
- The current order starts from the people array order.
- It assigns generation positions, calculates cluster barycentres from parents, children, and partners, sorts clusters, scores crossings and total edge span, and performs repeated downward and upward sweeps.
- This is the accumulated sorting strategy the request intends to replace.
- `src/domain/familyGroups.ts` already preserves a distinct family junction for each exact recorded biological/adoptive parent set.
- `src/domain/relationships.ts` is the existing source for generation calculation.
- `src/domain/relationshipEdges.ts` already keeps biological/adoptive family junction edges separate from partnership connectors and from step-parent/guardian edges.
- The app uses `calculateAutoPositions` and `createFallbackPositions`; their callers and manual-position merge behaviour must be inspected before implementation.

## Design constraints

- Do not treat the relationship graph as a simple tree. Multiple paths and overlapping sibling associations are expected.
- Keep sibling association and exact parent-set junction identity as separate concepts.
- A person can participate in several family groups but has one node and one coordinate.
- Partnership proximity is separate from ancestry traversal and generation assignment.
- The recursive traversal must include descendants of newly discovered ancestor siblings, otherwise collateral cousin branches can be omitted from the initial branch ordering.
- The current implementation is untouched while the plan awaits approval.

## Open implementation details to settle during the approved audit

- Confirm the exact generation and ancestry-component APIs exposed by `relationships.ts`.
- Confirm whether partnership-linked ancestry components should be positioned as adjacent component blocks or by a narrower proximity hint.
- Choose and document the deterministic branch-attachment precedence for overlapping sibling groups.
- Confirm how manual positions are merged with the automatic position map.
