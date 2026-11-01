# Rooted

A minimalist, offline-first family tree web app.

Rooted is designed as an interactive family history book: a warm paper-inspired canvas, clear family relationships, automatic generations, and flexible personal details.

## Product principles

- Minimal UI and the easiest possible UX. Keep actions direct and avoid nested menus.
- Brown is the primary colour; olive green is a restrained accent.
- Installable PWA with core functionality available offline after the first successful online load.
- Local-first data storage with explicit JSON import and export.
- Relationship data is the source of truth; canvas layout is only a visualization.

## Current implementation

The approved initial implementation is in progress on `request/001-rooted-family-tree`.

- Create, edit, and delete people, including custom attributes.
- Create, edit, and remove biological, adoptive, step-parent, guardian, marriage, and partnership relationships.
- Automatically calculate generations and reject circular or inconsistent ancestry.
- Use ELK.js for automatic layout, with persistent manual horizontal positioning.
- Connect shared children through partnership junctions.
- Search people, inspect profiles, and use undo/redo.
- Save locally in IndexedDB and import or export validated JSON backups.
- Generate a PWA manifest and service worker for offline app assets.
- Provide a GitHub Pages deployment workflow for the main branch.

Browser testing, offline verification, and the first Pages deployment still need to be completed.

## Development

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Project documentation

- `docs/knowledge/README.md`: reusable project knowledge.
- `docs/decisions.md`: durable product and architecture decisions.
- `requests/README.md`: request-first development workflow.
- `requests/001-rooted-family-tree/`: initial product and implementation request.
