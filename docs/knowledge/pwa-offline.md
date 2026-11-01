# PWA and offline behaviour

## Implementation

- Vite PWA integration with Workbox generates the web app manifest and service worker.
- The app uses a locally bundled SVG icon and system fonts.
- The production build precaches HTML, JavaScript, CSS, SVG, and other static app assets.
- Service-worker registration uses the PWA client hook. A new version prompts the user before updating.
- The Vite base path and manifest scope are configured for `/Rooted-FamilyTree/`.
- GitHub Pages deployment is defined in `.github/workflows/deploy.yml` and runs on pushes to `main`.

IndexedDB stores user data. Service-worker caches contain application assets only.

## Offline expectations

After the first successful online load and service-worker cache population, the app shell should launch without a network connection. People, relationships, search, layout, undo/redo, and JSON import/export use local code and IndexedDB.

No remote fonts, icon services, APIs, or hosted data are required at runtime.

## Verification still required

- Confirm the deployed manifest, icon, service-worker URL, and scope under the project subpath.
- Install the deployed PWA on supported desktop and mobile browsers.
- Visit once online, then disable networking and verify launch, reload, editing, search, layout, undo/redo, import, and export.
- Confirm update prompts do not affect IndexedDB data.
- The first deployment and manual offline verification have not yet been performed.
