# Architecture and data model

## Implemented architecture

- React, TypeScript, and Vite.
- React Flow renders the interactive canvas. It is not the source of truth.
- ELK.js calculates automatic graph positions.
- Zod validates the versioned project schema.
- Domain relationship and generation logic lives outside React components.
- IndexedDB stores one local project.

## Domain entities

- People have a name, optional gender, dated name history, optional birth and death dates, flexible custom attributes, and an optional selected card attribute.
- Parentage records distinguish biological, adoptive, step-parent, and guardian relationships.
- Partnership records distinguish marriage and non-marital partnership, with optional start and end dates. Marriage records can preserve explicitly entered name changes for either or both partners.
- Project metadata stores the schema version and manual layout coordinates.

People and relationships are separate records. Siblings and family groups are derived from shared biological or adoptive parents. Kinship labels are calculated from the relationship graph and the optional gender field. They are never stored as independent facts.

## Generation rules

Biological and adoptive parenthood determine generations. Step-parent and guardian relationships do not. Marriage and partnership do not affect generation.

Generation calculation works per connected ancestry component. Relative offsets allow a newly connected parent to join the correct generation even if that person was previously an isolated entry. A topological pass rejects circular ancestry. Conflicting generation offsets are rejected.

## Layout boundary

The visual graph is derived from domain data. ELK.js calculates default positions. Generation rows determine the allowed vertical band. Users can drag people horizontally and make small vertical adjustments without changing their calculated generation. Manual coordinates are stored separately from relationships and survive ordinary edits.

Each distinct set of explicitly recorded biological and adoptive parents defines a family group. An invisible family junction connects those parents to all children with that exact parent set. Children with different parent sets remain in separate groups, even if they share one parent. A person node is never duplicated when they have children in multiple family groups. Partnership lines are separate curved side-to-side connectors and never imply parentage. Step-parent and guardian links remain separate dashed relationships.

## Current implementation limitations

- Complex mobile trees still need real-device interaction testing.
- Kinship labels use the closest supported ancestry path. Complex pedigree collapse and equally close conflicting paths should be reviewed carefully rather than treated as a complete genealogy standard.
