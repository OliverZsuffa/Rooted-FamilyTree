# Implementation plan

1. Extend sibling cluster construction to retain exact-parent-set child subgroups and place each subgroup contiguously.
2. During upward traversal, calculate each parent's distinct exact-parent-set group count. Order higher-connectivity shared parents first, then use descendant encounter order to place partner branches.
3. Add a regression fixture representing a shared parent with two partners, one child in the first branch and two siblings in the second branch.
4. Remove family route interval colouring and per-group route lane metadata.
5. Reduce the custom family edge's smoothstep offset from 24 plus 14 per lane to 8, and its border radius from 10 to 4.
6. Keep explicit top and bottom parentage handles and existing partnership edge rendering.
7. Run the full CI suite and inspect the resulting screenshot fixture before merge.

Ordering uses relationship topology and branch structure. Names and gender are not consulted. IDs remain only deterministic final tie-breakers where topology provides no distinction.

## Known limitation

The screenshot fixture represents a specific branch topology. General family graphs can contain unavoidable crossings. The goal is to minimise avoidable complexity and keep the routes legible, not to promise a crossing-free drawing for every possible pedigree.