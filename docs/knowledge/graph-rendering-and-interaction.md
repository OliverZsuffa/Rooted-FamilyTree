# Graph rendering and interaction

## Canvas sizing

React Flow requires a parent with a definite width and height. A `min-height` alone is not sufficient for a child whose height is set to `100%`. The app shell therefore uses a definite `100dvh` height and the tree workspace takes the remaining flex space with `min-height: 0`. The React Flow viewport fills that workspace.

When changing the shell or footer layout, verify the canvas bounding box in a real browser. Watch for React Flow's warning that its parent container has no width or height. A successful TypeScript build does not catch this.

## Automatic positions

- `createFallbackPositions` must return a position for every person, including disconnected people.
- Automatic layout results are keyed to the project ID, person IDs, and parentage records. Never reuse a position map from a different tree.
- ELK can return coincident horizontal coordinates for disconnected nodes. Resolve collisions within each generation using at least the person card width plus the desired gap.
- Keep a complete fallback map and merge ELK output into it. Missing ELK nodes must never default to the same origin.
- Fit the viewport after deliberate structural changes, but do not reset it on ordinary profile edits or node movement.

## Relationship edges

Keep relationship edge construction in `src/domain/relationshipEdges.ts` so the graph can be tested without mounting the UI. Test every parentage type, independent partnerships, partnership junctions with shared children, multiple partnerships, and filtering of hidden endpoints.

## Touch interaction

- React Flow canvas gestures need `touch-action: none` on the canvas and node surfaces so browser scrolling does not consume drag gestures.
- Restore `touch-action: pan-y` on the person details panel so its content remains scrollable.
- Person-card touch movement is handled explicitly in the custom node and converted from screen coordinates to flow coordinates with `screenToFlowPosition`.
- Save one undo history entry for the complete touch drag, not one entry per touch-move event.
- Canvas panning and pinch zoom should remain available when gestures start on the empty canvas.
- Browser emulation can verify touch events, but it does not replace a real Android device check.

## Verification

Run unit tests, desktop and mobile Playwright tests, production build, and PWA verification. Browser tests should assert that multiple person cards have non-overlapping bounding boxes, relationship edges have valid visible endpoints, the tree survives reload, and mobile dragging changes the card position.
