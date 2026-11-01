# Request 010 testing

## Implementation status

The recursive layout rewrite has been implemented on `request/010-recursive-family-ordering`. CI verification is pending.

## Automated coverage added

- [x] Simple multigenerational sibling and parent ordering remains covered.
- [x] Full and half sibling networks remain together.
- [x] Exact parent-set junctions remain distinct.
- [x] Ancestor sibling expansion includes cousin branches.
- [x] Multiple partnerships do not duplicate a person.
- [x] Partnership-connected ancestry components are kept adjacent without merging their generation calculations.
- [x] Person and relationship insertion order does not change the resulting positions.
- [x] Every person receives one position.
- [x] Cards in the same generation do not overlap.
- [x] Gender-independent ordering remains covered.
- [x] Repeated calculations remain deterministic.
- [x] Invalid ancestry still returns no automatic positions and has a safe flat fallback.

## Verification to run

- [ ] TypeScript typecheck.
- [ ] Full unit and domain tests.
- [ ] Playwright desktop and mobile tests.
- [ ] Production build.
- [ ] PWA build verification.
- [ ] Import/export regression tests.
- [ ] Visual inspection of representative complex family fixtures.
- [ ] Confirm the automatic layout path no longer calls the old barycentre and crossing-score sweeps.

Do not mark these checks as passed until the corresponding CI results have completed.
