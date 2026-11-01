# Implementation plan: Rooted family tree

**Status:** Approved by Oliver. The initial functional application has been implemented on the request branch. Automated verification is in progress. Browser testing and deployment remain outstanding.

## 1. Repository and baseline

- [x] Establish repository documentation and request-first workflow.
- [x] Create focused implementation branch.
- [x] Set up React, TypeScript, and Vite.
- [x] Configure the GitHub Pages project base path.
- [x] Add type checking, unit tests, and production build commands.

## 2. Domain model and validation

- [x] Versioned project schema for people, parentage, partnerships, and layout.
- [x] Custom person attributes.
- [x] Runtime validation for project data and backup imports.
- [x] Biological, adoptive, step-parent, and guardian relationships.
- [x] Marriage and non-marital partnership records with dates.
- [x] Automatic generation calculation, cycle detection, and incompatible generation validation.
- [x] Derived sibling relationships.

## 3. Canvas and layout

- [x] React Flow canvas with custom person nodes and relationship edges.
- [x] ELK.js automatic layout.
- [x] Partnership junction visualization for shared children.
- [x] Persisted manual positions constrained to generation rows.
- [x] Explicit automatic layout reset.

## 4. Minimal UX and responsive interaction

- [x] Canvas centred as the main interface.
- [x] Compact person profile panel and editing dialog.
- [x] Create a new relative or connect an existing person.
- [x] Search, zoom, pan, and fit view.
- [x] Undo and redo, including keyboard shortcuts.
- [x] Responsive toolbar and mobile canvas styling.
- [ ] Real-device mobile interaction verification.

## 5. Local persistence and portability

- [x] IndexedDB project storage and autosave.
- [x] Complete JSON export.
- [x] Validated JSON import with explicit replacement confirmation.
- [ ] Automated persistence and migration tests.
- [ ] Browser reload and import/export round-trip verification.

## 6. PWA and offline support

- [x] Vite PWA integration and Workbox precaching configuration.
- [x] Manifest, local icon, standalone display, and project subpath scope.
- [x] Service-worker registration and user prompted updates.
- [x] GitHub Pages deployment workflow.
- [ ] Confirm deployment and verify actual manifest and service-worker paths.
- [ ] Verify installability and all core features offline.

## 7. Testing

- [x] Domain and backup validation tests.
- [x] GitHub Actions workflow for type checking, tests, and production build.
- [ ] Confirm the latest automated run succeeds.
- [ ] Add persistence and component interaction tests.
- [ ] Complete desktop, mobile, and offline manual verification.

## 8. Deployment and review

- [x] Add reproducible GitHub Pages Actions workflow.
- [ ] Review the complete implementation diff.
- [ ] Merge only after successful checks and explicit review.
- [ ] Verify the deployed application.
- [ ] Record actual PWA and offline test results.

## Main risks and mitigations

- **Complex family structures:** normalized relationships and centralized generation validation.
- **Layout complexity:** ELK layout and partnership junction nodes.
- **Manual layout instability:** manual coordinates remain separate from relationship data and vertical placement is generation constrained.
- **Mobile canvas usability:** dedicated mobile styling; real-device testing remains required.
- **GitHub Pages PWA paths:** base path and relative manifest scope are configured; deployed verification remains required.
- **Offline data safety:** IndexedDB stores user data; service-worker caches only app assets; imports are validated before replacement.
- **Minimal UI drift:** keep direct actions and avoid nested settings surfaces.
