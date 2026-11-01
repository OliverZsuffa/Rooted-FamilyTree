# Testing plan: Request 002

**Status:** Automated verification complete. Real-device and several extended workflow checks remain outstanding.

## Layout regression tests
- [x] Several unrelated people receive distinct positions.
- [x] Several parent-child branches receive distinct positions and correct generation rows.
- [x] Empty replacement trees produce no stale fallback positions; current-tree layout keys prevent reusing positions from another tree.
- [ ] Importing a different tree does not reuse positions from the previous tree.
- [ ] Deleting people removes their manual positions.
- [x] ELK output is merged with complete fallback positions and collisions are resolved.
- [ ] Manual positions survive ordinary profile edits.
- [ ] Manual positions for existing people survive relationship changes where generation constraints allow.
- [ ] Automatic layout reset produces a complete layout.

## Relationship graph tests
- [x] Biological parent edge.
- [x] Adoptive parent edge.
- [x] Step-parent edge.
- [x] Guardian edge.
- [x] Marriage without shared children.
- [ ] Non-marital partnership without shared children.
- [x] Partnership with one shared child.
- [ ] Partnership with multiple shared children.
- [x] Multiple partnerships for one person.
- [ ] Children connected to the correct partnership when partners have children with different people.
- [ ] Relationships remain correct when one person is selected.
- [x] Search filtering does not create invalid or orphaned edges.
- [ ] Moving a person updates connected edges.

## UI workflow tests
- [x] Add four people through the UI and verify all are visible and non-overlapping.
- [x] Create parentage and marriage relationships through the UI.
- [ ] Edit and remove relationships.
- [ ] Edit and delete people.
- [ ] Search for a person and clear the search.
- [ ] Undo and redo people and relationship changes.
- [ ] Import and export a tree and compare the complete data.
- [x] Reload and verify IndexedDB persistence for people and relationships.
- [ ] Verify no data loss after an invalid import.

## Responsive browser tests
Test at 320 px, 360 px, 390 px, 768 px, and desktop width.
- [x] No horizontal page overflow at 320 px, 360 px, and 390 px.
- [ ] Toolbar actions remain visible and operable.
- [x] Canvas fills the available area.
- [x] Multiple people can be selected through the actual interface.
- [ ] Person panel does not make the tree unusable.
- [ ] Dialog content is scrollable and submit controls remain reachable.
- [ ] Touch pan, drag, and pinch zoom work in mobile browser emulation.
- [x] Touch dragging a person card on a mobile viewport updates its position and survives reload.
- [ ] On-screen keyboard does not hide the active form field or save button.

## Deployment checks
- [x] Production build succeeds.
- [x] Unit and UI tests pass.
- [x] Desktop and mobile browser tests pass.
- [x] PWA manifest and service worker still use the GitHub Pages project path.
- [ ] Deployment workflow succeeds after the approved merge.
- [ ] Deployed site uses the expected commit.

## Manual device checks
These cannot be replaced by a desktop build or a unit test.
- [ ] Open the deployed site on an actual Android phone.
- [ ] Create several people and connect them.
- [ ] Verify all people and relationship lines are visible.
- [ ] Test touch movement, pan, and pinch zoom.
- [ ] Test forms with the real on-screen keyboard.
- [ ] Install and launch the PWA.
- [ ] Verify offline operation after an initial successful online load.

## Automated CI results

Run: https://github.com/OliverZsuffa/Rooted-FamilyTree/actions/runs/41299858594

- TypeScript type check: passed.
- Unit tests: 27 passed across 6 test files.
- Playwright browser tests: 4 passed, 2 skipped. The skipped cases are mobile-only checks excluded from the desktop project.
- Browser coverage: four people with non-overlapping cards, parentage and marriage edges, reload persistence, touch dragging with position persistence, and viewport widths of 320 px, 360 px, and 390 px.
- Production build: passed.
- PWA build verification: passed.
- Dependency audit at high severity threshold: passed. The dependency tree still reports 2 low and 8 moderate advisories.

## Not yet verified

- Physical Android device behaviour, including the actual keyboard and installed PWA.
- Touch panning and pinch zoom in browser emulation.
- Undo after a mobile drag.
- Full import/export round trip and broader search, edit, delete, undo, and redo workflows.
- Deployment of this branch. No changes have been merged to main.

## Results
The automated CI run above completed successfully.
