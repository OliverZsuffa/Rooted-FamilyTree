# Testing plan

- [x] Add a layout regression for a shared parent with two partner branches, one containing one child and the other containing two siblings.
- [x] Assert the shared parent is first, then partner branches in descendant encounter order.
- [x] Assert children sharing an exact parent set remain adjacent.
- [x] Replace lane-specific edge assertions with a check that artificial route lane metadata is absent.
- [ ] TypeScript typecheck.
- [ ] Unit tests.
- [ ] Playwright.
- [ ] Production build.
- [ ] PWA verification.

The browser output still requires visual inspection. Passing domain tests alone does not establish that the screenshot is visually fixed.