# Request 004 implementation plan

## Goals

1. Make marriage and partnership connectors visually simple and intentional.
2. Calculate useful kinship labels between the selected person and other people in the tree.
3. Record optional marriage-related name changes as part of the marriage record.
4. Keep the data model backward compatible and the interface compact.

## 1. Partnership edge routing

### Investigation

- Inspect how ELK positions partnership junction nodes and how the current React Flow handles are assigned.
- Reproduce the issue for a partnership with shared children and one without shared children.
- Identify whether the awkward path is caused by default top/bottom handles, junction placement, or the selected edge type.

### Proposed implementation

- Add explicit left and right handles for partnership connections, separate from the top and bottom parentage handles.
- Route partnership edges from the inward facing sides of the two partner cards toward a small central junction.
- Use a restrained curved or shallow angled route. It should not be a straight line, but should avoid large loops and card overlaps.
- For partnerships without shared children, use the same side attachment strategy and retain the marriage or partnership symbol.
- Keep parentage connections on their existing top/bottom routing.
- Ensure edge definitions remain stable during node dragging.

### Tests

- Partnership without children connects through the side anchors and retains its symbol.
- Partnership with shared children uses the central junction and side anchored partner segments.
- Multiple partnerships do not create overlapping or reversed routes where avoidable.
- Existing parentage edge routing remains unchanged.
- All edge endpoints remain valid when nodes are filtered or hidden.

## 2. Optional gender field

### Schema

Add `gender: 'female' | 'male' | 'nonbinary' | null` to the person schema, defaulting to null.

- Existing version 1 backups without the field continue to parse.
- New people default to unspecified.
- The person editor gets one small optional Gender selector with Female, Male, Nonbinary, and Not specified.
- Gender does not influence generation calculation or relationship structure.
- Import/export preserves the value.

## 3. Kinship calculation

Create a pure domain module for calculating the relationship of one person to another. Keep it independent of React components.

### Relationship graph

- Biological and adoptive parentage count as parent-child links for kinship.
- Step-parent records and partnership records can establish step-parent and stepchild relationships.
- Guardian relationships remain explicitly guardianship relationships and do not become parentage for kinship.
- Marriage and non-marital partnership do not create biological ancestry.

### Initial supported terms

- Parent and child.
- Grandparent and grandchild, including further direct ancestors where practical.
- Sibling, including half-sibling distinction when only one parent is shared.
- Aunt or uncle and niece or nephew, with neutral alternatives when gender is unknown or nonbinary.
- Cousins, with degree and removal where the graph supports an unambiguous result.
- Stepparent and stepchild.
- Stepsibling only where a parent's partnership and the other person's parentage establish the connection unambiguously.

### Gender wording

Use the person's optional gender only to choose the label:
- Female: mother, daughter, grandmother, aunt, niece, sister, etc.
- Male: father, son, grandfather, uncle, nephew, brother, etc.
- Nonbinary or unspecified: parent, child, grandparent, parent's sibling, sibling, parent's sibling's child, and other clear neutral descriptions.

Do not infer gender from names.

### Ambiguous paths

- Do not arbitrarily choose between conflicting kinship paths.
- Prefer the closest unambiguous relationship.
- If multiple paths produce different equally close labels, use a neutral broader label such as relative, or explain that the relationship is ambiguous.
- Return no kinship label when there is no supported family path.

## 4. Marriage name changes

### Data model

- Extend a marriage relationship with optional name-change data for each partner. Each partner's choice is independent, allowing neither, either one, or both to change names.
- For each selected change, store the resulting full name. Do not infer or generate a surname from the other partner's name.
- Preserve the previous full name, resulting full name, marriage relationship ID, and effective date as a name-history entry for the person.
- Use the marriage date as the default effective date. Permit an explicitly entered different date.
- Keep the person's current name as the name shown on their person card.
- Existing marriage records without name-change data and existing person records without name history remain valid. Keep existing backup compatibility and schema version where optional fields can be safely defaulted.

### Behaviour

- Creating or editing a marriage offers a compact optional name-change section with four outcomes: no one changes, first person changes, second person changes, or both change.
- For each person changing names, provide one field for the new full name. The user explicitly enters the value.
- A marriage does not change names unless the user selects and saves a change.
- Ending or deleting a marriage must not silently undo a recorded name change. The historical event remains associated with the marriage record where possible, and the person's current name remains unchanged.
- Searching by a previous name returns the same person as searching by their current name.
- Show previous names and their dates in the person's details panel. Keep this history out of the person cards on the canvas.
- Name changes are independent of gender and do not affect generations or kinship calculations.

### Tests

- Marriage with no name changes leaves both names untouched.
- Either partner can change their name independently.
- Both partners can change their names in the same marriage.
- The previous full name, new full name, marriage association, and effective date are preserved.
- A custom effective date is retained; otherwise the marriage date is used.
- Ending a marriage does not revert a name.
- Search matches current and historical names.
- Old backups without name history or marriage name-change data still import.
- Export and re-import preserve all name history.



## 5. Family-group generation layout

### Layout model

- Derive family groups from the exact set of recorded biological and adoptive parent IDs for each child. A family junction represents one distinct parent set.
- Place children with the same exact parent set together beneath that junction. A child with only one recorded parent remains in a one-parent group. Never invent a second parent.
- A parent may connect to multiple family junctions when children have different parent sets. The parent remains one person node and is never duplicated.
- Partnership and marriage records remain independent from parentage. They must not create a family junction or imply shared children.
- Keep family junctions visually subtle and use separate routing lanes for partnership links and parentage links. Avoid card overlaps and confusing crossings.
- Preserve generation alignment, search filtering, mobile behaviour, and manual horizontal positioning. Filtering one person must not create misleading partial family groups.

### Implementation approach

1. Add a pure domain helper that groups children by their sorted, distinct biological and adoptive parent IDs. Keep group identity deterministic across renders.
2. Extend the graph model with invisible family junction nodes positioned between the parent row and child row. Keep person nodes unique.
3. Route each recorded parent to its family junction, then from the junction to each child. Do not suppress parentage records based on marriage records.
4. Rework automatic layout to include family junction nodes in the layout graph so sibling clusters remain visually coherent. Keep fallback positions deterministic if ELK fails.
5. Keep manual positions only for people. Junction positions are derived from their family group and current person positions.
6. Test multiple families per parent, one-parent groups, half-siblings, adoptive and biological parents, filtering, and multiple partnerships.

### Tests

- Children with the same two recorded parents appear in one group.
- Children with different parent sets appear in separate groups, even when they share one parent.
- A parent with children from multiple partnerships appears once and connects to every applicable family junction.
- A marriage without recorded shared parentage does not create a family group.
- A child with one recorded parent is not assigned an invented second parent.
- Biological and adoptive parentage participate in grouping. Step-parent and guardian records do not alter biological/adoptive family groups.
- Search filtering and mobile view do not duplicate people or leave misleading orphan junctions.

## 6. Presentation

In the selected person's details panel, add a compact section listing other people and their relationship to the selected person.

Example:
- Anna · grandmother
- Peter · uncle
- Mia · cousin
- Lukas · stepson

The list is derived from the tree and updates immediately after relationship or gender edits. It should not add controls to the main canvas or clutter person cards.

In the marriage editor, keep name changes optional and visually secondary to the marriage details. In the person details panel, show previous names with their effective dates and the associated marriage where available.

The exact placement and wording should be confirmed before implementation.

## 7. Compatibility and validation

- Keep the project schema version unchanged if the optional fields can be safely defaulted by the existing Zod schema.
- Verify old JSON backups without gender, name history, or marriage name-change data still import.
- Verify gender and name history survive export and re-import.
- Validate referenced marriage IDs and reject malformed or contradictory name-change records.
- No remote resources or services.

## 8. Verification

- Unit tests for all kinship calculations, gender variants, step relationships, half-siblings, multiple parents, ambiguous paths, and unrelated people.
- Edge tests for partnership routing with and without shared children.
- Domain tests for marriage name-change combinations and history preservation.
- Browser tests for editing gender, seeing updated kinship labels, configuring marriage name changes, searching previous names, and preserving old backups.
- Run TypeScript, unit tests, Playwright desktop and mobile suites, production build, and PWA verification.
- Inspect the actual rendered partnership paths in browser tests or screenshots. Do not rely only on edge object assertions.

## 9. Delivery

Implementation is approved. Implement on `request/004-kinship-labels-and-partnership-lines`, document actual test results, and open a PR. Merge only after the previously granted explicit approval and after required checks pass.
