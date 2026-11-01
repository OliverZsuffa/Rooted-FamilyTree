# Request 015: Global parentage based ordering

## Status

Planning only. No application code has been changed. Implementation requires explicit user approval.

## Goal

Replace the current local ordering heuristics with a deterministic, global ordering algorithm based on the complete recorded parentage graph. The layout must make family branches readable across generations, not merely arrange each sibling group independently.

## Correct interpretation of the example

A child's identity in the user's illustrative example encodes both parents. For example:

- CA is a child of C and A.
- AB is a child of A and B.
- BA is also a child of A and B.

Therefore AB and BA have the exact same parent set and are full siblings. They must be kept together as one exact-parent-set sibling block. CA belongs to a different parent set. A person such as C, A, or B can participate in multiple family units, but must appear only once in the tree.

The example letters are labels for the topology, not a request to sort alphabetically or by name.

## Findings from the current implementation

- `src/domain/familyTraversal.ts` builds connected sibling clusters by unioning children who share any parent.
- It then orders exact-parent-set subgroups using subgroup size and parent-set ID strings, with local encounter order as another signal.
- Parent clusters are ordered using a local count of how many exact parent sets a person participates in.
- Descendant rows are then expanded from the resulting ancestor order.
- This is deterministic, but it does not evaluate the complete arrangement of all generations together. Local decisions can therefore conflict and place a family branch on an unintuitive side.
- `src/domain/layout.ts` positions the resulting row order and centres rows, but cannot repair a structurally incorrect order after the fact.

The new implementation must address the ordering model itself, not add another isolated sorting heuristic.

## Proposed implementation

### 1. Build an explicit parentage graph

From recorded biological and adoptive parentage only, build:

- A unique node for every person.
- A canonical exact parent-set key for every child.
- A family unit for each distinct exact parent set and its complete set of children.
- Links between family units and the people participating in them.

A person may link several family units. Those links are essential to global ordering. They must never create duplicate person nodes.

Partnerships may contribute a weak proximity preference only where appropriate. They must never imply parentage or merge exact parent sets.

### 2. Preserve hard structural constraints

The ordering must preserve these rules:

1. Every person appears exactly once.
2. Every generation remains on its existing generation band.
3. Children with the same exact recorded parent set form a contiguous sibling block.
4. Distinct exact parent sets retain distinct family junctions.
5. A person shared by several family units remains one shared anchor in the ordering.
6. Biological and adoptive parentage are both included. Other relationship types are excluded.

Children who share only one parent should remain associated where feasible, but overlapping half-sibling relationships must not be allowed to break the hard exact-parent-set blocks.

### 3. Optimise all generation rows together

Replace the current local encounter and subgroup-size ordering with a global layered-graph ordering pass.

- Start from a deterministic topology-derived ordering, not names or gender.
- Treat each exact-parent-set sibling block as an indivisible ordering unit.
- Use repeated downward and upward sweeps across adjacent generations. Evaluate candidate block positions against the neighbours in both directions.
- Use a crossing-minimisation objective for parentage connections, considering all edges between adjacent generations rather than one family group at a time.
- Add soft penalties for separating family units that share a person, splitting half-sibling networks unnecessarily, and creating large parent-to-child spans.
- Re-evaluate the complete objective after each candidate move. Accept only improvements, or deterministic equal-cost moves that improve a documented secondary criterion.
- Stop after a bounded number of sweeps or when no improving move remains.

The objective must be lexicographic or otherwise explicitly weighted so that hard constraints cannot be traded away for a small reduction in edge crossings. Exact parent-set sibling blocks and unique people take precedence over soft visual preferences.

### 4. Determinism without name sorting

- Use graph structure and the current stable input order to seed equivalent choices.
- Use IDs only as a final tie breaker when two alternatives are structurally and geometrically equivalent.
- Do not sort by display name, first name, gender, or branch size.
- Repeated calculations with identical input must produce identical output.
- Permuting people or relationship insertion order must not cause arbitrary layout changes where the graph is unchanged.

### 5. Keep geometry and connectors separate from ordering

Once the global row order is selected:

- Reuse the existing card dimensions, generation spacing, collision prevention, and manual position precedence.
- Recalculate family junctions from final person positions.
- Keep the recent connector improvements. Do not undo the reduced connector offsets or corner radii from the previous work.
- Do not add arbitrary routing lanes or increase spacing merely to conceal incorrect ordering.
- Check that junctions do not overlap cards and that relationship paths do not pass through cards.

### 6. Performance and safe fallback

The optimiser must have a clear upper bound on sweeps and candidate evaluations so large trees cannot cause unbounded work. If optimisation reaches its limit, return the best valid ordering found so far. If generation calculation fails, preserve the existing invalid-ancestry fallback behaviour.

## Regression fixtures and acceptance criteria

Add domain tests using explicit parentage records, including:

- The corrected illustrative topology: CA has parents C and A; AB and BA both have parents A and B. AB and BA must be adjacent, and CA must remain a separate exact-parent-set group.
- A shared person participating in several exact parent-set groups, represented by one node and one position.
- Full siblings and overlapping half-sibling groups.
- Multiple partnerships with children from different parent sets.
- Cousin branches and multiple generations.
- Pedigree collapse where the same ancestor is reached through multiple paths.
- Disconnected people and incomplete parentage.
- Permuted input order and repeated deterministic calculations.
- Gender changes having no effect on placement.
- A comparison against the current algorithm showing that the global objective improves or does not worsen parentage crossings and branch separation on the targeted fixtures.

Tests should assert structural properties and objective values rather than brittle absolute coordinates.

## Scope exclusions

Do not change:

- Relationship data semantics or schema.
- Person cards, labels, name editing, or completeness rules.
- Manual dragging, saved manual positions, or precedence rules.
- Dark mode or other theme styling.
- Import/export formats.
- The connector geometry improvements already made.

## Verification

Run type checking, all unit tests, Playwright tests on desktop and mobile, production build, and PWA verification. Add browser coverage for the corrected topology and representative overlapping family structures where practical.

Automated tests cannot establish that the actual populated family tree looks right. If the real data can be loaded into a browser test or supplied as a fixture, inspect the resulting layout. Otherwise report that visual verification of the user's actual tree remains outstanding and ask the user to review the preview before merge.

Record the actual test results. Do not mark visual checks complete based only on CI.

## Delivery

1. Wait for explicit approval of this plan.
2. Implement on `request/015-global-parentage-ordering`.
3. Keep the changes focused on the ordering algorithm and its tests.
4. Review the complete diff and confirm connector improvements and manual positioning remain intact.
5. Open a pull request with test evidence.
6. Do not merge to `main` without separate explicit approval.
