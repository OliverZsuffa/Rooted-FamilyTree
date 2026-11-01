# Request 005 implementation notes

## Status

Planning only. No implementation has been approved or started.

## Decisions

- Preserve the improved ordering and crossing prevention from Request 004.
- Keep the change to family connection rendering only. Do not alter the ELK layout algorithm or person positions.
- Visually combine a partnership with a family junction only when the partnership's two people exactly match the two explicitly recorded parents.
- The marriage or partnership symbol must be visible at the shared junction, and the connector must meet it cleanly without a gap.
- Marriage and partnership records never establish parentage.
- Replace the large Family connections list with a dedicated two-person relationship finder.
- The finder highlights both selected people and the connecting path, describes the relationship from the first person's perspective, supports swapping, and can be cleared.
- Report ambiguous paths rather than choosing arbitrarily.
- Remove the old Family connections list from person details.

## Implementation findings

To be completed after approval and code inspection.

## Verification results

To be completed after implementation. Record actual commands, results, browser checks, and any outstanding limitations.
