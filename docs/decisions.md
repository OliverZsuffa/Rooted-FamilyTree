# Product and architecture decisions

Durable decisions explicitly established for Rooted.

## Product

- Product name: Rooted.
- Purpose: personal family tree.
- One tree per project.
- No person photos.
- People have standardized name and life-date fields plus freely customizable attributes.
- Person cards use medium detail: name, birth/death years, and one selected custom attribute.
- Selecting a person opens a compact popup.
- Marriage and partnership links use a line with a small symbol.
- Detailed relationship types are supported: biological parent, adoptive parent, step-parent, guardian, marriage, and partnership.
- Generations are strict and automatically calculated. They cannot be manually overridden.
- Canvas positioning is automatic by default, with direct manual dragging.
- Full mobile editing support is required.

## Visual design and UX

- Warm beige paper-like surfaces.
- Brown is the primary colour.
- Olive green is a secondary accent used sparingly.
- Minimal UI and easiest-possible UX are core product requirements, not optional polish.
- Avoid nested menus, dropdowns over dropdowns, unnecessary controls, and persistent interface clutter.
- Prefer direct contextual actions and keep the family tree as the primary interface.

## Storage and privacy

- Local-first application with IndexedDB as the primary persistence layer.
- Automatic local saving and manual JSON import/export.
- No accounts, cloud synchronization, or collaborative editing in the initial scope.
- Core functionality must work offline after the initial successful online load and service-worker cache population.

## Architecture direction

- React, TypeScript, and Vite.
- React Flow for the interactive canvas.
- ELK.js for automatic layout.
- Keep domain data independent from canvas-library state.
- Installable PWA with a service worker and a web app manifest.
- GitHub Pages deployment.
