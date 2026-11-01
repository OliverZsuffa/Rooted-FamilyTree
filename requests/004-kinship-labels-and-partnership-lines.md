# Request 004: Clearer partnership lines and kinship labels

## User report

1. Marriage lines currently take a convoluted route. They appear to come from the bottom of a person card, travel behind the card, and return down. The user wants a more straightforward route that is not simply a direct straight line.
2. The user wants Rooted to identify the family relationship one person has to another, using terms such as grandmother, aunt, niece, and stepson.

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

## Proposed person data

Add an optional gender field to each person:
- `female`
- `male`
- `nonbinary`
- `null` for not specified

The field is optional and backward compatible. Existing imported backups without it remain valid. It is used only to select relationship wording, not to determine parentage or generation.

## Scope boundaries

- No redesign of the tree or person editor.
- No accounts, cloud services, or external APIs.
- No manually entered kinship labels.
- No change to the existing generation rules.
- Preserve local storage and JSON backup compatibility.

## Open UX detail

The proposed location for calculated kinship labels is the selected person's details panel, as a compact list of other people and their relationship to the selected person. Confirm whether this is the intended presentation before implementation.

## Delivery workflow

Create and review an implementation plan, then wait for explicit user approval. Implement on a focused branch, add domain and browser tests, update knowledge documentation, and open a pull request. Do not merge or deploy without explicit approval.
