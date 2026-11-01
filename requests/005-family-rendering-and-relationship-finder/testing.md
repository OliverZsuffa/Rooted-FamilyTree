# Request 005 testing results

## Family connection rendering

- [x] Matching two-parent marriage uses one coherent family connection.
- [x] Matching two-parent partnership uses the correct partnership symbol.
- [x] Symbol is rendered at the junction.
- [x] No duplicate partnership edge is emitted for a consolidated connection.
- [x] Partnership without shared children remains a separate connection.
- [x] One-parent family groups remain correct in domain tests.
- [x] A person with children from multiple partnerships remains a single node in the existing layout model.
- [ ] Independent manual visual inspection of line alignment and symbol spacing.

## Relationship calculation

- [x] Direct parent and child.
- [x] Grandparent and grandchild.
- [x] Full sibling and half-sibling through existing kinship tests.
- [x] Aunt or uncle and niece or nephew through existing kinship tests.
- [x] Cousin relationships through existing kinship tests.
- [x] Step relationships through existing kinship tests.
- [x] Sibling-in-law where supported by recorded partnership and parentage.
- [x] Ambiguous paths are reported.
- [x] Unrelated people return no known relationship.
- [x] Selecting the same person twice is handled.
- [x] Returned path includes intermediate people and relationship IDs.

## Relationship finder interface

- [x] Finder can be opened and closed.
- [x] First and second people can be selected using datalist inputs.
- [x] Both people and their connecting path are highlighted.
- [x] Swap reverses the relationship perspective.
- [x] Clear removes the result.
- [x] Person details no longer show the Family connections list.
- [x] Desktop and mobile browser tests cover the finder.

## Regression and release checks

- [x] ELK ordering code was not modified.
- [x] Generation calculation was not modified.
- [x] TypeScript check.
- [x] Unit and domain test suite.
- [x] Playwright desktop suite.
- [x] Playwright mobile suite.
- [x] Production build.
- [x] PWA verification.
- [ ] Physical Android device verification.

## CI result

GitHub Actions run for commit `90c947d7f9dc58cd2e208c3e07a679980a1c2901` passed all verification stages: dependency security check, TypeScript, unit tests, browser tests, production build, and PWA verification. The configured dependency audit still reports 2 low and 8 moderate advisories.
