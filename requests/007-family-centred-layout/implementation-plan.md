# Implementation plan

## 1. Replace the ineffective ordering pass

Replace the current ELK-derived left-to-right ordering plus collision pass with an explicit generation-by-generation family-centred placement algorithm. The existing implementation preserves ELK's order and therefore does not reliably centre children between parents.

## 2. Build sibling clusters from recorded parentage

Within each generation, use biological and adoptive parent records to connect children who share at least one parent. Use connected components so full and half siblings remain adjacent. Do not use partnership records to infer parentage.

## 3. Place each cluster relative to its parents

Process generations from oldest to youngest so parent coordinates already exist when positioning their children. Calculate each cluster's target centre from the mean horizontal centre of its recorded parents. For one-parent groups, centre beneath that parent. For people without recorded parents, preserve stable input order.

Place each cluster as a compact row of 176 px cards with 48 px gaps. Pack clusters left to right, moving a cluster only as far as necessary to prevent overlap. Apply a global horizontal offset if required to keep coordinates non-negative.

## 4. Recalculate family junctions

Calculate each family junction from the actual parent and child card centres, so the junction sits midway between the parent group and its child group. Keep a separate junction for each exact biological/adoptive parent set.

## 5. Preserve application behaviour

Keep the existing manualPositions precedence in App.tsx. Do not change drag handlers, persistence, or the automatic-layout reset action. The existing junction rendering already recalculates junction positions from the visible person positions, including manually dragged positions.

## 6. Tests

Add deterministic tests for:
- A two-parent group whose children are centred on the midpoint between the parents.
- A single-parent group centred beneath that parent.
- Full and half siblings remaining adjacent.
- Children of distinct parent sets retaining distinct family junctions.
- Multiple partner groups not duplicating people or causing card overlap.
- Disconnected people remaining separated.
- Empty projects and invalid ancestry behaviour.

## 7. Verification

Run TypeScript type checking, unit tests, production build, PWA verification, and browser tests. Review the final diff to confirm that only layout logic, its tests, and Request 007 documentation changed. Report any check that cannot be executed rather than claiming it passed.
