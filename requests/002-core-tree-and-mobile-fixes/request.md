# Request 002: Stabilize the family tree and mobile experience

## Status
Under investigation. This request documents defects found in the deployed implementation and defines the verification required before further release.

## Problem
The deployed application is not reliably usable. Reported symptoms include only one person appearing in the tree, relationship connections not appearing, and substantially worse usability on mobile.

These are failures of core functionality. A successful TypeScript check, unit test run, and production build are not sufficient evidence that the family tree works.

## Findings from source inspection

1. The automatic layout result is kept in component state independently of the current project. When the current project has no people, the layout effect does not replace the previous non-empty result. A later tree with different person IDs can therefore use stale coordinates. The node builder then falls back to position (0, 0) for every person missing from that stale map, which can stack multiple people on top of each other.
2. The canvas relies on an initial fitView. When the tree changes after the initial render, the viewport is not explicitly adjusted to ensure newly laid out people and relationships are visible.
3. The current automated tests do not exercise the React interface, React Flow node and edge rendering, relationship creation through the UI, or mobile interaction. The original testing document explicitly left browser and mobile checks outstanding.
4. The mobile implementation is primarily a small set of CSS overrides. It has not been verified at phone viewport sizes or with touch interaction. The person panel overlays the canvas, and the toolbar and modal layout have not been tested with narrow screens and the on-screen keyboard.

The exact cause of every reported relationship rendering failure still needs to be isolated with repeatable UI tests. The relationship model and edge construction must be tested together rather than assuming that domain tests prove that connections are visible.

## Required outcome
Rooted must reliably display every person in the active tree, draw all applicable relationships, keep the tree navigable as it changes, and support the complete core workflow on desktop and mobile.

## Scope
- Fix stale or incomplete automatic layout state.
- Ensure every person receives a unique, usable position, including disconnected people and people in separate family branches.
- Preserve manual positions when appropriate and remove positions belonging to deleted or replaced people.
- Recalculate or explicitly fit the viewport when the tree changes, without unexpectedly moving the user's view during ordinary edits.
- Audit and test relationship edge generation for biological parents, adoptive parents, step-parents, guardians, marriage, partnerships, multiple partnerships, and shared children.
- Ensure relationships remain visible after editing, searching, importing, deleting, and changing layout.
- Review React Flow controlled state handling, node dimensions, edge handles, and viewport behaviour.
- Rework mobile layout where required, including canvas sizing, toolbar fit, touch gestures, person details, dialogs, and on-screen keyboard behaviour.
- Preserve existing IndexedDB data and JSON backup compatibility.

## Non-goals
- No redesign of the established warm paper visual identity.
- No cloud accounts, synchronisation, collaboration, or photos.
- No unrelated feature additions.

## Acceptance criteria
- [ ] Adding several people produces separately visible person cards, not overlapping cards.
- [ ] Replacing or clearing a tree cannot leave stale positions that affect the next tree.
- [ ] Every person has a valid position after automatic layout, including disconnected people.
- [ ] All supported relationship types are represented correctly on the canvas.
- [ ] Parents, partners, junctions, and children remain correctly connected with multiple partnerships and children from different partnerships.
- [ ] Relationship lines update correctly after moving people and changing relationships.
- [ ] Adding or importing people does not leave them outside the usable viewport.
- [ ] Search, selection, person details, editing, deletion, undo, redo, and automatic layout continue to work.
- [ ] Data survives reload and backup round trips.
- [ ] Existing local data is not silently discarded or overwritten.
- [ ] Core workflows work at narrow mobile widths, including 320 px, 360 px, and 390 px.
- [ ] Touch pan, node movement, and pinch zoom work without accidental page scrolling or unusable overlays.
- [ ] Dialogs remain usable when the mobile keyboard is open.
- [ ] Automated tests cover the actual interface and relationship rendering, not only the domain model.
- [ ] Desktop and mobile browser tests pass before merge.
- [ ] Deployment is verified after approval and merge.

## Release standard
Do not mark a feature complete solely because it compiles. Every acceptance criterion must have a corresponding automated test or a documented manual verification. Do not claim real-device testing unless it was actually performed.
