# PWA and offline behaviour

## Requirements

- Rooted must be installable as a PWA on supported desktop and mobile browsers.
- After the first successful online load and service-worker cache population, the application shell and all core family-tree operations must work offline.
- IndexedDB stores user data. Service-worker caches store application assets only.
- Do not depend on remote fonts, icon services, APIs, or other runtime network resources.

## Planned implementation

Use the Vite PWA integration with Workbox to generate the web app manifest and service worker. Precache the production app shell and local static assets. Configure start URL, scope, icons, and service-worker registration for the GitHub Pages project subpath.

Offline acceptance includes launch/reload, editing people and relationships, search, layout, undo/redo, and JSON import/export.

## Deployment caution

A GitHub Pages project site is hosted below a repository-specific path. Manifest URLs, icons, service-worker registration, scope, and navigation fallback must all respect Vite's configured base path.

## Verification

Test the deployed build after a successful online visit, then disable network access and verify the app remains usable after reload and app restart. Also test update behaviour without losing IndexedDB data or in-progress edits.
