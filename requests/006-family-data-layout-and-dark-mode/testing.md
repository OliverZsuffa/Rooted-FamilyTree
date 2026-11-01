# Request 006 testing checklist

## Status

Not run. This file records planned verification only.

## Data and migration
- [ ] Import a backup using the existing single name field.
- [ ] Confirm legacy full names are preserved without unsafe automatic splitting.
- [ ] Import legacy name history containing effective dates.
- [ ] Confirm old partnership and parentage records remain intact.
- [ ] Export and reimport the migrated project.
- [ ] Confirm custom attributes and manual positions survive.

## Person fields
- [ ] First, middle, and last name editing.
- [ ] Empty middle name accepted.
- [ ] Missing first or last name triggers automatic incompleteness.
- [ ] Original name remains editable after a partnership name change.
- [ ] Current married name appears on the card.
- [ ] Multiple partnership name changes do not corrupt the original name.
- [ ] Female, male, nonbinary, and empty gender states.
- [ ] Gender indicator is subtle and accessible.

## Dates
- [ ] Year only birth and death dates.
- [ ] Month and year birth and death dates.
- [ ] Full birth and death dates.
- [ ] Invalid dates rejected.
- [ ] No missing date components are fabricated.
- [ ] Partnership dates support the agreed precision.
- [ ] Unknown optional partnership dates do not trigger automatic incompleteness.

## Completeness
- [ ] Missing required person fields trigger automatic status.
- [ ] Manual person status persists independently.
- [ ] Parentage relation can be manually marked incomplete.
- [ ] Marriage and partnership can be manually marked incomplete.
- [ ] Relationship markers are visible on the tree.
- [ ] Red border and light red background remain legible in both themes.
- [ ] No incompleteness overview or dashboard exists.

## Kinship
- [ ] Parent, child, grandparent, and grandchild.
- [ ] Great grandparent and great grandchild.
- [ ] Full and half siblings.
- [ ] Aunt and uncle.
- [ ] Great aunt and great uncle.
- [ ] Further generations of aunt and uncle relationships.
- [ ] Niece and nephew.
- [ ] Great niece and great nephew.
- [ ] Cousin degree and removal.
- [ ] Adoptive, step, and in-law relationships.
- [ ] Gender neutral labels.
- [ ] Ambiguous paths are reported rather than arbitrarily selected.
- [ ] Relationship finder highlights the path matching the displayed label.

## Layout
- [ ] Two parents with one child.
- [ ] Two parents with multiple siblings.
- [ ] Shared parent with children from multiple partnerships.
- [ ] Person who is both a child and a parent.
- [ ] One parent family.
- [ ] Disconnected family components.
- [ ] No card or junction overlaps.
- [ ] Lines do not pass through cards or junctions.
- [ ] Reduced edge crossings.
- [ ] Manual positions remain intact.
- [ ] Existing ordering and generation behaviour do not regress.

## Dark mode
- [ ] Toggle from light to dark and back.
- [ ] Preference survives reload.
- [ ] Default remains light without a saved preference.
- [ ] Canvas, cards, lines, junctions, panels, dialogs, controls, and toolbar are themed.
- [ ] Selected and dimmed states remain clear.
- [ ] Incomplete states remain clear.
- [ ] Desktop and mobile visual checks.
- [ ] App remains usable offline.

## Build and regression
- [ ] TypeScript checks.
- [ ] Unit and domain tests.
- [ ] Playwright desktop tests.
- [ ] Playwright mobile tests.
- [ ] Production build.
- [ ] PWA verification.
