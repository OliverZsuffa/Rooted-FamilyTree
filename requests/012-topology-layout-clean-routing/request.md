# Request 012: Topology-first branch ordering and clean family connectors

## Goal

Arrange each generation according to the family branches it participates in, not names, genders, or alphabetical order. Render family connections with simple, compact curves rather than artificial routing detours.

## Screenshot-derived target

For the example with one shared parent and two partners:
- The parent shared by both family groups belongs at the left edge of the parent row.
- The partner whose child branch contains one child follows in the middle.
- The partner whose child branch contains two siblings follows on the right.
- The single child branch appears first in the child row, followed by the two-child sibling branch.
- The intended relationship topology, not the displayed names, determines this arrangement.

## Implementation

- In parent rows, rank structural anchor parents by the number of distinct exact-parent-set groups they participate in. Preserve descendant encounter order as the tie-breaker for partner branches.
- Within a sibling network, keep children from the same exact parent set adjacent. Order these parent-set subgroups by branch size, with deterministic IDs only as a final tie-breaker.
- Remove artificial per-family routing lane allocation.
- Reduce the smoothstep perpendicular offset and corner radius substantially.
- Keep parentage handles vertical and partnership handles on card sides.
- Do not change relationship semantics, exact-parent-set identity, manual position behaviour, or Request 010's recursive traversal concept.

## Acceptance

1. The screenshot topology produces shared parent, one-child partner branch, two-child partner branch ordering.
2. No name, gender, or display label participates in ordering.
3. Children sharing an exact parent set remain adjacent.
4. The route lane allocator is removed.
5. Parentage connectors use a compact smoothstep offset and small corner radius.
6. Existing partnership edges and manual positioning continue to work.
7. Regression tests assert the topology-based order and absence of artificial route lane metadata.
8. TypeScript, unit tests, Playwright, production build and PWA checks pass.

Implementation is in progress on a dedicated branch. No merge until verification.