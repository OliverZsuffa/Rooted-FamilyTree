# Architecture and data model

## Planned architecture

- React, TypeScript, and Vite.
- React Flow is the interactive canvas, not the source of truth.
- ELK.js arranges the derived visual graph.
- Domain entities and relationship rules remain independent of canvas state.

## Planned domain entities

- People: standardized name and life dates, flexible custom attributes, and selected card attribute.
- Parentage: typed biological, adoptive, step-parent, or guardian relationship.
- Partnerships: typed marriage or non-marital partnership with optional dates.
- Project metadata and persisted visual layout preferences.

## Generation rules

Biological and adoptive parenthood determine generations. Step-parent and guardian relationships do not. Marriage and partnership do not affect generation. Generations are strict and cannot be manually overridden.

The implementation must reject circular ancestry and any parentage that would assign incompatible generations. Sibling relationships are derived from shared parents.

## Layout boundary

The visual graph is derived from the domain data. Partnership junction nodes are used to render a marriage/partnership symbol and connect shared children. Manual coordinates are presentation preferences and must not alter relationships or generation assignments.

This document describes the approved product direction; implementation details should be updated when verified in code.
