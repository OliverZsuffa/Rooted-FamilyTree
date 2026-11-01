# Architecture and data model

## Implemented architecture

- React, TypeScript, and Vite.
- React Flow renders the interactive canvas. It is not the source of truth.
- ELK.js calculates automatic graph positions.
- Zod validates the versioned project schema.
- Domain relationship and generation logic lives outside React components.
- IndexedDB stores one local project.

## Domain entities

- People have a name, optional birth and death dates, flexible custom attributes, and an optional selected card attribute.
- Parentage records distinguish biological, adoptive, step-parent, and guardian relationships.
- Partnership records distinguish marriage and non-marital partnership, with optional start and end dates.
- Project metadata stores the schema version and manual layout coordinates.

People and relationships are separate records. Siblings are derived from shared biological or adoptive parents.

## Generation rules

Biological and adoptive parenthood determine generations. Step-parent and guardian relationships do not. Marriage and partnership do not affect generation.

Generation calculation works per connected ancestry component. Relative offsets allow a newly connected parent to join the correct generation even if that person was previously an isolated entry. A topological pass rejects circular ancestry. Conflicting generation offsets are rejected.

## Layout boundary

The visual graph is derived from domain data. ELK.js calculates default horizontal positions. Generation rows determine vertical placement. Users can drag people horizontally within their calculated generation. Manual coordinates are stored separately from relationships and survive ordinary edits.

Where two partnered people are both connected as parents to a child, the canvas renders a shared partnership junction. Other parentage links remain direct edges. A partnership without shared children is rendered as a line with a small symbol.

## Current implementation limitations

- Partnership junctions are visualized, but the layout algorithm does not yet optimize junction positions as part of the ELK graph.
- Complex mobile trees still need real-device interaction testing.
- Automated domain tests exist; persistence and full browser interaction tests remain to be added.
