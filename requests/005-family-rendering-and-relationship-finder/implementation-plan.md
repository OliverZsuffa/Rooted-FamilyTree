# Request 005 implementation plan

## Goals

1. Make partnership and child connections look like one coherent family connection when the partnership exactly matches the recorded parents.
2. Fix the missing marriage or partnership symbol and the gap in the child connection line.
3. Replace the unwieldy Family connections list with an interactive two-person relationship finder.
4. Preserve the improved ordering and crossing prevention from Request 004 without modifying the layout algorithm.

## 1. Inspect current rendering and relationship logic

Before changing code:
- Review the current edge builder, family group helper, React Flow node and edge components, person details panel, and existing kinship domain logic.
- Trace how the partnership symbol is rendered and why the latest child connection has a gap where the symbol should be.
- Identify how selected nodes and highlighted edges are currently represented so the relationship finder can reuse the existing highlighting mechanism.
- Reuse and extend existing kinship calculation logic from Request 004 where appropriate. Do not create a second competing relationship implementation.

## 2. Consolidate matching partnership and family connections

### Matching rule

A partnership can be visually combined with a family junction only when:
- The family group has exactly two recorded parent IDs.
- Those two IDs exactly match the two people in the partnership record.
- The family group is derived from explicit biological or adoptive parentage records.

A marriage or partnership record alone never creates parentage and never changes family group membership.

### Rendering behaviour

- Use the existing family junction as the shared visual junction for the matching partnership and family group.
- Render the appropriate marriage or partnership symbol at that junction.
- Route the connection from both parent cards into the central junction and route the child connection from the same junction.
- For multiple children in the same family group, use a shared trunk and clear branches to the children where this fits the existing edge architecture.
- Avoid drawing a second, redundant partnership connector over the same path.
- Ensure the symbol is visible above the connector lines and the line meets its boundary cleanly. There must be no unexplained gap.
- Keep the existing separate partnership rendering for partnerships that do not match a two-parent family group.
- Keep separate family rendering for one-parent groups, groups with more than two recorded parents, and children whose parent sets differ.
- A person with children from multiple partnerships remains one person node and can connect to multiple family junctions.

### Missing symbol bug

Investigate the actual rendering path rather than masking the gap with a line adjustment:
- Confirm the symbol element is created for the relevant edge or junction.
- Confirm it is not hidden by edge visibility, conditional rendering, z-index, clipping, or label placement.
- Confirm the symbol is positioned at the actual junction coordinate.
- Ensure the connector is split or layered so it does not pass through the symbol, while also avoiding an excessive gap.
- Verify both marriage and non-marital partnership symbols.

### Constraints

Do not modify:
- `src/domain/layout.ts` or its ELK ordering configuration, except if an unavoidable integration issue is discovered. If such a change appears necessary, stop and explain why before proceeding.
- Generation calculation.
- Person node positions or collision prevention.
- Family group membership rules.

The intent is to change edge and symbol rendering only.

## 3. Relationship finder domain logic

### Relationship path

- Use the existing recorded parentage and partnership data as the source of truth.
- Reuse the existing kinship domain logic from Request 004 where possible.
- Calculate the relationship from the first selected person's perspective toward the second.
- Return both a human-readable relationship description and the exact path needed to highlight the tree.
- Include intermediate people and the relevant parentage or partnership connectors in the path.
- Distinguish biological and adoptive relationships where the existing data model supports that distinction.
- Support direct parent and child relationships, grandparents and grandchildren, siblings and half-siblings, aunts and uncles, nieces and nephews, and cousins.
- Support step and in-law relationships only where the relevant parentage and partnership records establish the relationship.
- Use neutral language where gender information is absent or does not support a gendered term.
- Do not infer relationships from names or other unrelated attributes.

### Multiple paths and ambiguity

- Do not silently select an arbitrary path when multiple equally valid paths produce different relationship descriptions.
- Prefer a clear, direct relationship when it is unambiguous.
- If multiple paths are equally valid and materially different, report the ambiguity and expose the available paths or relationship descriptions for the user to inspect.
- If no supported path exists, state that no known relationship is recorded.
- Selecting the same person twice should produce a clear self relationship result or validation message, not a misleading family relationship.

### Output contract

The domain function should return a structured result suitable for both display and highlighting. It should include:
- The relationship description from person A to person B.
- The ordered person IDs on the chosen path.
- The edge or relationship IDs on the path.
- Whether the result is ambiguous.
- Any alternative valid descriptions or paths needed to explain ambiguity.

Keep this logic pure and independent of React components.

## 4. Relationship finder interface

- Add a dedicated relationship finder mode or panel that can be opened from the main tree interface.
- The user chooses the first person using a searchable person picker.
- The user then chooses the second person using the same type of picker.
- Once both are selected, highlight both people and the connecting path on the tree.
- Dim unrelated people and connections enough to make the path easy to follow without hiding the overall tree context.
- Display the relationship in plain language from the first person's perspective.
- Provide a simple swap action to reverse the perspective.
- Provide a clear action to remove the selection and restore the normal tree appearance.
- Support people who are currently outside the visible viewport or filtered view. The implementation should make the selected path visible without silently changing the underlying family data.
- Keep the interface compact and usable on mobile.
- Do not add a permanent Family connections list back into person details.

## 5. Remove the old Family connections list

- Remove the calculated Family connections list from the person details panel.
- Preserve any unrelated person details and editing actions.
- Ensure opening a person with hundreds of relatives does not produce a huge details panel.
- The relationship finder becomes the dedicated way to answer relationship questions.

## 6. Tests

### Edge and symbol rendering tests

- A marriage matching exactly two recorded parents is visually consolidated with the family junction.
- A non-marital partnership matching exactly two recorded parents uses its correct partnership symbol.
- The symbol is present and visible at the junction.
- Connector lines meet the symbol cleanly with no missing segment or unexplained gap.
- No duplicate partnership line is rendered for a consolidated family connection.
- A partnership without shared children remains a separate partnership connection.
- A partnership that does not match the exact parent set remains separate.
- One-parent, more-than-two-parent, and differing-parent-set family groups remain correct.
- A person with children from multiple partnerships remains a single person node.
- Highlighting still identifies the correct consolidated connection.

### Relationship domain tests

- Direct parent and child.
- Grandparent and grandchild.
- Full siblings and half-siblings.
- Aunt or uncle and niece or nephew.
- Cousins, including relevant degree and removal where supported.
- Adoptive relationships.
- Step relationships and in-law relationships where the records support them.
- Unknown or nonbinary gender wording.
- Multiple valid paths and ambiguous results.
- Unrelated people.
- Same person selected twice.
- Returned path contains all required intermediate people and connectors.

### Interface and browser tests

- Open the relationship finder.
- Select the first and second people.
- Confirm both people and the connecting path are highlighted.
- Confirm unrelated nodes and edges are visually de-emphasized.
- Swap the selected people and confirm the description changes perspective.
- Clear the selection and confirm normal tree styling returns.
- Search for and select people in a large tree.
- Confirm the finder remains usable on mobile.
- Confirm the Family connections list is no longer shown in person details.

## 7. Verification

After implementation:
- Run TypeScript checks.
- Run all unit and domain tests.
- Run Playwright browser tests on desktop and mobile.
- Run the production build and PWA verification.
- Inspect actual rendered edge and symbol positions using browser screenshots or equivalent visual verification. Edge object assertions alone are insufficient to verify the missing symbol and line gap are fixed.
- Compare the layout before and after to confirm node ordering, positions, generation alignment, and crossing prevention have not regressed.
- Review the complete diff and document any deviations from this plan.

## 8. Delivery

- Implement only after explicit approval.
- Work on `request/005-family-rendering-and-relationship-finder`.
- Update the request notes and relevant reusable knowledge after verification.
- Open a pull request with test results and visual evidence.
- Do not merge until Oliver explicitly approves.
