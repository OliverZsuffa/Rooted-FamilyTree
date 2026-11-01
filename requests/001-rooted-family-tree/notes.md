# Implementation notes: Rooted family tree

## Current status

Oliver approved the implementation plan. The initial functional application is being built on `request/001-rooted-family-tree`. The latest GitHub Actions checks are being monitored. No deployment or merge has been performed.

## Repository

- Repository: OliverZsuffa/Rooted-FamilyTree
- Default branch: main
- Working branch: request/001-rooted-family-tree

## Implemented

- React, TypeScript, Vite 8, Tailwind CSS, React Flow, ELK.js, Zod 4, IndexedDB, Lucide, and Vite PWA integration.
- Warm paper visual identity with brown as the primary colour and olive as the accent.
- People with names, life dates, custom text, number, date, and boolean attributes.
- Custom person card attribute selection.
- Create, edit, and delete people.
- Create, edit, and remove biological, adoptive, step-parent, guardian, marriage, and non-marital partnership relationships.
- Optional partnership start and end dates, including ended partnerships and multiple records.
- Create a new relative directly while creating a relationship.
- Strict automatic generations, ancestry cycle detection, and incompatible generation validation.
- Derived sibling relationships.
- ELK automatic layout, generation constrained vertical movement, and persisted manual positions.
- Partnership junction nodes for shared children.
- Search, profile panel, undo, redo, and keyboard shortcuts.
- IndexedDB autosave.
- Validated JSON import and full JSON export.
- PWA manifest, local icon, Workbox service worker, and user prompted app updates.
- GitHub Pages deployment workflow for the main branch.

## Verification

- GitHub Actions runs dependency security checks, typecheck, unit tests, production build, and PWA path verification.
- The dependency audit passes the high severity threshold. Ten low or moderate advisories remain in transitive build tooling and should be reviewed separately.
- Several earlier runs exposed issues which were fixed on the request branch.
- A completed verification run passed type checking, all 19 then current unit tests, and the Vite 8 production build. A later test adds one more validation case and is awaiting its current run.
- The latest checks must be confirmed before declaring the implementation verified.
- No local browser test has been performed.
- The first GitHub Pages deployment has not been performed.
- Installability and offline behaviour still require manual verification on the deployed app.

## Remaining work

- Confirm the latest GitHub Actions run succeeds.
- Add automated persistence and UI interaction coverage.
- Review complex family structures, especially multiple partnerships and shared children.
- Verify desktop and mobile behaviour in a browser.
- Deploy through GitHub Pages after review and merge.
- Verify installation and offline behaviour on the deployed site.
