# Request 010 testing

## Implementation status

The recursive layout rewrite is implemented on `request/010-recursive-family-ordering` and under review in [PR #11](https://github.com/OliverZsuffa/Rooted-FamilyTree/pull/11).

## Automated coverage

- [x] Simple multigenerational family ordering.
- [x] Ancestor sibling expansion and collateral cousin branches.
- [x] Full and half sibling networks.
- [x] Multiple partnerships with distinct exact-parent-set junctions.
- [x] Multiple discovery paths and pedigree collapse without duplicate people.
- [x] Disconnected ancestry components.
- [x] Isolated people with no known parents.
- [x] Partnership-connected ancestry components without merging generation calculations.
- [x] Gender-independent ordering.
- [x] Deterministic output independent of person and relationship insertion order.
- [x] Every person receives exactly one position.
- [x] Exact parent-set family junctions remain distinct.
- [x] No person card overlaps within a generation.
- [x] Existing manual drag and persistence browser coverage.
- [x] Existing relationship edge construction and endpoint tests.
- [x] Desktop and mobile browser regression for cousin branch ordering.
- [x] The previous barycentre and crossing-score sorting implementation has been removed from the automatic layout path.

## CI verification

Latest pull request workflow run: [Run #364](https://github.com/OliverZsuffa/Rooted-FamilyTree/actions/runs/41341144498).

- [x] TypeScript typecheck passed.
- [x] Unit tests passed: 68 tests across 10 files.
- [x] Playwright passed: 14 tests, 2 existing project-specific skips. The new recursive cousin ordering test passed on desktop and mobile Chromium.
- [x] Production build passed.
- [x] PWA build verification passed.
- [x] Dependency audit passed at the configured high severity threshold.

## Remaining verification limitations

- [ ] Automated assertion that visible family junctions never overlap after manual person positioning. The domain layout spaces its returned junction coordinates, but the application currently calculates visible junction positions from visible person coordinates.
- [ ] Dedicated automated test of manual position precedence over automatic positions. The existing application merge path was left unchanged, and drag persistence browser coverage passed.
- [ ] Dedicated import/export regression for this layout rewrite. The project schema and import/export code were not changed.
- [ ] Visual inspection of the user's own populated family tree. It has not been accessed or visually reviewed in this implementation.

## Existing warnings

- The configured security audit reports no high severity vulnerabilities. npm reports 10 existing low or moderate advisories.
- The production build retains the existing warning about a JavaScript chunk exceeding 500 kB after minification.

No changes to the application schema, relationship semantics, cards, editor, or manual drag persistence were made.
