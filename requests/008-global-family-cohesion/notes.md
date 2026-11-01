# Request 008 notes

## Status

Planning only. No application code has been changed and no tests have been run.

## User clarification

The user explicitly does not care which gender is placed on which side. The requirement is to keep family structures together. Do not implement a fixed maternal-left and paternal-right convention.

## Confirmed problem

The current layout can make a local family group look reasonable while placing the previous generation inconsistently. The reported example has the user between their mother on the left and father on the right, but the grandparents then appear on switched sides. This indicates that local family positioning is not sufficient to guarantee whole-tree coherence.

## Design caution

Do not equate global coherence with a gender-based side convention. The intended result is a visually connected family structure across generations, regardless of which side a particular branch occupies.

The algorithm must also handle people who belong to multiple family groups without duplicating their cards. Parentage comes only from recorded biological or adoptive relationships. Partnership records alone must not create parentage.

## Open technical questions

The current implementation should be traced with a deterministic multigenerational fixture before choosing a new ordering algorithm. Candidate approaches such as global generation ordering, barycentric sweeps, and overlapping family-cluster constraints require evaluation against the existing code. No specific algorithm is committed to until that inspection is complete.

## Related work

- Request 007 introduced deterministic generation-by-generation family-centred placement and preserved unique people, exact parent-set junctions, and manual position precedence.
- This request extends the objective from local family centring to global branch coherence. Request 007 behaviour should remain as a soft constraint where compatible.
