# Testing plan: Request 002

**Status:** In progress. Regression coverage is being added; no new test results are available yet.

## Layout regression tests
- [ ] Several unrelated people receive distinct positions.
- [ ] Several parent-child branches receive distinct positions and correct generation rows.
- [ ] Clearing a tree and adding new people does not reuse stale coordinates.
- [ ] Importing a different tree does not reuse positions from the previous tree.
- [ ] Deleting people removes their manual positions.
- [ ] ELK failure or incomplete output falls back to valid positions for every person.
- [ ] Manual positions survive ordinary profile edits.
- [ ] Manual positions for existing people survive relationship changes where generation constraints allow.
- [ ] Automatic layout reset produces a complete layout.

## Relationship graph tests
- [ ] Biological parent edge.
- [ ] Adoptive parent edge.
- [ ] Step-parent edge.
- [ ] Guardian edge.
- [ ] Marriage without shared children.
- [ ] Non-marital partnership without shared children.
- [ ] Partnership with one shared child.
- [ ] Partnership with multiple shared children.
- [ ] Multiple partnerships for one person.
- [ ] Children connected to the correct partnership when partners have children with different people.
- [ ] Relationships remain correct when one person is selected.
- [ ] Search filtering does not create invalid or orphaned edges.
- [ ] Moving a person updates connected edges.

## UI workflow tests
- [ ] Add at least four people through the UI and verify all are visible.
- [ ] Create parent, child, and partner relationships through the UI.
- [ ] Edit and remove relationships.
- [ ] Edit and delete people.
- [ ] Search for a person and clear the search.
- [ ] Undo and redo people and relationship changes.
- [ ] Import and export a tree and compare the complete data.
- [ ] Reload and verify IndexedDB persistence.
- [ ] Verify no data loss after an invalid import.

## Responsive browser tests
Test at 320 px, 360 px, 390 px, 768 px, and desktop width.
- [ ] No horizontal page overflow.
- [ ] Toolbar actions remain visible and operable.
- [ ] Canvas fills the available area.
- [ ] Multiple people can be navigated and selected.
- [ ] Person panel does not make the tree unusable.
- [ ] Dialog content is scrollable and submit controls remain reachable.
- [ ] Touch pan, drag, and pinch zoom work in mobile browser emulation.
- [ ] Dragging a person card on a mobile viewport updates its position and survives reload.
- [ ] On-screen keyboard does not hide the active form field or save button.

## Deployment checks
- [ ] Production build succeeds.
- [ ] Unit and UI tests pass.
- [ ] Browser tests pass.
- [ ] PWA manifest and service worker still use the GitHub Pages project path.
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

## Results
No checks for this request have been performed yet.
