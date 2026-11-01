# Request 005: Family connection rendering and relationship finder

## User report

The latest family layout update improved ordering and prevented connection lines from crossing, but the resulting family connections look less cohesive.

Specific issues:
1. A partnership line and a family or child line are currently rendered separately, even when the two partners are exactly the two recorded parents of the same children.
2. This makes the layout awkward because one side of a person card is occupied by the partnership line and the child connection takes a longer route.
3. The child connection currently has a visible gap where the marriage or partnership symbol should be, but the symbol is missing.
4. The existing Family connections list in the person details panel becomes excessively long for large families.

## Desired outcome

### Family connection rendering

When a recorded partnership matches the exact two recorded parents of a family group, render the partnership symbol and family junction as one coherent visual connection. The symbol should sit at the central junction, and the children should branch from that junction through a shared trunk where appropriate.

The symbol must be visibly rendered. The line must meet it cleanly without a gap.

This is strictly a visual consolidation. A marriage or partnership record must never imply parenthood. Only explicit biological or adoptive parentage records establish the family group.

Keep distinct connections where the records do not match exactly, including one-parent groups, children from different partnerships, and partnerships without shared children.

### Relationship finder

Replace the large Family connections list with a dedicated relationship finder.

The user selects one person, then another person. The app:
- Highlights both selected people.
- Highlights the connecting relationship path on the tree, including relevant intermediate people and connectors.
- States the relationship in plain language from the first selected person's perspective.
- Allows the user to swap the two people.
- Allows the selection to be cleared to return to the normal tree.

Support direct relationships, ancestors and descendants, siblings and half-siblings, aunts and uncles, nieces and nephews, cousins, and step or in-law relationships when the recorded data supports them. If multiple valid paths create ambiguity, make that clear rather than silently choosing an arbitrary relationship.

The relationship finder should be a separate mode or panel, not a permanent list in every person's details. Remove the existing Family connections list from the person details panel.

## Non-goals and constraints

- Do not change the improved ELK ordering, node positions, generation calculation, or crossing prevention.
- Do not undo or redesign the family-group layout from Request 004.
- Do not infer parenthood from marriage or partnership.
- Do not add manually stored relationship labels. Derive relationships from the existing records.
- Do not add a large permanent relationship list to person details.
- Preserve existing project data and JSON backup compatibility.

## Delivery workflow

Create and present the implementation plan for approval. Do not implement until Oliver explicitly approves it. After approval, implement on `request/005-family-rendering-and-relationship-finder`, add domain and browser tests, update reusable knowledge, and open a pull request. Merge only after verification and explicit approval.
