# Implementation plan: Request 002

**Status:** Proposed. No application code has been changed.

## 1. Reproduce and isolate
- [ ] Establish a reproducible fixture with several unrelated people, parent-child relationships, partnerships, and multiple family branches.
- [ ] Trace layout state from initial load through add, edit, delete, empty tree, import, and replacement with a different tree.
- [ ] Trace node and edge arrays produced for each fixture.
- [ ] Reproduce the reported failures in automated browser tests before applying fixes.
- [ ] Inspect the deployed build and confirm its commit matches the reviewed main branch.

## 2. Fix layout state and viewport behaviour
- [ ] Make automatic positions explicitly belong to the current project revision or person ID set.
- [ ] Clear or replace layout state when the project changes, including when the result is empty.
- [ ] Guarantee a deterministic, non-overlapping fallback position for every person if ELK fails or omits a node.
- [ ] Remove stale positions for deleted people and replaced trees.
- [ ] Preserve manual positions for existing people without allowing stale positions to affect new people.
- [ ] Fit the viewport after initial load and deliberate structural changes such as adding people or importing a tree.
- [ ] Do not unexpectedly reset pan or zoom after ordinary profile edits or selection changes.

## 3. Audit relationship rendering
- [ ] Separate graph construction from the React component so it can be tested as pure logic.
- [ ] Verify every supported parentage type produces a visible relationship edge.
- [ ] Verify marriage and non-marital partnerships without children.
- [ ] Verify partnership junctions and shared children.
- [ ] Verify multiple partnerships, remarriage, and children from different partnerships.
- [ ] Verify filtering and selection do not accidentally remove relevant edges.
- [ ] Verify edge endpoints and handles remain valid after node movement and layout changes.
- [ ] Add regression tests for every defect reproduced in step 1.

## 4. Mobile usability
- [ ] Give the canvas a reliable, explicit available height on mobile.
- [ ] Check toolbar width and ensure all essential actions remain accessible at 320 px and above.
- [ ] Review panel placement and ensure it does not permanently obscure the tree or essential canvas controls.
- [ ] Make dialogs usable with the on-screen keyboard and safe-area insets.
- [ ] Verify touch pan, drag, and pinch zoom.
- [ ] Prevent accidental page scrolling while interacting with the canvas, without blocking normal form scrolling.
- [ ] Keep the existing visual identity and avoid adding unnecessary permanent controls.

## 5. Test strategy
- [ ] Add unit tests for layout state and complete node positioning.
- [ ] Add unit tests for graph node and edge construction.
- [ ] Add UI integration tests for creating people and relationships through the actual forms.
- [ ] Add browser end-to-end tests for desktop and narrow mobile viewports.
- [ ] Cover add person, add parent, add child, add partner, multiple relationships, search, edit, delete, undo, redo, auto layout, reload, import, and export.
- [ ] Assert that multiple people have distinct visible bounding boxes and that expected relationship edges are rendered.
- [ ] Capture mobile screenshots at 320 px, 360 px, and 390 px for layout review.
- [ ] Run type checking, all unit and integration tests, production build, and PWA verification.
- [ ] Record checks that require a real device separately from browser emulation.

## 6. Review and release
- [ ] Review the complete diff against the acceptance criteria.
- [ ] Update request notes, testing results, and knowledge documentation.
- [ ] Open a pull request for review.
- [ ] Wait for Oliver's explicit approval before merging.
- [ ] After approval, merge, verify the deployment workflow, and test the deployed site.
- [ ] Do not claim physical-device or offline verification unless performed.

## Key implementation constraint
Preserve user data. Do not change the IndexedDB database name or active project key without a migration plan. Do not make an automatic reset of stored trees part of a fix.
