# Request 011: Correct family junction rendering and edge routing

## Goal

Make family relationships visually unambiguous. Parentage lines must attach to the correct top and bottom handles, family junctions must use one authoritative position calculation, and multiple nearby family groups must receive clear, deterministic routes.

The current screenshots expose two visible failures: a parent connection leaves a card from its left edge, and separate family branches overlap or cross in confusing ways.

## Confirmed findings from the current code

- `PersonCard` has an unnamed bottom source handle, as well as named left and right partnership source handles.
- `JunctionCard` has a top target handle and an unnamed bottom source handle.
- `buildRelationshipEdges` currently omits explicit handle IDs for biological/adoptive parentage edges. With multiple handles of the relevant type available, React Flow can select an unintended side handle.
- The child half of a parentage connection also omits explicit junction-bottom and person-top handles.
- `src/domain/layout.ts` calculates and returns family junction positions, including spacing for junctions that would otherwise coincide.
- `src/App.tsx` ignores those returned junction positions for visible family nodes and recalculates them with a separate midpoint formula. That bypasses the layout engine's spacing.
- Parentage edges use default `smoothstep` routing. No explicit route-lane allocation currently separates nearby family groups or shared-parent branches.

## Requirements

1. Parent to junction edges explicitly use the parent's bottom source handle and junction's top target handle.
2. Junction to child edges explicitly use the junction's bottom source handle and child's top target handle.
3. Partnership edges retain their explicit left/right handles and remain visually distinct from parentage.
4. The layout engine is the single source of truth for automatic family junction positions. Visible junction nodes must not recalculate positions independently.
5. Nearby family groups, including groups sharing a parent, receive deterministic route lanes that prevent avoidable overlaps and crossings.
6. Routes remain understandable when parents or children have manually adjusted positions.
7. Filtering and hidden people must not leave dangling or misleading family routes.
8. Preserve relationship highlighting, incomplete relationship styling, partnership consolidation, and existing application interactions.
9. Keep the recursive person ordering from Request 010 unchanged unless a directly necessary integration adjustment is documented and separately justified.

## Routing principles

- Keep parentage flow vertical: parent card bottom, junction top, junction bottom, child card top.
- Allocate route lanes using actual visible node coordinates and family-group topology, not person array order or gender.
- Treat each exact-parent-set family group as its own junction and route identity, even when groups share one parent.
- Route shared-parent groups separately through stable lanes. Do not merge their junctions or imply that their children share the same complete parent set.
- Prefer simple orthogonal or smooth orthogonal routes with clear separation. If a graph's constraints make a crossing unavoidable, make the result deterministic and minimise crossings rather than claiming universal crossing-free layout.
- Ensure lane assignment remains stable when unrelated people are added or reordered.

## Scope exclusions

- No schema or import/export changes.
- No changes to biological, adoptive, step-parent, guardian, marriage, or partnership semantics.
- No person-card redesign, editor redesign, or theme changes.
- No changes to recursive generation ordering.
- No changes to manual person-position persistence or drag controls.

## Acceptance criteria

1. All biological/adoptive parent edges specify `sourceHandle: 'parentage-out-bottom'` or the final explicitly named bottom-handle ID, and `targetHandle: 'family-in-top'` or its final explicitly named equivalent.
2. All biological/adoptive child edges specify the junction's bottom source handle and the person's top target handle.
3. Side handles are used only for partnership edges.
4. The visible junction node position equals the authoritative position returned for that family group by the layout calculation, including spacing between distinct junctions.
5. Screenshot 1's parent connection no longer exits through the left side of the card or loops around the card.
6. Screenshot 2's separate family groups have distinct, legible routes without the current avoidable overlaps and crossings.
7. Tests cover multiple exact-parent-set groups sharing one parent, multiple children in a group, multiple parents, and manually moved people.
8. Browser tests inspect rendered edge geometry or equivalent observable path constraints, not merely edge counts.
9. Search filtering, selection highlighting, incomplete styling, partnership consolidation, and drag persistence continue to work.
10. TypeScript, unit tests, Playwright, production build, and PWA verification pass.

## Issue

Tracked in [GitHub issue #12](https://github.com/OliverZsuffa/Rooted-FamilyTree/issues/12).

## Implementation status

Plan drafted and awaiting explicit approval. No application code has been changed.