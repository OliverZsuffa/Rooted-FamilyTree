# Implementation plan: Rooted family tree

**Status:** Awaiting Oliver's explicit approval. No application code has been implemented.

## 1. Repository and baseline

- Confirm the repository structure and establish the project documentation.
- Set up a focused implementation branch after plan approval.
- Use React, TypeScript, and Vite.
- Configure GitHub Pages deployment with the correct project subpath.
- Establish automated formatting, type checking, tests, and production build commands.

## 2. Domain model and validation

Create a normalized domain model independent of React Flow:

- Person records with standardized name and life dates, flexible attributes, and selected card attribute.
- Parentage relationship records distinguishing biological, adoptive, step-parent, and guardian links.
- Partnership records distinguishing marriage and non-marital partnership, with optional start/end dates.
- Project metadata and persisted layout preferences.
- Versioned JSON schema for reliable import/export.

Use runtime schema validation. Centralize relationship operations and enforce invariants before changing state.

Generation rules:
- Biological and adoptive parenthood contribute to ancestry generation.
- Step-parent and guardian relationships do not determine generation.
- Marriage and partnership do not determine generation.
- Reject cycles and parentage that would assign incompatible generations.
- Keep generation calculation separate from visual positioning.

## 3. Canvas and layout

- Use React Flow with custom person nodes and relationship edges.
- Represent partnerships with dedicated junction nodes and a small marriage/partnership symbol.
- Connect children to the appropriate parent or partnership junction, supporting cases where parents are not partnered.
- Use ELK.js for initial and explicit automatic layout.
- Keep domain relationships as the source of truth; React Flow nodes and edges are derived visualization state.
- Persist manual position adjustments separately from domain relationships.
- Constrain manual vertical movement to the person's generation band.
- Recalculate edges after movement and preserve manual positions during ordinary edits.
- Provide an explicit action to restore automatic layout.

## 4. Minimal UX and responsive interaction

- Keep the canvas central and avoid a permanent sidebar.
- Use a small, stable set of visible actions.
- Put add-relative actions directly on the relevant person or in its compact popup.
- Use one compact person popup for viewing and editing rather than stacking dialogs.
- Provide search through a single easy-to-reach control.
- Keep zoom, fit-tree, undo, redo, and automatic-layout actions accessible without a nested menu system.
- On mobile, use touch-friendly controls and a compact action surface rather than shrinking the desktop toolbar.
- Support touch dragging, pinch zoom, and a usable popup layout.
- Use olive sparingly; brown remains the dominant colour.

## 5. Local persistence and portability

- Use IndexedDB for the project and layout data.
- Autosave after committed edits, with clear but unobtrusive save status.
- Add versioned JSON export and validated import.
- Validate the complete imported document before changing stored data.
- Make import replacement explicit and preserve the existing tree if validation or writing fails.
- Include people, relationships, custom attributes, and manual layout preferences in backups.
- No backend or network dependency for normal use.

## 6. PWA and offline support

- Use the Vite PWA integration with Workbox to generate a web app manifest and service worker.
- Configure app name, standalone display mode, theme colour, icons, start URL, scope, and Vite base path for GitHub Pages.
- Precache the production app shell, scripts, styles, fonts, and icons.
- Keep all required fonts and icons local so no remote asset is needed at runtime.
- Register the service worker in production and verify its scope under the repository subpath.
- Provide an offline fallback for navigation and cache versioning/update handling.
- Avoid caching any remote API because the application has no runtime backend.
- Ensure IndexedDB remains the source of user data; service-worker caches contain app assets only.
- Verify that a first online visit activates the cache, then test a fresh reload and all core operations with network disabled.
- Use a safe update flow that does not unexpectedly discard an in-progress edit.

## 7. Testing

Add automated tests for:
- Relationship validation and cycle detection.
- Generation calculation with biological and adoptive parentage.
- Step-parent and guardian links not affecting generation.
- Multiple partnerships and parent junction construction.
- Import/export round trips and invalid import rejection.
- Persistence and migration behaviour.
- Layout mapping and manual-position preservation.

Run:
- TypeScript type check.
- Unit and component tests.
- Production build.
- GitHub Actions checks.
- Browser tests for desktop and mobile layouts where practical.

Manual PWA verification must cover installability, offline launch after initial cache population, offline editing and reload, and update behaviour.

## 8. Deployment and review

- Deploy through GitHub Pages using a reproducible Actions workflow.
- Verify all assets, manifest, and service-worker paths under the project subpath.
- Verify the deployed application can be installed and used offline.
- Review the complete diff and record actual test outcomes.
- Update reusable knowledge documents after implementation.
- Open a pull request and wait for review.
- Merge into main only after successful checks and explicit review.

## Main risks and mitigations

- **Complex family structures:** keep relationships normalized and validate generation rules centrally.
- **Layout complexity:** use partnership junction nodes and test multiple marriages and siblings early.
- **Manual layout instability:** separate manual coordinates from relationship data and preserve them during routine recalculation.
- **Mobile canvas usability:** test touch interactions early rather than treating mobile as a final styling pass.
- **GitHub Pages PWA paths:** test manifest, service worker, icons, and navigation under the actual repository base path.
- **Offline data safety:** keep user data in IndexedDB, not service-worker caches, and validate imports before replacement.
- **Minimal UI drift:** review every new control against the principle that the simplest direct interaction should win.
