# Request 011 notes

## Initial code audit

The screenshots are consistent with specific defects in the current rendering code:

1. Person cards expose multiple source and target handles. The parentage edge builder omits explicit handle IDs for biological/adoptive parentage, so React Flow can attach an edge to an unintended side handle.
2. Family junctions expose a top target and bottom source handle, but child edges also omit explicit handle IDs.
3. The domain layout computes family junction positions and applies spacing, but `App.tsx` recomputes visible junction coordinates with a separate midpoint formula. The visible graph therefore bypasses the domain spacing.
4. All parentage segments currently use default smoothstep routing. There is no explicit lane allocation for separate exact-parent-set groups sharing a parent.

## Important correction to the previous diagnosis

The issue is not simply that the parent edge uses an unspecified bottom handle. The person card has multiple source handles, and the junction also has multiple handle types across its two ends. Both ends of both parentage segment types need explicit IDs. The route crossing problem also requires group-aware geometry, not just correcting handle IDs.

## Constraints

- Request 010's recursive person ordering remains unchanged.
- Exact-parent-set family groups remain separate.
- Manual person positions must feed junction and edge geometry.
- Partnership edges remain separate and continue to use side handles.
- No universal crossing-free guarantee is possible for every arbitrary pedigree, but the screenshot fixtures must be routed without their current avoidable defects.

## Implementation status

Plan only. Awaiting explicit approval.