# Request 015: Global parentage based ordering

## Status

Planning and algorithm evaluation only. No application code has been changed. The first approved work stage is limited to research, source inspection, and isolated prototypes. Application implementation requires explicit approval after the results and final algorithm choice have been presented.

## Goal

Find and implement a deterministic global ordering method based on the complete recorded parentage graph. The layout must make family branches readable across generations, not merely arrange each sibling group independently.

A perfectly crossing-free drawing cannot be guaranteed for every arbitrary pedigree graph. The objective is a clear, stable layout that respects the underlying relationships and makes unavoidable compromises explicit.

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

The new work must address the ordering model itself, not add another isolated sorting heuristic.

## Research findings and candidate approaches

The research identifies several relevant approaches. None should be adopted without testing against this application's data model and difficult pedigree cases.

### D3 Pedigree Tree

Repository: https://github.com/solgenomics/d3-pedigree-tree

Package: https://www.npmjs.com/package/@solgenomics/d3-pedigree-tree

This is a pedigree-specific D3 implementation for multi-parent directed acyclic graphs and grouped siblings. Its ordering approach uses iterative hill climbing, repositioning nodes according to the average positions of their parents and children. Repeated iterations aim to reduce edge intersections and improve branch placement.

Why it is relevant:
- It is designed for pedigree graphs rather than generic trees.
- It considers both parent and child positions.
- It provides a concrete implementation that can be inspected and prototyped.

Risks to validate:
- Average-position heuristics may not preserve exact parent-set sibling blocks.
- Shared people who participate in several family units may create competing placement signals.
- Its assumptions about family structure and its treatment of multi-parent relationships may differ from this application's requirements.

### Sugiyama style layered graph drawing

Reference: https://tikz.dev/gd-layered

This family of algorithms separates layout into stages: assign generations or layers, minimise crossings between adjacent layers, assign coordinates, and route edges. Crossing minimisation commonly uses repeated downward and upward sweeps with barycenter or median ordering heuristics.

Why it is relevant:
- The application already has generation bands, so layered ordering is a natural fit.
- It provides established techniques for considering connections across adjacent generations.
- It offers a useful baseline against which pedigree-specific methods can be compared.

Risks to validate:
- Generic layered graph algorithms do not inherently understand family units.
- Treating every person as an independent node can split full sibling groups.
- Additional constraints are needed for shared people and overlapping half-sibling relationships.

### Pedigree-specific literature

Tores and Barillot, “The art of pedigree drawing: algorithmic aspects” (2001): https://pubmed.ncbi.nlm.nih.gov/11238074/

This work addresses complex pedigrees, including consanguinity loops and multiple mates. It also establishes that finding a fully satisfactory representation can be computationally difficult, which supports using a well-defined heuristic objective rather than promising a perfect drawing for every graph.

Madeline 2.0 PDE: https://academic.oup.com/bioinformatics/article/23/14/1854/189087

The described approach uses hybrid representations for consanguinity loops and reorders siblings to bring people who mate with relatives closer together. Multiple mates and twin groups can constrain sibling ordering. These are useful design considerations, although the application's exact parent-set rules remain authoritative.

PedVis, “A structured, space-efficient technique for pedigree visualization” (2010): https://pubmed.ncbi.nlm.nih.gov/20975144/

PedVis uses an H-tree based visual model. It is relevant as an alternative representation, but it is not the leading candidate because this project intends to retain conventional generation rows and the existing card and connector presentation.

DrawPed: https://academic.oup.com/nar/article/52/W1/W61/7668056

This tool illustrates that specialised pedigree software also makes scope and ordering tradeoffs. Its documented limitations around complex nested relationships and automatic ID-based ordering make it less suitable as a direct solution.

## Stage 1: Inspect and prototype before choosing the algorithm

This stage must not change application code or the production layout.

1. Inspect the source code of D3 Pedigree Tree, focusing on its graph model, sibling grouping, ordering objective, hill climbing, handling of shared people, and termination conditions.
2. Record which ideas can be reused conceptually and which assumptions conflict with this application's data model.
3. Build a small isolated prototype using representative graph fixtures. Do not add a production dependency merely to test an algorithm.
4. Compare at least:
   - The current application's ordering as a baseline.
   - A pedigree-style iterative parent and child position heuristic inspired by D3 Pedigree Tree.
   - A constrained layered ordering approach using downward and upward sweeps and barycenter or median scoring.
   - A hybrid only if the results suggest it adds value.
5. Ensure each candidate uses the same graph fixtures, hard constraints, and scoring criteria.
6. Record the resulting orders, crossing counts, sibling block integrity, branch coherence, determinism, and runtime.
7. Recommend one approach, or explain why none is sufficient and propose a revised direction.

The prototype must specifically test the corrected CA, AB, BA topology and cases where one person participates in multiple family units. Do not use alphabetical names, gender, or branch size as ordering signals.

## Stage 2: Parentage graph and hard constraints

After the algorithm has been selected and application implementation approved, build an explicit graph from recorded biological and adoptive parentage only:

- A unique node for every person.
- A canonical exact parent-set key for every child.
- A family unit for each distinct exact parent set and its complete set of children.
- Links between family units and the people participating in them.

A person may link several family units. Those links are essential to global ordering. They must never create duplicate person nodes.

Partnerships may contribute a weak proximity preference only where appropriate. They must never imply parentage or merge exact parent sets.

The ordering must preserve these hard rules:

1. Every person appears exactly once.
2. Every generation remains on its existing generation band.
3. Children with the same exact recorded parent set form a contiguous sibling block.
4. Distinct exact parent sets retain distinct family junctions.
5. A person shared by several family units remains one shared anchor in the ordering.
6. Biological and adoptive parentage are both included. Other relationship types are excluded.

Children who share only one parent should remain associated where feasible, but overlapping half-sibling relationships must not break hard exact-parent-set blocks.

## Stage 3: Global optimisation requirements

The selected algorithm must evaluate the complete layered parentage graph rather than making isolated local decisions.

The final design should:

- Start from a deterministic topology-derived ordering, not names or gender.
- Treat each exact-parent-set sibling block as an indivisible ordering unit.
- Consider parent and child positions across adjacent generations.
- Evaluate crossings and branch coherence globally.
- Use soft preferences for keeping family units that share a person nearby, keeping half-sibling networks readable, and avoiding unnecessarily long parent-to-child spans.
- Make hard constraints lexicographically dominant or otherwise impossible to trade away for a small improvement in a soft score.
- Have bounded runtime and return the best valid ordering found so far if its evaluation budget is reached.

The exact scoring function and search strategy are intentionally not fixed until Stage 1 results are reviewed.

## Determinism

- Do not sort by display name, first name, gender, or branch size.
- Prefer topology-derived signals and stable existing order to seed equivalent choices.
- Use IDs only as a final tie breaker when alternatives are structurally and geometrically equivalent.
- Repeated calculations with identical input must produce identical output.
- Permuting people or relationship insertion order must not cause arbitrary layout changes where the graph is unchanged.

## Geometry and connectors

Once the global row order is selected:

- Reuse the existing card dimensions, generation spacing, collision prevention, and manual position precedence.
- Recalculate family junctions from final person positions.
- Keep the recent connector improvements. Do not undo the reduced connector offsets or corner radii from the previous work.
- Do not add arbitrary routing lanes or increase spacing merely to conceal incorrect ordering.
- Check that junctions do not overlap cards and relationship paths do not pass through cards.

## Performance and safe fallback

The final optimiser must have a clear upper bound on sweeps and candidate evaluations so large trees cannot cause unbounded work. If optimisation reaches its limit, return the best valid ordering found so far. If generation calculation fails, preserve the existing invalid-ancestry fallback behaviour.

## Regression fixtures and acceptance criteria

Use explicit parentage records, including:

- The corrected illustrative topology: CA has parents C and A; AB and BA both have parents A and B. AB and BA must be adjacent, and CA must remain a separate exact-parent-set group.
- A shared person participating in several exact parent-set groups, represented by one node and one position.
- Full siblings and overlapping half-sibling groups.
- Multiple partnerships with children from different parent sets.
- Cousin branches and multiple generations.
- Pedigree collapse where the same ancestor is reached through multiple paths.
- Disconnected people and incomplete parentage.
- Permuted input order and repeated deterministic calculations.
- Gender changes having no effect on placement.
- Comparison with the current algorithm and each prototype candidate using identical fixtures.

Tests should assert structural properties and objective values rather than brittle absolute coordinates. Candidate comparison should report crossing counts, hard-constraint violations, branch coherence, determinism, and runtime. A candidate that violates a hard constraint is invalid regardless of its score elsewhere.

## Scope exclusions

Do not change:

- Relationship data semantics or schema.
- Person cards, labels, name editing, or completeness rules.
- Manual dragging, saved manual positions, or precedence rules.
- Dark mode or other theme styling.
- Import/export formats.
- The connector geometry improvements already made.

## Verification after implementation

Run type checking, all unit tests, Playwright tests on desktop and mobile, production build, and PWA verification. Add browser coverage for the corrected topology and representative overlapping family structures where practical.

Automated tests cannot establish that the actual populated family tree looks right. If the real data can be loaded into a browser test or supplied as a fixture, inspect the resulting layout. Otherwise report that visual verification of the user's actual tree remains outstanding and ask the user to review the preview before merge.

Record actual test results. Do not mark visual checks complete based only on CI.

## Delivery and approval gates

1. Complete Stage 1 research and prototype comparison on `request/015-global-parentage-ordering`.
2. Present findings, tradeoffs, and the recommended algorithm.
3. Update this plan with the selected algorithm, scoring details, and implementation tasks.
4. Wait for explicit user approval before changing application code.
5. Implement on `request/015-global-parentage-ordering`.
6. Review the complete diff and confirm connector improvements and manual positioning remain intact.
7. Open a pull request with test evidence.
8. Do not merge to `main` without separate explicit approval.
