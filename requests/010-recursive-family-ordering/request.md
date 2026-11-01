# Request 010: Rebuild automatic family ordering

## Goal

Replace the current automatic horizontal sorting strategy with a relationship-driven recursive family expansion algorithm. The current approach has accumulated local clustering, barycentre sorting, crossing scoring, and repeated ordering sweeps. Those mechanisms have not produced reliable global family coherence. This request is a fundamental replacement, not another incremental tuning pass.

## Core idea

Start with the youngest generation in each ancestry component. Place the people in that generation with their siblings. Then move one generation upwards, placing their parents and the parents' siblings together. Repeat for grandparents and earlier ancestors.

Whenever an ancestor's siblings are discovered, also discover their descendants and place those collateral branches in the appropriate generations. This is necessary for cousins and other branches that are not ancestors of the initial youngest-generation people.

The algorithm must use the actual family graph. It must not assume that the graph is a simple tree: people can have multiple partners, children with different partners, overlapping sibling groups, missing ancestry, or multiple paths to the same person.

## Confirmed requirements

- Replace the existing automatic ordering strategy instead of layering more special cases onto it.
- Use recorded biological and adoptive parentage for ancestry traversal and generation assignment.
- Keep siblings and collateral branches coherent across generations.
- Discover an ancestor's siblings and include their descendants in the correct generations.
- Represent each person exactly once, with one automatic position.
- Handle half siblings, overlapping sibling groups, multiple partnerships, shared children, and pedigree collapse.
- Handle disconnected ancestry components independently. A partnership may influence visual proximity but must not merge parentage or alter generations.
- Keep gender entirely irrelevant to left or right ordering.
- Preserve strict generation bands and distinct family junctions for exact recorded parent sets.
- Preserve separate partnership relationships. A partnership must never imply parentage.
- Preserve manual position precedence, dragging, and stored manual coordinates.
- Preserve existing person cards, relationship semantics, schema, import/export, incompleteness, themes, persistence, and application history.

## Scope exclusions

- No schema migration or relationship semantic changes.
- No gender-based side assignment.
- No duplicate person cards or inferred parentage.
- No card, editor, or relationship UI redesign.
- No changes to manual positioning controls or drag persistence.
- No continued use of the current barycentre and crossing-score sweeps as the primary ordering algorithm.

## Acceptance criteria

1. A simple multigenerational family is ordered by recursively expanding from the youngest generation through siblings and ancestors.
2. Ancestor siblings and their descendants appear as coherent collateral branches in the correct generations.
3. Full and half siblings remain adjacent where structurally possible without incorrectly merging distinct exact-parent-set family junctions.
4. Multiple partnerships and children from different relationships do not duplicate people or fragment a person's branches.
5. Pedigree collapse and multiple discovery paths produce one deterministic position per person.
6. Disconnected ancestry components do not distort one another's internal ordering.
7. Partnerships can influence proximity without affecting ancestry, generation, or parentage.
8. Changing gender values does not change horizontal ordering.
9. Every person and family junction receives a valid position, with no card or junction overlaps.
10. Existing manual positions continue to override automatic positions.
11. Regression tests demonstrate coherent whole-family ordering and cover the previously problematic structures.

## Issue

Tracked in [GitHub issue #10](https://github.com/OliverZsuffa/Rooted-FamilyTree/issues/10).

## Implementation status

Plan drafted and awaiting explicit approval. No implementation has started.
