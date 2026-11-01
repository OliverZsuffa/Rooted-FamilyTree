# Testing

## Automated checks

- [x] TypeScript type check
- [x] Unit tests: 54 passed across 9 files
- [x] Production build
- [x] PWA build verification
- [x] Playwright browser tests: 10 passed

## Layout-specific acceptance checks

- [x] Two parents are above their children, and the sibling group's centre aligns with the midpoint between the parents when there is sufficient space.
- [x] A single-parent sibling group is centred beneath that parent.
- [x] Full and half siblings sharing a recorded parent remain adjacent.
- [x] Children with different recorded parent sets retain separate junctions.
- [x] Each person has exactly one position.
- [x] Cards in the same generation do not overlap.
- [x] Existing manual positions continue to override automatic positions. The application code retaining manual position precedence was left unchanged.
- [x] No partnership-only parentage is inferred. The layout consumes recorded parentage only.

## Verification run

GitHub Actions run 307 completed successfully on 2026-11-01. The workflow passed type checking, all unit tests, browser tests, production build, and PWA verification.

## Manual verification

No separate visual inspection of a populated real family tree was performed in the browser. The layout-specific automated tests cover the core positioning rules.
