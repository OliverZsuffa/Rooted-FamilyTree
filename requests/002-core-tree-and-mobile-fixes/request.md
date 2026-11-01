# Request 002: Stabilize the family tree and mobile experience

## Status
Implementation completed. Automated desktop and mobile browser checks pass. Awaiting review and real-device verification before merge.

## Problem
The deployed application is not reliably usable. Reported symptoms include only one person appearing in the tree, relationship connections not appearing, and substantially worse usability on mobile.

These are failures of core functionality. A successful TypeScript check, unit test run, and production build are not sufficient evidence that the family tree works.

## Findings from source inspection

1. The automatic layout result is kept in component state independently of the current project. When the current project has no people, the layout effect does not replace the previous non-empty result. A later tree with different person IDs can therefore use stale coordinates. The node builder then falls back to position (0, 0) for every person missing from that stale map, which can stack multiple people on top of each other.
2. The canvas relies on an initial fitView. When the tree changes after the initial render, the viewport is not explicitly adjusted to ensure newly laid out people and relationships are visible.
3. The current automated tests do not exercise the React interface, React Flow node and edge rendering, relationship creation through the UI, or mobile interaction. The original testing document explicitly left browser and mobile checks outstanding.
4. The mobile implementation previously had no reliable touch drag path for person cards. Touch movement is now handled explicitly in the custom node, translated into flow coordinates, and saved as one undoable operation. Browser emulation verifies dragging and persistence. Real-device testing and on-screen keyboard testing remain outstanding.
5. The app shell previously had only a minimum height. React Flow requires a definite parent height, so it rendered with a zero-sized viewport in browser tests. The shell and workspace now allocate a definite viewport height.
6. ELK output for disconnected people could contain colliding horizontal positions. The layout now enforces minimum horizontal spacing within each generation and retains a complete fallback position for every person.

Browser testing also exposed two concrete rendering defects: React Flow had no definite parent height, and ELK could return colliding coordinates for disconnected people. Both are now fixed. Relationship edge construction has been extracted and is covered by tests alongside the actual interface.

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
- Fix touch interaction so users can drag individual people and pan and zoom the tree on mobile.
- Preserve existing IndexedDB data and JSON backup compatibility.

## Non-goals
- No redesign of the established warm paper visual identity.
- No cloud accounts, synchronisation, collaboration, or photos.
- No unrelated feature additions.

## Acceptance criteria
- [x] Adding several people produces separately visible person cards, not overlapping cards.
- [x] Replacing or clearing a tree cannot leave stale positions that affect the next tree.
- [x] Every person has a valid position after automatic layout, including disconnected people.
- [x] All supported relationship types are represented correctly on the canvas.
- [x] Parents, partners, junctions, and children remain correctly connected with multiple partnerships and children from different partnerships.
- [ ] Relationship lines update correctly after moving people and changing relationships.
- [x] Adding people does not leave them outside the usable viewport.
- [ ] Importing a tree does not leave people outside the usable viewport.
- [ ] Search, selection, person details, editing, deletion, undo, redo, and automatic layout continue to work.
- [x] Data survives reload.
- [ ] JSON import and export round trips preserve the complete tree.
- [ ] Existing local data is not silently discarded or overwritten.
- [x] Core canvas layout works at narrow mobile widths, including 320 px, 360 px, and 390 px.
- [ ] Touch pan, node movement, and pinch zoom work without accidental page scrolling or unusable overlays.
- [x] Dragging a person card on a phone changes its saved position and survives reload.
- [ ] Undo reverses a completed mobile drag.
- [ ] Dialogs remain usable when the mobile keyboard is open.
- [x] Automated tests cover the actual interface and relationship rendering, not only the domain model.
- [x] Desktop and mobile browser tests pass before merge.
- [ ] Deployment is verified after approval and merge.

## Release standard
Do not mark a feature complete solely because it compiles. Every acceptance criterion must have a corresponding automated test or a documented manual verification. Do not claim real-device testing unless it was actually performed.
