# Request 006 implementation plan

## Status

Awaiting explicit user approval. Planning and documentation only. Do not implement before approval.

## Goals

1. Improve the family layout using coherent family groups.
2. Support structured names and partial precision dates.
3. Track incomplete people and relationships directly in the tree.
4. Expand calculated kinship labels to cover extended family.
5. Add a complete, persistent dark theme.
6. Preserve existing data, improved ordering, manual positions, and offline operation.

## 1. Inspect and preserve the existing architecture

Before implementation, review:
- `src/domain/schema.ts` and project import validation.
- `src/domain/kinship.ts` and `src/domain/relationshipPath.ts`.
- `src/domain/familyGroups.ts`, `src/domain/layout.ts`, and `src/domain/relationshipEdges.ts`.
- Person and relationship editors and React Flow node rendering in `src/App.tsx`.
- Existing theme and component styling in `src/styles.css`.
- Existing tests and request 004 and 005 constraints.

Keep relationship data as the source of truth and canvas layout as a visualization. Reuse the existing kinship implementation instead of creating a competing relationship system.

## 2. Person names and name history

### Structured names

Replace the single editable name field with:
- First name, required for completeness.
- Middle name, optional.
- Last name, required for completeness.

Use a single display-name helper so cards, search, sorting, relationship finder pickers, and other UI surfaces format names consistently. Do not duplicate name formatting logic across components.

### Original and current names

- The editor must edit the person's original name fields, not overwrite them with a derived married name.
- Person cards continue to display the current name when a recorded partnership name change applies.
- Preserve name history and partnership references.
- Remove the effective date from name change records and their UI. Partnership start and end dates remain separate fields and are not used as a substitute for a name change effective date.
- Handle people with multiple partnerships and name changes without losing the original name or applying an unrelated partner's name.

### Existing data migration

Existing records contain a single `name` string. Migrate it conservatively:
- Preserve the original full string exactly.
- Do not guess how to split compound names, particles, or multi word surnames.
- Where a reliable split is not possible, retain the full value in a legacy or unstructured name field and allow the user to edit the structured fields.
- Ensure the old value remains visible and recoverable during conversion.
- Old name history entries may contain `effectiveDate`; accept and ignore that legacy field during import.
- Export the new canonical representation.
- Keep old backups importable. If schema versioning or a normalization layer is needed, implement it explicitly and test it.

## 3. Partial precision dates

Support three date precision levels for birth and death dates:
- Year only, such as `1984`.
- Month and year, such as `1984-03`.
- Full date, such as `1984-03-17`.

Represent precision explicitly or use a rigorously validated date value format. Do not manufacture missing month or day values. Update forms, display formatting, validation, sorting, and import/export.

Person cards should continue to show the year where known. The editor must show the actual stored precision.

Partnership start and end dates should also support the same precision levels for consistency. A missing partnership date is not automatically an error because it may genuinely be unknown.

## 4. Gender

- Keep gender nullable and default it to empty.
- Retain female, male, and nonbinary values.
- Add a subtle, accessible indicator to person cards when gender is known.
- Do not show a misleading indicator when gender is unknown.
- Include gender in automatic person completeness checks.

## 5. Completeness tracking

### Person completeness

Automatically incomplete when any of these are absent:
- First name.
- Last name.
- Gender.
- Birth date, including a year only value as valid information.

Middle name and death date are optional.

### Manual incompleteness

Add an explicit manual incomplete control to the person editor. Store the manual flag independently from automatic checks. Completing missing fields must not clear a manual flag. Clearing the manual flag must not suppress automatic warnings.

### Relationship completeness

- Provide manual incomplete marking for parentage relations, marriages, and partnerships.
- Show the marker on the corresponding relationship line or family junction.
- Show the reason or manual note in the relevant editor.
- Add automatic relationship checks only for genuinely required information or inconsistent records.
- Do not automatically mark an otherwise valid relationship incomplete just because an optional date is unknown.
- Keep invalid references and malformed records as validation errors, not merely visual warnings.

### Visual treatment

- Incomplete person cards use both a red border and a light red background.
- Incomplete relationship connections or junctions use a clearly visible but restrained red indicator.
- Preserve selected and relationship finder highlight states while ensuring incompleteness remains perceivable.
- Do not create an incompleteness overview, dashboard, count, or summary panel.

## 6. Kinship terminology and relationship finder

### Core principle

A great aunt is not a new stored relationship type. It is a calculated kinship relationship derived from the existing parentage graph. For example, a person's great aunt is a sibling of one of their grandparents.

Keep the underlying records explicit and calculate kinship terms from those records. The relationship finder should return the kinship term when one can be established, rather than falling back to a generic description such as "connected through recorded relationships".

### Extended direct family

Extend the existing kinship calculations to cover:
- Parents and children.
- Grandparents and grandchildren.
- Great grandparents and great grandchildren, including further generations.
- Siblings and half siblings.
- Aunts and uncles.
- Great aunts and great uncles, including further generations.
- Nieces and nephews.
- Great nieces and great nephews, including further generations.

The calculations must work in both directions and use neutral terms when gender is unknown or nonbinary.

### Cousins

Calculate cousin degree and removal from the closest shared ancestor where the graph supports an unambiguous result. Examples include first cousin, second cousin, first cousin once removed, and equivalent further degrees.

If multiple equally close shared ancestors or paths produce materially different descriptions, report ambiguity rather than silently selecting an arbitrary label.

### Other relationship types

- Preserve adoptive relationships and identify them where appropriate.
- Preserve step relationships and in-law relationships where partnership and parentage records establish them.
- Do not infer a relationship from names, dates, or visual proximity.
- Keep relationship finder path highlighting aligned with the kinship result.
- Add tests for multiple parents, half relationships, adoption, step families, multiple partnerships, and ambiguous paths.

## 7. Family centred layout

### Family group positioning

Use the existing family group model based on exact parent sets. Do not duplicate people when they appear in multiple groups.

For a two parent family:
- Keep the children in one horizontal sibling group.
- Centre the sibling group beneath the parents.
- Place the parents above the group, generally toward the outer sides of the children.
- Keep the family junction centred between parents and children.

For one parent, more than two parents, and overlapping family structures, use the closest coherent arrangement supported by the data.

### Global layout priorities

Use this priority order:
1. Never overlap person cards or junctions.
2. Keep siblings together.
3. Centre children relative to their family.
4. Keep parents close to the relevant family group.
5. Minimise crossings across the complete tree.

The priorities are soft constraints where necessary. A person who belongs to several family groups must remain a single node, and the layout must compromise where a perfect local arrangement would create severe global crossings.

### Edge routing

Address all reported visual problems:
- Lines crossing other lines.
- Lines passing through cards or junctions.
- Awkward family positioning.

Include partnership edges in layout considerations where practical. Improve routing and layering so edges avoid nodes and symbols remain legible. Keep family group membership rules intact.

### Preserve current improvements

- Retain ELK as the layout engine unless testing demonstrates a compelling reason otherwise.
- Preserve the improved ordering and collision prevention from the previous implementation.
- Avoid postprocessing that discards crossing minimisation.
- Preserve manual positions and existing drag behaviour.
- Do not regress generation calculation or the relationship finder.

## 8. Dark mode

### User experience

- Add a compact light and dark theme toggle in an easy to find location in the main toolbar.
- Keep the existing light theme as the default when no preference has been saved.
- Persist the chosen theme locally across reloads.
- Apply the theme immediately without reloading the app.
- Do not add theme preference to an individual family project or exported family data. It is an application preference.

### Visual coverage

Use theme variables or equivalent centralised tokens rather than scattered one off overrides. Cover:
- App background and paper texture.
- Top bar, footer, buttons, icons, and text.
- Person cards, selected cards, incomplete cards, and family junctions.
- Parentage and partnership lines, labels, handles, and React Flow controls.
- Search, person panels, editors, dialogs, and backdrops.
- Loading, update, and PWA related surfaces.

The dark theme should retain Rooted's visual identity and restrained brown and olive accents, adapted for sufficient contrast. Avoid simply inverting all colours. Ensure red incompleteness indicators remain legible and distinct in both themes.

## 9. Compatibility and data safety

- Old backups without structured names, completeness flags, or partial date precision must remain importable.
- Legacy full names and name history must be preserved.
- Legacy name change effective dates must be accepted but not used.
- Existing relationships, partnerships, custom attributes, and manual positions must survive migration.
- Export and reimport a migrated project without data loss.
- Use an explicit schema migration or normalization layer if required. Do not rely on silently dropping unknown fields.
- Keep all functionality local first and offline capable.

## 10. Tests and verification

### Domain tests
- Name migration and display formatting.
- Name history and multiple partnership name changes.
- Year, month, and full date validation and formatting.
- Automatic and manual completeness independently.
- Relationship incompleteness persistence.
- Great aunt, great uncle, great niece, great nephew, and further degrees.
- Cousin degree and removal.
- Gender neutral kinship wording.
- Adoptive, step, and in-law relationships.
- Ambiguous kinship paths.
- Family group positioning and overlap prevention.

### Interface tests
- Edit original names while cards show current married names.
- Show and edit partial dates.
- Select and display gender.
- Mark and clear incomplete people and relationships.
- Confirm no incompleteness overview is present.
- Toggle themes and confirm preference survives reload.
- Check theme contrast and all key interface surfaces in both themes.
- Confirm relationship finder labels and highlighted paths agree.

### Regression and build checks
- TypeScript checks.
- Full unit and domain test suite.
- Playwright desktop and mobile tests.
- Production build.
- PWA build verification.
- Import and export compatibility tests.
- Visual inspection of representative complex family layouts in both themes.
- Confirm previous improved ordering and manual positions have not regressed.

## 11. Delivery

1. Implement on a focused request branch only after explicit approval.
2. Work through data migration and domain logic before the interface and layout changes.
3. Run all automated checks and inspect visual output.
4. Update this request's testing and notes documents with actual outcomes.
5. Open a pull request with a concise summary and test evidence.
6. Wait for explicit approval before merging to `main`.
