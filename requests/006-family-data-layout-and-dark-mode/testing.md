# Request 006 testing checklist

## Status

Implementation is in progress. The checks below distinguish verified work from remaining coverage.

## Verified by GitHub Actions run 41329003228
- [x] TypeScript type check.
- [x] 49 unit tests across 9 test files.
- [x] 8 Playwright browser tests passed.
- [x] Production build.
- [x] PWA build verification.
- [x] Legacy version 1 project parsing with the original single name field.
- [x] Legacy name-change effective dates are accepted and discarded.
- [x] Structured first, middle, and last name fields are saved through the interface.
- [x] Year, month and full date formats are validated.
- [x] Month precision birth date can be entered through the interface.
- [x] Automatic incompleteness clears when required structured fields, gender and birth date are supplied.
- [x] Person theme choice toggles and persists across reload.
- [x] Direct ancestry, sibling, half sibling and step labels.
- [x] Great aunt, great niece, cousin degree and cousin removal labels.
- [x] Ambiguous shortest relationship paths are detected by the relationship finder.
- [x] Family junction centring regression test.
- [x] Existing ELK collision handling regression test.
- [x] Desktop and mobile browser test suites completed successfully.

## Data migration and portability
- [ ] Verify a representative real legacy backup with compound names and multiple partnerships.
- [ ] Verify export and reimport of a migrated project.
- [ ] Confirm custom attributes and manual positions survive that round trip.
- [ ] Confirm multiple name changes across multiple partnerships preserve the correct current name.

## Person fields and completeness
- [ ] Verify a legacy unstructured name remains recoverable while structured fields are edited.
- [ ] Verify middle name is optional.
- [ ] Verify manual incomplete remains independent from automatic completeness.
- [ ] Verify gender indicator accessibility and appearance.
- [ ] Verify person incomplete state in both themes.

## Dates
- [x] Year only, month and year, and full date schema validation.
- [x] Invalid month and calendar dates rejected.
- [x] Partial date comparisons do not invent precision.
- [x] Month precision birth date interface entry.
- [ ] Verify year only and full date interface entry for both birth and death.
- [ ] Verify partial precision partnership dates in the interface.

## Relationship completeness
- [ ] Verify manual incomplete parentage and partnership flags through edit, save, reload and export.
- [ ] Verify red markers on all relationship line types and family junctions in both themes.
- [ ] Verify no incompleteness overview or dashboard is present.

## Kinship
- [x] Parent, child, grandparent and grandchild.
- [x] Gender neutral direct labels.
- [x] Aunt, great aunt, niece and great niece.
- [x] Cousin degree and removal.
- [x] Half siblings and step relationships.
- [x] Ambiguous shortest paths are reported.
- [ ] Add dedicated tests for adoption and complex multiple-parent ambiguity.
- [ ] Verify relationship finder label and highlighted path agreement for complex kinship structures.

## Layout
- [x] Family junction centred between parent and child group centres.
- [x] Existing disconnected-node collision test passes.
- [ ] Verify larger sibling groups remain contiguous.
- [ ] Verify parents are placed toward outer sides where feasible.
- [ ] Verify overlapping family groups and multiple partnerships.
- [ ] Inspect edge crossings and edge routing on complex real trees.
- [ ] Confirm manual positions and drag behaviour on representative trees.

## Dark mode
- [x] Toggle from light to dark and back.
- [x] Preference survives reload.
- [x] Light remains the default without a saved preference in the browser test.
- [ ] Visually inspect all panels, dialogs, cards, junctions, lines, handles and controls.
- [ ] Verify contrast on selected, dimmed and incomplete states on desktop and mobile.

## Regression and delivery
- [x] Production build.
- [x] PWA build verification.
- [ ] Final visual inspection on representative family data.
- [ ] Open pull request after remaining implementation and verification are complete.
- [ ] Obtain explicit approval before merging to main.
