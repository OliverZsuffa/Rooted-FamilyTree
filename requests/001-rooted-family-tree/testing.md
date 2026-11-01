# Testing plan: Rooted family tree

**Status:** Automated checks are running in GitHub Actions. Browser, persistence, and offline verification remain outstanding.

Record actual observations after implementation. Do not mark a test as passed until it has been performed.

## Automated checks

- [x] Schema tests for empty projects and unsupported schema versions.
- [x] Schema test for invalid calendar dates.
- [x] Relationship tests for biological and adoptive generation calculation.
- [x] Relationship tests for step-parent and guardian links not affecting generations.
- [x] Relationship tests for circular ancestry.
- [x] Relationship tests for incompatible generation assignments.
- [x] Relationship tests for newly connected parents joining the correct generation.
- [x] Derived sibling relationship test.
- [x] Duplicate parentage relationship test.
- [x] Backup validation tests for custom attributes, partnerships, duplicate people, missing partnership endpoints, circular ancestry, and impossible date ranges.
- [x] IndexedDB save/load and invalid write tests.
- [ ] Schema migration tests.
- [ ] Import/export browser round-trip test.
- [ ] Component and interaction tests for editing, relationships, undo, and redo.
- [x] A completed GitHub Actions run passed type checking, all 19 then current unit tests, and production build.
- [ ] Confirm the additional date range test passes.
- [ ] Latest GitHub Actions run including the new PWA build verification and date range test must be confirmed successful.
- [x] Automated production build check for manifest, service worker, local icon, and Pages base path.
- [ ] Production build under the final Pages path must be manually inspected.

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
10. Search for a person.
11. Undo and redo person, relationship, and layout changes.
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

A completed run passed type checking, 19 unit tests, and production build. The dependency audit passed its high severity threshold. The additional date range test and PWA production verification are awaiting the latest run. No manual browser or offline tests have been performed yet.
