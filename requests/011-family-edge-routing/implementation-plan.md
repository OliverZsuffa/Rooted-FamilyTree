# Request 011 implementation plan

## Status

Plan drafted on 2026-11-01. Awaiting explicit approval. No implementation has started.

## 1. Reproduce and map the current rendering pipeline

Trace the full path from project relationships to visible React Flow nodes and edges:

- `src/domain/familyGroups.ts`: exact-parent-set family group identity.
- `src/domain/layout.ts`: automatic person positions and calculated family junction positions.
- `src/App.tsx`: visible person nodes, manual position precedence, family junction nodes, filtering, and edge construction.
- `src/domain/relationshipEdges.ts`: parentage and partnership edge definitions.
- `PersonCard` and `JunctionCard` handle definitions in `src/App.tsx`.
- Existing domain tests and Playwright coverage.

Create minimal fixtures matching both screenshots. The first fixture must include two parents and one child, with the parent whose edge currently exits from the left. The second must include two distinct exact-parent-set family groups sharing a parent, with children in separate branches.

Record the actual node coordinates, edge source/target IDs, handle IDs, and SVG path geometry. Do not rely on visual guesses about which relationship is wrong.

## 2. Make handle selection explicit

Give every relevant handle a stable semantic ID:

- Person parentage input: top target.
- Person parentage output: bottom source.
- Person partnership input/output: named left and right handles.
- Family junction parent inputs: top target.
- Family junction child output: bottom source.

Update `buildRelationshipEdges` so every biological/adoptive parent-to-junction edge specifies the person's bottom source handle and junction's top target handle.

Every junction-to-child edge must specify the junction's bottom source handle and child's top target handle.

Keep side handles exclusive to partnership edges. Update step-parent and guardian direct edges deliberately as part of the audit: decide and document whether they should use the same vertical parentage handles, rather than allowing React Flow to select a side handle implicitly.

Add unit tests that assert exact source and target handle IDs for each edge category. Do not only assert that edges exist.

## 3. Establish one authoritative junction-position model

The layout module already calculates family junction positions in `calculateFamilyJunctionPositions` and returns them alongside person positions.

Remove the independent midpoint calculation from the `App.tsx` family-node construction. Instead, obtain the current automatic/fallback family junction position from the same position map used for person nodes.

Account for manual person positions. Because a manually moved parent or child changes the geometry, introduce a shared pure helper that recalculates junction positions from the final effective person positions while preserving the layout engine's spacing rules. Use that helper both in the domain layout path and in visible node construction. Do not duplicate the formula.

The helper must:
- Accept effective person positions, including manual overrides.
- Preserve exact-parent-set junction identity.
- Place each visible junction between its parent and child rows.
- Avoid junction card overlaps.
- Be deterministic.
- Avoid changing person coordinates or generation assignments.

Add tests proving that the same input positions produce the same junction coordinates in automatic layout, fallback layout, and visible-node construction.

## 4. Design deterministic family route lanes

The current `smoothstep` defaults do not encode which family group should pass above or below another when groups share parents or occupy the same generation gap.

Introduce a pure routing-layout helper, separate from React Flow rendering. It should receive:

- Visible exact-parent-set family groups.
- Effective positions of visible people and junctions.
- Card and junction dimensions.
- Relationship edge direction and group membership.

It should produce deterministic route metadata for every parent-to-junction and junction-to-child segment.

The lane strategy must:

1. Keep each exact-parent-set family group separate.
2. Detect overlapping horizontal spans and shared-parent cases.
3. Assign distinct lanes where parallel routes would otherwise coincide.
4. Use stable sorting based on geometry and stable group/person IDs, not insertion order or gender.
5. Keep parentage routes in the vertical space between the relevant generation rows.
6. Recompute from effective coordinates after manual dragging, while keeping unrelated routes stable where possible.
7. Respect filtered visibility and omit edges whose endpoints are not visible.
8. Avoid collisions with person cards, junction cards, partnership edges, and other parentage lanes where feasible.

Choose the least complex rendering implementation that can enforce those lanes. If React Flow's built-in edge types cannot reliably express the required route, add a dedicated custom orthogonal family edge component with explicit waypoints. Keep partnership edges on their existing rendering path.

Do not use arbitrary per-edge offsets that merely move one crossing elsewhere. Lane allocation must be group-aware and tested on the full two-generation-gap structure.

## 5. Integrate routing without changing relationship meaning

- Keep `getFamilyGroups` as the source of exact-parent-set junction identity.
- Keep biological/adoptive parentage represented through family junctions.
- Keep partnership consolidation behaviour intact.
- Keep step-parent and guardian semantics distinct from biological/adoptive family groups.
- Preserve incomplete relationship styling and selection/highlighting opacity.
- Preserve search filtering and the rule that a junction is shown only when its parent set and at least one child are visible.
- Preserve manual position precedence and drag persistence.
- Do not modify Request 010's recursive person ordering.

## 6. Add regression tests before visual polish

### Domain tests

- Parent to junction edge uses bottom-to-top handles.
- Junction to child edge uses bottom-to-top handles.
- Partnership edges use side handles.
- Step-parent and guardian direct edges use the explicitly chosen vertical handles.
- Two exact-parent-set groups sharing one parent retain separate junction IDs and route lanes.
- Multiple children in one exact-parent-set group share the correct junction.
- Manually moved parent and child coordinates update junction and route geometry.
- Reordering project people and relationships does not change route lane assignment.
- Hidden people do not leave dangling routes.
- Junction positions remain separated when their unadjusted centres coincide.

### Browser tests

- Reproduce screenshot 1 and assert that the rendered parent path starts at the bottom handle, not a side handle.
- Reproduce screenshot 2 and assert that separate family groups have distinct route corridors and no avoidable path intersection in the relevant generation gap.
- Verify manual dragging updates the routes without losing the layout.
- Verify partnership edges remain on card sides.
- Run the tests at desktop and mobile viewport sizes.

Use SVG path geometry or explicit custom-edge waypoint metadata for robust assertions. Avoid brittle full-path string snapshots where small renderer changes would invalidate them.

## 7. Verification and review

Run the full project checks:

- TypeScript typecheck.
- Unit tests.
- Playwright suite, including the two new screenshot-derived regressions on desktop and mobile.
- Production build.
- PWA verification.
- Dependency audit at the configured threshold.

Manually inspect both fixture screenshots after implementation. Also inspect a larger mixed family with half siblings, shared parents, multiple partners, and manually moved people.

Update `testing.md` with actual outcomes and any unavoidable crossing limitations. Do not mark visual acceptance criteria complete based only on successful builds or edge-count assertions.

## 8. Delivery

- Implement on a dedicated branch after approval.
- Keep the change focused on junction geometry and relationship routing.
- Open a PR against `main` with the two screenshots or reproducible fixture descriptions.
- Do not merge until the user explicitly approves the merge.