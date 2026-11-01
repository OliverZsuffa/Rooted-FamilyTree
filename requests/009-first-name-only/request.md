# Request 009: Allow first-name-only people

## Goal

Allow the tree to record a person when their first name is known but their middle name and surname are unknown. The person should save normally and be marked incomplete by the existing completeness rules.

## Problem

The person editor currently requires both first and last names for new people. The save handler rejects a first-name-only entry, and editing an existing person only updates structured name fields when both first and last names are present.

This prevents recording incomplete but useful genealogical information.

## Confirmed requirements

- First name is required when creating a person.
- Middle name and last name are optional.
- A first-name-only person is saved with an appropriate display name.
- Missing surname continues to trigger the existing automatic incomplete indicator.
- Editing and saving a first-name-only person works.
- Existing legacy display names and name history are preserved unless the user explicitly changes the structured name.
- Manual incomplete state and unrelated person fields are preserved.
- Complete names continue to behave as before.

## Scope exclusions

- No schema migration.
- No changes to relationship semantics, family layout, import/export formats, or completeness criteria.
- No redesign of the person editor.
- No changes to name history behaviour beyond what is necessary to preserve existing data when saving partial names.

## Acceptance criteria

1. A new person can be created with only a first name.
2. The stored first name and display name are correct, with middle and last names empty.
3. The person is automatically marked incomplete because the surname is missing.
4. A first-name-only person can be edited and saved again.
5. Saving and reloading the project preserves the person.
6. Complete first, middle, and last names continue to save and display correctly.
7. Editing a legacy person without structured name components does not erase their existing display name or name history when the name fields are left untouched.
8. Manual incompleteness, gender, dates, attributes, and other person data remain unaffected.

## Issue

Tracked in [GitHub issue #9](https://github.com/OliverZsuffa/Rooted-FamilyTree/issues/9).

## Implementation status

Plan prepared. Awaiting explicit approval before implementation.
