# Local storage and portability

## Requirements

- IndexedDB is the primary local store.
- Changes are saved automatically.
- JSON export and import are available without a backend.
- The backup includes people, typed relationships, custom attributes, project metadata, and manual layout preferences.
- Imported data is fully validated before replacing the current project.
- A failed or invalid import must leave existing data untouched.

## Offline behaviour

Normal editing, search, layout, undo/redo, import, and export must work without network access after the application shell has been cached.

Local browser storage is not a substitute for a manual backup. Clearing browser data or losing the device can remove the only local copy.
