# Local storage and portability

## Implementation

- IndexedDB database: `rooted-local`.
- Object store: `projects`.
- Active project key: `active`.
- Database version: 1.
- Project JSON schema version: 1.
- Changes are automatically saved after a short debounce.
- The project schema validates people, typed relationships, dates, custom attributes, and layout coordinates.

## Backup behaviour

- Export downloads the complete project as `rooted-family-tree.json`.
- Import validates the schema, unique person and relationship identifiers, relationship references, partnership endpoints, and ancestry consistency before asking for confirmation.
- Invalid imports leave the current tree untouched.
- The backup includes people, relationships, custom attributes, project metadata, and manual layout coordinates.

## Offline behaviour

Normal editing, search, layout, undo/redo, import, and export require no network access after the application shell has been cached.

Local browser storage is not a substitute for a manual backup. Clearing browser data or losing the device can remove the only local copy.

## Verification still required

Automated persistence tests, schema migration tests, browser reload tests, and offline reload tests remain outstanding.
