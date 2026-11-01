# Request 011 testing plan

## Status

Planning only. No code changes or tests have been run for this request.

## Screenshot-derived regression fixtures

### Fixture A: Incorrect left-side parent connection

Create two parent cards and one child card with one exact-parent-set family junction. Assert:

- Parentage edge source is the parent card.
- Parentage edge target is the family junction.
- Source handle is the parent's bottom parentage output.
- Target handle is the junction's top input.
- The rendered path begins at the bottom edge of the parent card.
- No segment loops around the left or right side of the parent card.

### Fixture B: Two family groups sharing a parent

Create the exact relationship structure represented by the second screenshot: a shared parent participates in two distinct exact-parent-set family groups, each with its own other parent and child branch.

Assert:

- The two family groups retain distinct IDs and junction nodes.
- Each group connects only its own recorded parent set and children.
- Each group receives a distinct route lane where the horizontal spans overlap.
- The rendered routes do not have the avoidable intersection or overlap shown in the screenshot.
- The shared parent's card is not used as a reason to merge the family junctions.

## Domain test coverage

- Exact source and target handle IDs for parentage edges.
- Exact source and target handle IDs for partnership edges.
- Explicit handle behaviour for step-parent and guardian relationships.
- Authoritative junction positions with and without manual person overrides.
- Junction collision spacing.
- Deterministic route lane assignment independent of insertion order.
- Shared-parent groups and multiple children.
- Filtering and missing endpoint behaviour.
- Route recalculation after effective coordinate changes.

## Browser test coverage

- Screenshot-derived fixture A on desktop and mobile.
- Screenshot-derived fixture B on desktop and mobile.
- Verify rendered SVG path endpoints against handle coordinates.
- Verify separate route corridors and absence of avoidable intersections in the fixture's generation gap.
- Verify manual drag updates route geometry.
- Verify partnership paths continue to connect to side handles.
- Verify selection highlighting and incomplete relationship styles.

## Full CI

- [ ] TypeScript typecheck.
- [ ] Unit tests.
- [ ] Playwright.
- [ ] Production build.
- [ ] PWA verification.
- [ ] Dependency audit.

No result is marked passed until implementation exists and the corresponding check has actually run.