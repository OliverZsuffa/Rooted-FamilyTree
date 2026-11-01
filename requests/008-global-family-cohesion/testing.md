# Request 008 testing checklist

## Status

Planning only. No application code has been changed and no tests have been run for this request.

## Global layout behaviour

- [ ] Three-generation fixture preserves coherent ancestry branch ordering.
- [ ] Grandparents do not arbitrarily switch sides relative to the descendant branch.
- [ ] Local family centring does not fragment a larger branch.
- [ ] Siblings remain grouped, including half siblings.
- [ ] Partners and shared children remain close where feasible.
- [ ] Multiple partnerships and overlapping family groups remain readable.
- [ ] Distinct exact parent sets retain distinct junctions.
- [ ] Each person has exactly one node and one position.
- [ ] Disconnected people remain laid out without overlaps.
- [ ] Repeated layout of identical input produces stable ordering.
- [ ] Gender has no influence on horizontal side assignment.

## Geometry and routing

- [ ] Person cards do not overlap.
- [ ] Junctions do not overlap person cards.
- [ ] Relationship lines do not pass through cards.
- [ ] Global edge crossings and unnecessary detours are reduced on representative fixtures.
- [ ] Generation bands remain consistent.
- [ ] Existing local parent-child centring remains where compatible.

## Regression

- [ ] Existing Request 007 layout tests pass.
- [ ] Manual positions override automatic positions.
- [ ] Drag behaviour and saved manual positions remain unchanged.
- [ ] Incompleteness behaviour remains unchanged.
- [ ] Dark mode remains unchanged.
- [ ] Relationship semantics remain unchanged.
- [ ] Import/export compatibility remains unchanged.

## Build and browser verification

- [ ] TypeScript check.
- [ ] Full unit and domain test suite.
- [ ] Playwright desktop tests.
- [ ] Playwright mobile tests.
- [ ] Production build.
- [ ] PWA verification.
- [ ] Visual inspection of representative multigenerational trees.
- [ ] Before and after comparison using the same fixtures.

Record actual test results below after implementation. Do not mark checks complete until performed.

## Results

Not run. Awaiting approval.
