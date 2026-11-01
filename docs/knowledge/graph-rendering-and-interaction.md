# Graph rendering and interaction

## Canvas sizing

React Flow requires a parent with a definite width and height. A `min-height` alone is not sufficient for a child whose height is set to `100%`. The app shell therefore uses a definite `100dvh` height and the tree workspace takes the remaining flex space with `min-height: 0`. The React Flow viewport fills that workspace.

When changing the shell or footer layout, verify the canvas bounding box in a real browser. Watch for React Flow's warning that its parent container has no width or height. A successful TypeScript build does not catch this.

## Automatic positions

- `createFallbackPositions` must return a position for every person, including disconnected people, and a derived position for every family junction.
- Automatic layout results are keyed to the project ID, person IDs, and parentage records. Never reuse a position map from a different tree.
- ELK can return coincident horizontal coordinates for disconnected nodes. Resolve collisions within each generation using at least the person card width plus the desired gap.
- Keep a complete fallback map and merge ELK output into it. Missing ELK nodes must never default to the same origin.
- Fit the viewport after deliberate structural changes, but do not reset it on ordinary profile edits or node movement.

## Relationship edges

Keep relationship edge construction in `src/domain/relationshipEdges.ts` so the graph can be tested without mounting the UI. Biological and adoptive parentage routes through family junctions derived from exact parent sets. Step-parent and guardian links remain direct dashed edges. Partnerships use side handles and curved connectors independently of family junctions. Test multiple family groups, one-parent groups, shared children, multiple partnerships, and filtering of hidden endpoints.

## Touch interaction

- React Flow owns person card dragging for both mouse and touch input. Do not add a second custom touch movement path to person cards. Competing touch and pointer handlers can fight over node position and cause visible flicker.
- Keep the controlled React Flow node list in local UI state. Apply React Flow node changes to that list during a gesture instead of committing the entire family tree project on every pointer movement.
- Persist the final person position to the project only once when the drag ends. This keeps IndexedDB autosave and application history out of the high frequency movement loop.
- A completed drag creates one undo history entry. A drag that does not change position creates none.
- Clamp the saved vertical position to the person's calculated generation.
- Keep touch gestures inside the canvas with `touch-action: none` on the canvas and node surfaces. Restore `touch-action: pan-y` on the person details panel so its content remains scrollable.
- Canvas panning and pinch zoom should remain available when gestures start on the empty canvas.
- Browser emulation can verify touch events and DOM stability, but it does not replace a real Android device check.

## Verification

Run unit tests, desktop and mobile Playwright tests, production build, and PWA verification. Browser tests should assert that multiple person cards have non-overlapping bounding boxes, relationship edges have valid visible endpoints, the tree survives reload, and mobile dragging changes the card position.


## Consolidated partnership and family junctions

- When a partnership's two people exactly match the two recorded biological or adoptive parents of a family group, render the partnership symbol at that group's family junction.
- Suppress the separate partnership edge only for that exact match. The existing parent-to-junction and junction-to-child edges remain the actual parentage representation.
- Do not infer parentage from a partnership record. One-parent groups, other parent sets, and partnerships without shared children remain separate.
- The symbol belongs inside the family junction node, with parent edges entering through its top handle and child edges leaving through its bottom handle.
- The visual consolidation does not change the ELK layout graph or person positions.

## Relationship finder

- `src/domain/relationshipPath.ts` calculates a shortest path through recorded parentage and partnership links and returns person IDs, relationship IDs, relevant family junction IDs, and ambiguity metadata.
- The UI uses the existing kinship calculation for relationship wording. Partnership-only and supported in-law paths receive a clear relationship description without adding stored kinship data.
- The relationship finder is a separate compact panel. It highlights the selected people and connecting path, supports swapping the perspective, and can be cleared or closed.
- Keep the person details panel free of a large computed Family connections list.
