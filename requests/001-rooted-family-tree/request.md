# Request 001: Rooted family tree application

## Status

Approved. Phase 1 foundation implemented; verification pending.

## Desired outcome

Build Rooted, a polished, minimalist, installable and offline-capable web application for creating and exploring one personal family tree.

The tree is the main interface. People are connected through clearly represented family relationships and automatically arranged into generations. Each person can hold flexible custom attributes.

## Context

The repository was created for Rooted and was empty before this request. The product concept and design decisions were developed with Oliver before implementation planning.

The visual direction is a warm, Storyteller-inspired paper aesthetic. Brown is the primary colour and olive green is a restrained secondary accent.

## Required behaviour

### People

- Create, edit, and delete people.
- Standard fields: name, birth date, death date.
- Arbitrary custom attributes with editable names and values.
- Support text, numbers, dates, and other sensible primitive values.
- Person cards show name, birth/death years, and one selected custom attribute.
- No photos.
- Clicking a person opens a compact popup with their information and relationships.

### Relationships

Support biological parenthood, adoptive parenthood, step-parent relationships, guardianship, marriage, and non-marital partnerships.

- People and relationships are stored separately.
- Support multiple partnerships, relationship dates, ended relationships, and remarriage.
- Support connecting an existing person to avoid duplicates.
- Sibling relationships are derived from shared parents.
- Reject circular ancestry and contradictory generation assignments.
- Biological and adoptive parenthood determine generations. Step-parent and guardian relationships do not.

### Generations and canvas

- Generations are calculated automatically and cannot be manually overridden.
- Parents appear one generation above children.
- Marriage and partnership do not change generation.
- Automatic layout is the default.
- Users can directly drag people vertically within their generation.
- Manual position adjustments persist through ordinary edits.
- Relationship lines update automatically after movement.
- An explicit automatic-layout action can restore calculated positioning.
- Marriage and partnership connections use a line with a small symbol.
- Children connect through the relevant shared partnership junction where appropriate.

### Minimal user experience

- The canvas is the primary interface.
- Avoid permanent sidebars, nested menus, dropdowns over dropdowns, and unnecessary settings surfaces.
- Prefer direct actions on or near the relevant person.
- Adding a relative should be contextual and require as few steps as practical.
- Avoid stacked modal dialogs.
- Search, zoom, pan, undo, redo, and layout actions must remain easy to discover without clutter.
- Full editing support on mobile, including touch drag and pinch zoom.

### Visual identity

- Warm beige paper-inspired background and cream person cards.
- Brown is the primary text, line, and structural colour.
- Olive green is a restrained accent for selected states and occasional emphasis.
- Elegant serif headings and clean sans-serif interface text.
- Subtle borders and shadows.
- No photos, loud gradients, or unnecessary decoration.

### Storage, PWA, and offline

- Store the family tree locally in IndexedDB.
- Automatically save changes.
- Provide manual JSON export and import.
- Validate imported data before replacing the current tree.
- Make the app installable as a PWA on supported desktop and mobile browsers.
- Cache the application shell and required static assets with a service worker.
- After the first successful online load and cache activation, the app must open and all core family-tree functionality must work offline.
- People, relationships, search, layout, edits, undo/redo, and JSON import/export must not require network access.
- Avoid runtime dependencies on remote fonts, icon services, or APIs.
- Support the repository's GitHub Pages subpath correctly.

## Scope

### Included

- One local family tree.
- People, custom attributes, and detailed relationships.
- Strict automatic generations.
- Interactive canvas and automatic layout.
- Direct manual positioning.
- Compact person popups.
- Minimal desktop and mobile UX.
- Undo and redo.
- Search and branch highlighting.
- IndexedDB autosave.
- JSON import/export.
- Installable offline-capable PWA.
- GitHub Pages deployment.

### Not included

- Accounts, cloud sync, or collaboration.
- Multiple independent trees.
- Photos.
- Public sharing or hosted family profiles.
- AI-generated family information.
- Historical document management.
- Native app-store distribution.

## Acceptance criteria

- [ ] A user can create and edit people and arbitrary attributes.
- [ ] All specified relationship types can be created, edited, and removed.
- [ ] Existing people can be connected without creating duplicates.
- [ ] Circular or generation-inconsistent ancestry is rejected with a clear explanation.
- [ ] Generations are calculated consistently and cannot be manually overridden.
- [ ] Marriage/partnership symbols and child connections remain understandable with multiple partnerships.
- [ ] Automatic layout works for complex trees; manual drag positions persist.
- [ ] Person cards show the specified medium detail and open a compact popup.
- [ ] Core actions are direct and the interface avoids nested menus and stacked dialogs.
- [ ] Full tree editing works on mobile touch screens.
- [ ] Changes persist after reload through IndexedDB.
- [ ] JSON export and import preserve the complete tree and layout preferences.
- [ ] Invalid imports do not damage or replace existing data.
- [ ] The PWA is installable and correctly scoped under the GitHub Pages project path.
- [ ] After an initial successful online load, the app shell and all core functionality work offline.
- [ ] Production build and automated tests pass.
- [ ] Deployment is verified and request notes record only checks actually performed.

## Open questions

No blocking product questions remain for the first implementation plan. Exact colour tokens and detailed interaction layouts may be refined during implementation without changing the established product direction.
