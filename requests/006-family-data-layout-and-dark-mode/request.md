# Request 006: Family data, kinship, layout, and dark mode

## Goal

Improve Rooted's family tree so that it communicates family structure clearly, stores incomplete historical information accurately, and supports extended family relationships. Add a complete dark theme while preserving the existing light appearance.

## Requested changes

### Person information
- Split a person's name into first name, optional middle name, and last name.
- Keep first and last name required for completeness checks.
- Keep the original or birth name editable in the person editor.
- Continue showing the current married name on the person card when a partnership name change is recorded.
- Remove effective dates from name changes. The date of a marriage or partnership remains separate and optional.
- Allow birth and death dates to be recorded with year precision, month precision, or full date precision.
- Keep gender empty by default, allow female, male, and nonbinary, and show a subtle gender indicator on person cards.

### Completeness
- Automatically mark people incomplete when required information is missing: first name, last name, gender, or birth date.
- Allow people to be manually marked incomplete even when all required fields are present.
- Keep manual and automatic incompleteness independent.
- Show incomplete people with a red border and light red background.
- Allow relationships and partnerships to be manually marked incomplete as well. Add automatic checks only where a relationship has genuinely required missing information. Unknown optional dates alone must not create a warning.
- Do not add an incompleteness overview, dashboard, or summary panel. Markers belong directly on the relevant people and relationship elements.

### Family layout
- Arrange siblings together in a horizontal group.
- Centre children beneath their parents.
- Position parents above the sibling group, generally towards its outer sides.
- Treat family groups as meaningful layout units while keeping each person represented by one card.
- Reduce line crossings, prevent lines from passing through cards, and avoid awkward family positioning.
- Preserve the improved ordering and collision prevention already present. Improve the existing ELK based system rather than replacing it without cause.
- Preserve manual person positions.

### Kinship relationships
- Recognise extended kinship terms such as great aunt, great uncle, great niece, great nephew, and more distant equivalents.
- Calculate these labels from recorded family structure rather than treating them as arbitrary connections.
- Improve cousin terminology, including degree and removal where the recorded graph supports it.
- Keep the relationship finder and kinship calculations consistent.
- Do not create duplicate people or require users to manually add a separate relationship for a kinship term that can be derived from parentage.
- Continue to distinguish recorded parentage, partnerships, step relationships, and in-law relationships. Do not infer family connections without supporting records.

### Dark mode
- Add a complete dark theme for the application.
- Provide an easy to find light and dark theme control.
- Persist the selected theme across reloads.
- Keep the current light appearance as the default for existing users unless a saved theme preference exists.
- Apply the theme consistently to the canvas, person cards, relationship lines, panels, dialogs, controls, menus, and PWA interface.
- Ensure incomplete red markers remain clearly visible in both themes.

## Constraints
- Keep Rooted local first and usable offline.
- Do not add accounts, cloud services, or external dependencies unless essential and approved.
- Preserve existing family data and backup compatibility.
- Do not implement until the user explicitly approves the implementation plan.
