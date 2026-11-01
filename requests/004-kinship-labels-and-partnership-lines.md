# Request 004: Clearer partnership lines, kinship labels, and marriage name changes

## User report

1. Marriage lines currently take a convoluted route. They appear to come from the bottom of a person card, travel behind the card, and return down. The user wants a more straightforward route that is not simply a direct straight line.
2. The user wants Rooted to identify the family relationship one person has to another, using terms such as grandmother, aunt, niece, and stepson.
3. The user wants name changes resulting from marriage to be documented as an optional part of the marriage record.

## Proposed outcome

### Partnership line routing

- Give partnership connections their own deliberate routing and attachment points rather than reusing the default parentage edge anchors.
- Route the connection between the two people along the space between their cards, with a modest curve or shallow angled path.
- Avoid routing behind or through person cards.
- Preserve the small marriage or partnership symbol and the existing distinction between partnership and parentage lines.
- Handle partnerships with shared children and partnerships without shared children.
- Keep routes understandable with multiple partnerships and on mobile layouts.

### Kinship labels

- Calculate kinship terms from the existing parentage and partnership records. Do not store derived relationship labels as independent data.
- Show the relationship of each other person relative to the currently selected person in the person details panel.
- Support direct and extended biological/adoptive relationships, including parent, child, grandparent, grandchild, sibling, aunt/uncle, niece/nephew, and cousin.
- Support step relationships where the existing step-parent and partnership records provide enough information, including stepparent and stepchild.
- Use gendered terms when a person's optional gender is known. Provide neutral wording when it is unknown or nonbinary.
- Do not infer gender from names, relationships, or other personal details.
- Avoid inventing a relationship when the graph does not contain enough information. Use a neutral generic label or indicate that no known relationship is established.
- Account for multiple parents, multiple partnerships, half-siblings, and ambiguous paths without silently choosing an arbitrary label.

### Name changes recorded on a marriage

- Add an optional name-change choice to each marriage record. When creating or editing a marriage, the user can choose that neither person changes their name, only the first person changes, only the second person changes, or both people change.
- For each person who changes their name, record the resulting full name. Do not assume that only the surname changes or automatically construct a name.
- The previous name is the person's name immediately before the change. Preserve it in that person's name history, together with the new full name, the marriage that caused the change, and the effective date.
- Default the effective date to the marriage date. Allow a different effective date where needed.
- A marriage must never change either person's name automatically. The user explicitly chooses and enters each change.
- A later divorce or ended partnership does not erase the historical name change or automatically revert the person's name.
- Search must find a person by both their current name and any recorded previous names.
- Keep the name history visible in the person's details without cluttering the main canvas.

## Proposed person data

Add an optional gender field to each person:
- `female`
- `male`
- `nonbinary`
- `null` for not specified

The field is optional and backward compatible. Existing imported backups without it remain valid. It is used only to select relationship wording, not to determine parentage or generation.

Name history should be stored as dated records associated with the relevant marriage, while the person's current name remains the name displayed on the card. Existing people and backups without name history remain valid. Name changes are recorded only when explicitly configured on a marriage.

## Scope boundaries

- Keep the existing visual identity and interaction model. The generation layout may be restructured into explicit family groups to make parentage unambiguous.
- No accounts, cloud services, or external APIs.
- No manually entered kinship labels.
- No automatic name changes when a marriage is created.
- No automatic name reversion when a marriage ends.
- No change to the existing generation rules.
- Preserve local storage and JSON backup compatibility.

## Resolved UX

Calculated kinship appears as a compact Family connections list in the selected person's details panel. Previous names appear in a separate Previous names list with the effective date and marriage association. Gender is edited in the person editor. Marriage name changes are an optional secondary section in the marriage editor.

## Delivery workflow

The implementation plan was approved. Implement on `request/004-kinship-labels-and-partnership-lines`, add domain and browser tests, update knowledge documentation, and open a pull request. Merge after required checks pass, using the user's explicit merge approval.


### Family-group layout

- Organise each generation into family groups based on explicit biological and adoptive parentage, rather than placing every person in one undifferentiated row.
- Create an invisible family junction for each distinct set of recorded biological and adoptive parents. Connect that junction to the children who share that exact parent set.
- Keep siblings with the same recorded parent set visually together. If only one parent is recorded, do not invent a second parent or assume an unrecorded partner is a parent.
- A person with children from multiple partnerships may participate in multiple family groups, but their person card must appear only once. Route each family connection to that single card.
- Marriage and partnership records alone must never establish parentage or imply shared children.
- Keep parentage and partnership connectors visually distinct, with separate routing lanes where needed to prevent crossings and card overlap.
- Filtering and mobile layouts must preserve these rules. Manual horizontal positioning must not change family membership or generation alignment.
