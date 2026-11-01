# Implementation plan: Request 003

## Objective

Remove mobile person card flicker by ensuring that one drag mechanism owns each gesture and by keeping transient movement out of the full application project state until the gesture finishes.

## Diagnosis to verify

The current code combines custom touch event handlers with React Flow's enabled built in node dragging. Each touch movement also calls `commitProject`, which updates React state, regenerates the controlled node list, and rebuilds relationship edges. This creates unnecessary work and may cause the two movement paths to compete.

## Proposed implementation

1. Trace touch and pointer event handling in the installed React Flow version and confirm which handlers receive a phone drag.
2. Select one authoritative mobile drag path. Prevent the built in path and custom path from both moving the same node.
3. Keep intermediate drag coordinates transient. Update the React Flow node position without committing the whole project on every touch move, where supported by the controlled component API.
4. On drag completion, commit the final position once, preserve the existing generation constraint, and record one undo entry.
5. Handle touch cancellation and multi touch transitions explicitly. Do not create an undo entry when no movement occurred.
6. Keep relationship edges stable during movement and ensure they follow the moved node.
7. Preserve empty canvas pan and pinch zoom, and preserve desktop mouse dragging.
8. Update the graph interaction knowledge documentation.

## Tests

1. Extend Playwright mobile tests to perform a realistic touch drag and sample the node's visibility and bounding box throughout the gesture.
2. Assert the node remains connected to the DOM and does not jump back to its starting position during the drag.
3. Assert the final position persists after reload.
4. Assert one drag can be undone and redone without extra history entries.
5. Assert touch cancellation does not create an undo entry.
6. Assert canvas pan and pinch interaction are not regressed where Playwright device emulation supports reliable verification.
7. Run type checking, unit tests, desktop and mobile browser tests, production build, and PWA verification.

## Risks and constraints

1. React Flow controlled node updates must remain the source of truth after the transient gesture ends.
2. The mobile card drag must not disable pinch zoom on the empty canvas.
3. Browser emulation is not a substitute for a physical Android device check.
4. Do not claim physical device verification unless it is actually performed.

## Delivery workflow

Implement on `request/003-mobile-drag-flicker`. Run and report the checks above, update the knowledge documentation, and open a pull request for review. Do not merge or deploy without explicit user approval.
