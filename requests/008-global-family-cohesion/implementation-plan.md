# Request 008 implementation plan

## Status

Approved by the user on 2026-11-01. Implemented on branch `request/008-global-family-cohesion` and submitted as PR #8. GitHub Actions run 320 passed all configured checks. Do not merge to `main` without separate explicit approval.

## 1. Inspect the current global layout pipeline

Review the current implementation after Request 007, especially:

- `src/domain/layout.ts` and its generation-by-generation placement logic.
- `src/domain/familyGroups.ts` and exact parent-set grouping.
- `src/domain/relationshipEdges.ts` and family junction construction.
- The ELK integration and any ordering or collision postprocessing still present.
- Manual position precedence and drag persistence in `src/App.tsx`.
- Existing layout tests and Request 007 acceptance tests.

Trace a multigenerational example where a child is locally centred between two parents but the grandparents appear on inconsistent sides. Identify precisely where local placement decisions cause global branch fragmentation. Do not assume the issue is solved by simply reversing or pinning maternal and paternal sides.

## 2. Establish explicit global layout objectives

Model the layout as a global ordering problem across all generations, with the following priorities:

1. Never overlap person cards or family junctions.
2. Keep each person represented once.
3. Keep sibling groups based on shared recorded parentage coherent.
4. Keep multi-generation ancestry branches visually continuous where the graph supports it.
5. Keep partners and shared children close where feasible.
6. Preserve distinct family junctions for distinct recorded parent sets.
7. Reduce edge crossings, long detours, and unnecessary branch switching across the entire graph.
8. Retain local parent to child centring as a soft objective rather than allowing it to fragment larger branches.

These are structural objectives, not gender rules. Neither maternal nor paternal identity should determine a fixed horizontal side.

## 3. Design a global ordering strategy

After inspecting the current code, select the smallest architecture-compatible change that can optimise the whole graph. Evaluate:

- Whether the existing generation bands can be retained while ordering all nodes in each generation jointly.
- Whether connected family and ancestry structures can be represented as overlapping ordering constraints without duplicating people.
- Whether a global crossing minimisation or barycentric/sweep-based ordering pass can improve branch continuity while preserving the existing family clusters.
- How multi-parent, half-sibling, and multiple-partnership structures affect ordering constraints.
- How stable tie-breaking can prevent needless movement between repeated automatic layouts.

Do not make maternal-left or paternal-right a hard-coded rule. Do not infer parentage from partnerships. Do not use independent per-family centring as the sole ordering mechanism.

If the existing model cannot represent a global objective without a substantial redesign, document the evidence and propose the smallest safe alternative before proceeding.

## 4. Preserve family groups and unique people

- Build ordering constraints only from recorded biological or adoptive parentage.
- Keep children with shared recorded parents in coherent sibling clusters.
- Preserve exact parent-set junction identity.
- Allow a person to participate in several family groups while retaining one node and one coordinate.
- Ensure half siblings remain visually associated through their shared parent without incorrectly merging distinct parent-set junctions.
- Keep partnership proximity as a soft layout preference only. A partnership must not create parentage.

## 5. Positioning and routing

- Keep generation bands stable.
- Apply global horizontal ordering before final collision-free coordinate assignment.
- Preserve card dimensions and existing minimum spacing.
- Ensure junctions are recalculated from final person positions.
- Check relationship routing after global ordering, including partnership edges.
- Avoid postprocessing that silently destroys global ordering or crossing improvements.
- Preserve manual position precedence and drag behaviour exactly.

## 6. Regression tests

Add deterministic domain tests for:

- A three-generation two-parent lineage where local centring previously caused grandparents to switch sides.
- A multi-generation branch with siblings and cousins.
- A family with half siblings and multiple partners.
- A person who participates in multiple family groups but remains a single node.
- Distinct parent sets retaining distinct junctions.
- No overlapping cards or junctions.
- Stable ordering for equivalent repeated inputs.
- Disconnected people and people with incomplete parentage.
- Gender values having no effect on horizontal side assignment.
- Existing local sibling clustering and parent-child centring remaining intact where compatible.
- Manual positions continuing to override automatic positions at the application boundary.

Tests should assert structural relationships and measurable layout properties, not brittle exact coordinates unless a coordinate is essential to the requirement.

## 7. Verification

Run:

- TypeScript type checking.
- Full unit and domain test suite.
- Playwright browser tests on desktop and mobile.
- Production build.
- PWA build verification.
- Relevant import/export regression tests.
- Visual inspection of representative multigenerational trees, including multiple partnerships and half siblings.

Compare before and after layouts using the same deterministic fixtures. Record actual results and any remaining limitations. Do not claim visual verification unless it was actually performed.

## 8. Scope control

Do not modify:

- Name editing or completeness rules.
- Relationship data semantics or schema.
- Card design or theme styling.
- Import/export format.
- Manual positioning controls or drag persistence.

Keep the approved first-name-only save fix in its own request and change set.

## 9. Delivery

1. Implement only after explicit approval of this plan.
2. Work on a focused request branch.
3. Update this request's testing and notes documents with actual outcomes.
4. Review the full diff and ensure Request 007 improvements remain intact.
5. Open a pull request with test evidence.
6. Wait for explicit approval before merging to `main`.
