# Request 010 implementation plan

## Status

Approved on 2026-11-01. The recursive layout rewrite is implemented on branch `request/010-recursive-family-ordering` and is under review in [PR #11](https://github.com/OliverZsuffa/Rooted-FamilyTree/pull/11). The latest code verification passed. The branch is not merged.

## 1. Audit the current layout boundary

Inspect the current implementation and its callers before changing code:

- `src/domain/layout.ts`, especially `buildGenerationClusters`, `assignPositions`, `clusterBarycentre`, `calculateLayoutScore`, `optimiseGenerationOrder`, and `calculateFamilyCentredPositions`.
- `src/domain/familyGroups.ts` for exact-parent-set family junction identity.
- `src/domain/relationships.ts` for generation calculation and the biological/adoptive ancestry rules.
- `src/domain/relationshipEdges.ts` for the existing separation between parentage junctions and partnership lines.
- The application code that calls `calculateAutoPositions` and `createFallbackPositions`, merges manual coordinates, and persists drag results.
- Existing layout tests, fixtures, and request 007/008 regression coverage.

Document the current public function contracts and coordinate assumptions. Preserve those contracts where practical so the rewrite stays isolated from rendering and interaction.

The current ordering mechanism to replace is explicit: unioning same-generation people into clusters, initially ordering clusters by source order, assigning positions, calculating parent/child/partner barycentres, sorting clusters by those barycentres, scoring the complete graph for crossings and total span, accepting local improvements, and repeating downward/upward sweeps. Do not retain this as a hidden fallback or continue tuning it as the primary algorithm.

## 2. Build a family traversal model

Create a pure domain-level intermediate representation, likely in a new module such as `src/domain/familyTraversal.ts`. Keep React Flow nodes, edges, and UI state out of it.

Build indexed relationships once:

- Parents by child, using only biological and adoptive parentage.
- Children by parent, using only biological and adoptive parentage.
- Siblings by shared recorded parent, so full and half sibling relationships can be found without assuming one exact parent set.
- Exact parent-set family groups, reusing `getFamilyGroups` for junction identity.
- Partnerships as a separate adjacency index used only for optional proximity decisions.
- Generation and ancestry-component membership, using the existing generation calculation and recorded parentage.

Keep two concepts distinct:

1. **Sibling association:** people who share at least one recorded biological or adoptive parent. These overlapping associations help keep half siblings near one another.
2. **Family junction identity:** children with the exact same recorded parent set. These remain distinct groups, even when two groups overlap through one parent.

Never union all overlapping sibling associations into a single unbounded family block without considering their exact parent sets. A person may participate in several sibling associations but remains one person node.

## 3. Determine traversal roots and seed the youngest generation

Use the existing generation calculation. For each connected ancestry component formed by biological and adoptive parentage:

1. Find the maximum generation represented in that component.
2. Seed traversal with every person in that youngest generation, not an arbitrary single person.
3. Group seed people by their recorded sibling associations.
4. Use a deterministic tie-break for otherwise unrelated seed groups. Prefer stable identifiers or another explicitly documented stable key, never array insertion order or gender.

Treat a person with no recorded parentage as a valid one-person ancestry component. Do not let the relative generation offset of one disconnected component affect another.

Partnerships do not merge ancestry components for generation calculation. If two otherwise separate ancestry components contain partners, keep their independently derived ancestry ordering and apply partnership proximity only as a separate soft arrangement preference after the ancestry order has been established.

## 4. Expand recursively through ancestors and collateral branches

Implement a deterministic traversal that follows the user's proposed process:

1. Start with the youngest-generation seed groups.
2. Place siblings together in their generation.
3. Collect the recorded parents of the current frontier.
4. In the immediately older generation, discover those parents and their siblings through shared recorded parents.
5. Place the newly discovered ancestor sibling groups together.
6. Repeat upwards until no earlier ancestors remain.
7. Whenever an ancestor sibling is discovered, expand that person's descendants through recorded parentage. Add those descendants and their sibling associations to the appropriate lower generations. This is what brings cousins and other collateral branches into the layout even when they are not ancestors of the original seed people.
8. Continue until every person in the ancestry component has been discovered.

The traversal must be graph-safe, not a naive recursive tree walk:

- Maintain visited-person and visited-family-association sets.
- Record the reason and traversal path by which a person was first placed.
- If a person is encountered again through another parent, sibling group, or descendant branch, reuse the existing person identity and add the additional relationship constraint. Never create a second placement.
- Use deterministic queue/stack ordering and deterministic tie-breaks so equivalent project data produces the same result.
- Guard against repeated traversal through pedigree collapse and overlapping sibling groups.
- Keep the traversal finite even when the graph contains multiple paths. Existing ancestry validation should continue to reject circular parentage.

The ordering should express the family expansion order itself. Do not calculate independent local barycentres and repeatedly reorder generations afterward.

## 5. Resolve overlapping family structures explicitly

A person may belong to multiple sibling groups, including children from different partnerships and overlapping half-sibling groups. These constraints can conflict in a pedigree graph.

Use a deterministic first-placement and branch-attachment policy:

- A person receives one canonical position in their generation.
- The first traversal path establishes the person's primary branch placement.
- Later paths add adjacency constraints around the already placed person rather than moving or duplicating them unpredictably.
- Exact parent-set family groups remain separately identifiable and retain their own junctions.
- Shared-parent sibling associations may overlap. Preserve the strongest local sibling grouping possible without merging unrelated exact-parent-set junctions.
- When all sibling constraints cannot be satisfied simultaneously, resolve the conflict deterministically and document which constraint takes precedence. Do not pretend every graph can be drawn without crossings.

The implementation should make this policy visible in code and tests rather than hiding it in a numeric score.

## 6. Assign coordinates from the resulting order

After the traversal produces an ordered list for each generation:

- Assign horizontal positions sequentially using the existing card width and minimum gap requirements.
- Assign vertical positions strictly from the existing calculated generation bands.
- Place disconnected ancestry components as separate horizontal blocks, with stable ordering between blocks.
- Apply partnership proximity only as a bounded secondary adjustment that cannot split a sibling block, change generations, or override the ancestry traversal order. If a partnership connects two separate ancestry components, keep those component blocks near each other where possible without interleaving their internal orders.
- Recalculate every exact-parent-set family junction from the final positions of its recorded parents and children.
- Ensure all people, including isolated people and people with incomplete ancestry, receive a valid position.
- Retain the current fallback guarantee that no missing position defaults multiple nodes to the same origin.

Do not use a later optimisation pass that silently undoes the recursive order. Collision prevention and junction placement are geometry steps, not permission to reshuffle family branches.

## 7. Preserve application integration

- Keep `calculateAutoPositions` and `createFallbackPositions` compatible with their existing callers unless the audit identifies a necessary, documented API adjustment.
- Preserve generation calculation and validation.
- Preserve React Flow node identity and the existing one-card-per-person model.
- Preserve manual coordinate precedence. Automatic layout must not overwrite a person's stored manual position.
- Preserve drag behaviour, persistence, undo/redo, viewport behaviour, and relationship edge construction.
- Keep partnership lines separate from parentage junctions. Do not infer parentage from marriage or partnership.
- Do not change the project schema, import/export format, person cards, editor, incompleteness rules, or themes.

## 8. Regression and invariant tests

Add domain-level fixtures that assert ordering and structural invariants rather than relying only on screenshots or brittle exact coordinates.

Required cases:

- A simple two-parent, three-generation family.
- Several siblings and their descendants.
- An ancestor with siblings whose descendants form cousin branches.
- Full siblings and half siblings sharing one or more parents.
- One person with children from multiple partnerships.
- Multiple partners with separate exact parent-set junctions.
- A person discovered through multiple ancestry and collateral paths.
- Pedigree collapse where two branches reconnect to the same ancestor.
- Disconnected ancestry components.
- An isolated person and incomplete ancestry with no known parent.
- Partnerships connecting otherwise separate ancestry components.
- Gender values changed while all relationship data stays identical.
- Repeated calls with equivalent project data produce identical ordering.
- Every person appears exactly once in the position map.
- Every family junction is positioned from its own exact parent set.
- No card or junction overlap.
- Manual coordinates still override automatic positions at the application integration boundary.
- Existing relationship edge types and endpoints remain unchanged.

Add a focused browser regression test using a representative large family fixture to verify that rendered cards and relationship lines match the domain order on desktop and mobile.

## 9. Verification and visual review

Run:

- TypeScript type checking.
- The complete unit and domain test suite.
- Playwright desktop and mobile tests.
- Production build.
- PWA build verification.
- Import/export regression tests.
- Relevant existing layout and relationship tests.

Compare the new output against deterministic fixtures that exposed the previous regressions. Inspect a representative large family with multiple partnerships, half siblings, and collateral branches. Record actual test results and remaining limitations. Do not claim visual review of the user's own populated tree unless that tree has actually been inspected.

The test suite must specifically verify that the old barycentre and crossing-score ordering is no longer invoked by the new automatic layout path.

## 10. Delivery and scope control

1. Implement only after explicit approval of this plan.
2. Work on `request/010-recursive-family-ordering`.
3. Keep the rewrite focused on automatic ordering and coordinate generation.
4. Update this request's testing and notes documents with actual outcomes.
5. Update reusable graph-layout knowledge if the architecture changes.
6. Review the full diff and verify that no unrelated files or behaviours changed.
7. Open a pull request with CI evidence.
8. Wait for separate explicit approval before merging to `main`.
