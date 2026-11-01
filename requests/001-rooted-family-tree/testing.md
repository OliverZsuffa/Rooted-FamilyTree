# Testing plan: Rooted family tree

**Status:** Test plan established. Automated checks have been added to GitHub Actions but have not yet been observed completing successfully.

Record actual observations after implementation. Do not mark a test as passed until it has been performed.

## Automated checks

- [ ] TypeScript type check.
- [ ] Unit tests for relationship validation and ancestry cycle detection.
- [ ] Unit tests for generation calculation, including biological, adoptive, step-parent, and guardian cases.
- [ ] Tests for multiple partnerships and partnership junctions.
- [ ] Import/export round-trip tests.
- [ ] Invalid import leaves the existing project unchanged.
- [ ] IndexedDB persistence and schema migration tests.
- [ ] Layout tests verify manual positions survive ordinary edits and relationship updates.
- [ ] Production build succeeds.
- [ ] GitHub Actions checks succeed.

## Desktop manual tests

1. Create a person with name, dates, and several custom attributes.
2. Add a parent, child, spouse, and partner through contextual actions.
3. Connect an existing person and confirm no duplicate is created.
4. Create multiple partnerships and children from different partnerships.
5. Add biological, adoptive, step-parent, and guardian relationships.
6. Attempt a circular ancestry connection and a generation-inconsistent connection.
7. Drag people within their generation and verify connecting lines update.
8. Edit a person and verify manual positions remain unchanged.
9. Use automatic layout and verify the tree is reorganized.
10. Search for a person and highlight their ancestors and descendants.
11. Undo and redo person and relationship changes.
12. Export the tree, import it into a clean browser profile, and compare all data and positions.

## Mobile manual tests

1. Open the deployed app on a phone and install it as a PWA.
2. Launch it from the home screen and verify standalone display.
3. Add and edit people using touch controls.
4. Drag a person and verify the canvas does not accidentally scroll.
5. Pinch to zoom and pan around the tree.
6. Open and use the person popup without it obscuring essential actions.
7. Verify search, relationship creation, undo, redo, import, and export are usable on the small screen.

## Offline and PWA tests

1. Visit the deployed app while online and wait for service-worker registration and cache population.
2. Confirm the app is installable in supported browsers.
3. Disable network access completely.
4. Reload the app from its deployed URL and launch the installed PWA.
5. Create and edit people and relationships while offline.
6. Search, rearrange, undo, redo, and run automatic layout while offline.
7. Export and import a JSON backup while offline.
8. Close and reopen the app while still offline; verify IndexedDB data persists.
9. Restore network access and verify a new app version can update without losing local tree data.
10. Confirm all manifest, icon, and service-worker requests use the correct GitHub Pages project path.

## Actual results

To be completed only after the relevant checks have been run.
