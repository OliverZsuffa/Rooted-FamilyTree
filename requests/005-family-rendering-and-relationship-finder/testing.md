# Request 005 testing plan

This file is a planned checklist. It must be updated with actual results after implementation. Do not mark checks as passed before running them.

## Family connection rendering

- [ ] Matching two-parent marriage uses one coherent family connection.
- [ ] Matching two-parent partnership uses the correct partnership symbol.
- [ ] Symbol is visible at the junction.
- [ ] Connector lines meet the symbol without an unexplained gap.
- [ ] No duplicate partnership line is rendered for a consolidated connection.
- [ ] Multiple children branch cleanly from the shared family connection.
- [ ] Partnership without shared children remains a separate connection.
- [ ] Partnership with a different parent set remains separate.
- [ ] One-parent family groups remain correct.
- [ ] Parent sets with more than two people remain correct.
- [ ] A person with children from multiple partnerships remains a single node.
- [ ] Existing edge highlighting works with consolidated connections.

## Relationship calculation

- [ ] Parent and child.
- [ ] Grandparent and grandchild.
- [ ] Full sibling and half-sibling.
- [ ] Aunt or uncle and niece or nephew.
- [ ] Cousin relationships.
- [ ] Adoptive relationships.
- [ ] Step relationships where supported by records.
- [ ] In-law relationships where supported by records.
- [ ] Gendered wording when supported by person data.
- [ ] Neutral wording when gender is unknown or nonbinary.
- [ ] Ambiguous paths are reported clearly.
- [ ] Unrelated people return no known relationship.
- [ ] Selecting the same person twice is handled clearly.
- [ ] Returned path includes all intermediate people and connectors.

## Relationship finder interface

- [ ] Finder can be opened and closed.
- [ ] First person can be selected using search.
- [ ] Second person can be selected using search.
- [ ] Both people are highlighted.
- [ ] The complete relationship path is highlighted.
- [ ] Unrelated parts of the tree are de-emphasized.
- [ ] Swap reverses the perspective and relationship wording.
- [ ] Clear restores the normal tree.
- [ ] Finder works for large trees.
- [ ] Finder works on mobile.
- [ ] Person details no longer show the large Family connections list.

## Regression and release checks

- [ ] ELK ordering is unchanged.
- [ ] Node positions and generation alignment do not regress.
- [ ] Crossing prevention does not regress.
- [ ] TypeScript check.
- [ ] Unit and domain test suite.
- [ ] Playwright desktop suite.
- [ ] Playwright mobile suite.
- [ ] Production build.
- [ ] PWA verification.
- [ ] Visual inspection of partnership symbols and child connection lines.
- [ ] Final diff review.
