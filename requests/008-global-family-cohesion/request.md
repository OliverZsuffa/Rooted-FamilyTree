# Request 008: Global family branch cohesion

## Goal

Improve automatic layout so the family tree reads as one coherent structure across generations. The current algorithm can satisfy local family positioning while producing globally inconsistent branches. For example, a person may be positioned between their mother and father, but the grandparents then appear on switched or fragmented sides.

The layout must optimise the whole recorded family graph rather than treating each family group as an isolated placement problem.

## Problem description

Local centring and sibling clustering are useful, but they are not sufficient on their own. A layout can look reasonable around one family junction while causing a larger ancestry branch to jump across the tree in the previous or next generation. This makes relationships harder to follow.

## Confirmed requirements

- Keep parents, children, and their relevant sibling groups visually coherent.
- Keep grandparents and more distant ancestors aligned with the descendant branch they belong to, avoiding arbitrary side switches between generations.
- Keep partners and their shared children close where feasible.
- Keep siblings together, including half siblings who share a recorded parent.
- Keep distinct recorded parent sets and their family junctions distinct.
- Optimise crossings, long detours, card overlaps, and unnecessary branch separation across the complete tree, not only within individual family groups.
- Each person remains represented by exactly one card, including people connected to multiple family groups.
- Use recorded parentage only. A partnership alone must never imply parentage.
- Gender must not determine left or right placement. There is no requirement for maternal relatives to be on one fixed side and paternal relatives on the other.
- Preserve manual positions, dragging, generation bands, incompleteness, dark mode, and existing data.
- Preserve the current local family-centred improvements where they do not conflict with global coherence.

## Scope exclusions

- No gender-based side assignment.
- No duplicate person cards.
- No changes to relationship semantics or the data schema.
- No redesign of cards, relationship editing, incompleteness indicators, theme styling, persistence, or manual positioning controls.
- Do not regress the existing family-centred sibling grouping and junction behaviour.

## Acceptance criteria

1. A multigenerational test tree keeps ancestry branches visually coherent rather than arbitrarily switching sides between generations.
2. A person's recorded parents and their own sibling group remain a coherent local family unit.
3. Two-parent sibling groups remain together and are sensibly centred beneath their parents when this does not fragment a larger branch.
4. Multiple partnerships and overlapping sibling groups remain readable without duplicating people.
5. Distinct recorded parent sets retain distinct family junctions.
6. No person cards overlap, and relationship lines do not pass through cards.
7. Global crossings and unnecessary branch separation are reduced compared with the current layout.
8. Manual positions continue to override automatic positions.
9. Existing incompleteness, dark mode, import/export, and relationship behaviour remain unchanged.

## Issue

Tracked in [GitHub issue #8](https://github.com/OliverZsuffa/Rooted-FamilyTree/issues/8).


## Implementation status

Approved and implemented in PR #8. Automated CI verification passed. The actual populated family tree still needs visual review. Merge to `main` requires separate explicit approval.
