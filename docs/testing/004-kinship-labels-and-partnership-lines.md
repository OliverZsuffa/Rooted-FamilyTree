# Request 004 verification

## Automated checks

Commit: `76b9d4371ac8f5ad9c8bc9903cf36755b183de30`

GitHub Actions passed both the branch push and pull request workflows.

- Dependency audit: passed at the configured `--audit-level=high` threshold. The report still contains 2 low and 8 moderate advisories.
- TypeScript: passed.
- Unit tests: 8 test files, 37 tests passed.
- Playwright: 4 passed, 2 skipped. The skips are the desktop variants of tests that are specifically intended for mobile Chromium.
- Production build: passed.
- PWA verification: passed.

## Covered behaviour

- Family groups are based on exact biological and adoptive parent sets.
- A single parent can connect to multiple family groups without duplicating their person card.
- Marriage does not imply parentage.
- Partnership edges use separate curved side connections.
- Kinship calculations cover direct ancestry, neutral wording, aunt and cousin relationships, half siblings, step-parent and stepchild relationships, and unrelated people.
- Existing version 1 backups default missing gender, name history, and partnership name-change fields.
- Browser tests cover family connection display, optional gender, a marriage name change, name history persistence, previous-name search, and mobile canvas behaviour.

## Manual verification still outstanding

- Test the updated family-group layout and partnership paths on a physical Android device, particularly for large trees and multiple partnerships.
- Check the final visual spacing with a real family tree containing half siblings and one parent connected to multiple family groups.
