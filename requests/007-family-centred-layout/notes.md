# Implementation notes

## Initial diagnosis

The previous implementation used ELK coordinates as the primary ordering signal, then grouped siblings while preserving that order. It did not actively centre sibling groups beneath their parents. The previous tests checked sibling adjacency and junction placement, but did not assert the key parent-to-children centring requirement.

## Implementation outcome

Pending.
