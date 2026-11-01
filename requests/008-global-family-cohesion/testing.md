# Request 008 testing checklist

## Status

Implementation is available in PR #8. GitHub Actions run 320 completed successfully on 2026-11-01. TypeScript, all 57 unit tests, all 10 Playwright tests, production build, and PWA verification passed. A visual inspection using the user's populated family tree has not been performed.

## Global layout behaviour

- [x] Three-generation fixture preserves coherent ancestry branch ordering.
- [x] Grandparents do not arbitrarily switch sides relative to the descendant branch.
- [ ] Local family centring does not fragment a larger branch.
- [x] Siblings remain grouped, including half siblings.
- [ ] Partners and shared children remain close where feasible.
- [ ] Multiple partnerships and overlapping family groups remain readable.
- [x] Distinct exact parent sets retain distinct junctions.
- [x] Each person has exactly one node and one position.
- [x] Disconnected people remain laid out without overlaps.
- [x] Repeated layout of identical input produces stable ordering.
- [x] Gender has no influence on horizontal side assignment.

## Geometry and routing

- [x] Person cards do not overlap.
- [ ] Junctions do not overlap person cards.
- [ ] Relationship lines do not pass through cards.
- [ ] Global edge crossings and unnecessary detours are reduced on representative fixtures.
- [ ] Generation bands remain consistent.
- [ ] Existing local parent-child centring remains where compatible.

## Regression

- [x] Existing Request 007 layout tests pass.
- [ ] Manual positions override automatic positions.
- [ ] Drag behaviour and saved manual positions remain unchanged.
- [ ] Incompleteness behaviour remains unchanged.
- [ ] Dark mode remains unchanged.
- [ ] Relationship semantics remain unchanged.
- [ ] Import/export compatibility remains unchanged.

## Build and browser verification

- [x] TypeScript check.
- [x] Full unit and domain test suite: 57 tests passed across 9 files.
- [x] Playwright browser tests: 10 passed.
- [x] Playwright browser tests completed successfully.
- [x] Production build.
- [x] PWA verification.
- [ ] Visual inspection of representative multigenerational trees.
- [ ] Before and after comparison using the same fixtures.

Record actual test results below after implementation. Do not mark checks complete until performed.

## Results

GitHub Actions run 320, run ID `41334435323`, completed successfully. The test suite reported 9 files passed and 57 tests passed. Playwright reported 10 passed. Type checking, production build, and PWA verification also passed.

The configured dependency audit passed at its `high` severity threshold. npm reported 10 existing low or moderate dependency advisories during installation. No dependency changes were made as part of this request.

Visual inspection of the user's actual populated family tree remains outstanding.
