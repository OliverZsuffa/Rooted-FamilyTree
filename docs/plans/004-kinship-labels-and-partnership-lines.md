# Request 004 implementation plan

## Goals

1. Make marriage and partnership connectors visually simple and intentional.
2. Calculate useful kinship labels between the selected person and other people in the tree.
3. Keep the data model backward compatible and the interface compact.

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

## 4. Presentation

In the selected person's details panel, add a compact section listing other people and their relationship to the selected person.

Example:
- Anna · grandmother
- Peter · uncle
- Mia · cousin
- Lukas · stepson

The list is derived from the tree and updates immediately after relationship or gender edits. It should not add controls to the main canvas or clutter person cards.

The exact placement and wording should be confirmed before implementation.

## 5. Compatibility and validation

- Keep the project schema version unchanged if the optional field can be safely defaulted by the existing Zod schema.
- Verify old JSON backups without gender still import.
- Verify gender survives export and re-import.
- No remote resources or services.

## 6. Verification

- Unit tests for all kinship calculations, gender variants, step relationships, half-siblings, multiple parents, ambiguous paths, and unrelated people.
- Edge tests for partnership routing with and without shared children.
- Browser tests for editing gender, seeing updated kinship labels, and preserving old backups.
- Run TypeScript, unit tests, Playwright desktop and mobile suites, production build, and PWA verification.
- Inspect the actual rendered partnership paths in browser tests or screenshots. Do not rely only on edge object assertions.

## Delivery

This plan is for review only. Wait for explicit user approval before implementation. After approval, implement on `request/004-kinship-labels-and-partnership-lines`, document actual test results, and open a PR. Merge and deploy only after separate explicit approval.
