# Request 009 implementation plan

## Status

Approved by the user on 2026-11-01. Implemented on branch `request/009-first-name-only` and submitted as PR #9. CI verification is running. Do not merge without separate explicit approval.

## 1. Inspect the current name editing flow

Review:

- `openPerson` initialisation of structured and legacy name fields.
- `savePerson` validation and construction of new and edited `Person` records.
- The person editor's HTML required attributes.
- The existing automatic incomplete calculation.
- Schema validation and database persistence.
- Existing unit and Playwright tests covering person creation, editing, persistence, legacy names, and name history.

Keep the change focused on the editor and save path. Do not change the schema unless inspection proves it is unavoidable.

## 2. Update name validation

- A first name is required for a newly created person.
- Middle name and last name are optional.
- On edit, allow existing legacy records with no structured name fields to be saved without changing their name.
- If the user supplies or changes any structured name component, require a first name. This prevents a surname-only or middle-name-only structured record while still allowing unrelated edits to legacy records.
- Remove the requirement that first and last names must always be supplied together.

Use explicit validation in the save handler for the conditional edit case. Do not rely solely on browser required attributes for legacy edit behaviour.

## 3. Compose and persist names safely

- Compose the display name from non-empty structured components in first, middle, last order.
- A first-name-only person therefore has a display name equal to the first name.
- Persist empty middle and last names as empty strings, consistent with the current structured name representation.
- On edit, update structured fields when the user has supplied a structured name. If all name inputs remain empty on a legacy record, preserve its existing display name and history rather than overwriting them.
- Preserve the existing name history display behaviour. Do not create or rewrite history entries as part of this change.
- Preserve manual incompleteness and all unrelated fields.

## 4. Preserve completeness behaviour

Do not introduce a new completeness rule. The current person-card logic already marks a person incomplete when the first name, last name, gender, or birth date is missing, or when manually marked incomplete.

Verify that a missing surname triggers the existing incomplete state for a first-name-only person.

## 5. Regression coverage

Add tests for:

- Creating a person with only a first name.
- Correct structured fields and display name for that person.
- Automatic incomplete status due to missing surname.
- Editing and saving a first-name-only person.
- Persistence through save and reload.
- Complete names remaining unchanged.
- Legacy records with no structured name fields remaining intact when only unrelated fields are edited.
- Partial structured names requiring a first name.
- Manual incompleteness and unrelated attributes remaining intact.

Prefer tests at the narrowest existing test layer, with a Playwright test if the editor flow is not otherwise covered end to end.

## 6. Verification

Run:

- TypeScript type checking.
- Full unit and domain test suite.
- Relevant Playwright tests.
- Production build.
- PWA build verification.

Record only checks actually run and their outcomes. Do not claim manual browser verification unless it is performed.

## 7. Scope control and delivery

1. Implement only after explicit approval of this plan.
2. Work on branch `request/009-first-name-only`.
3. Keep this request separate from Request 008.
4. Update testing and notes documents with actual outcomes.
5. Review the diff and open a pull request.
6. Wait for explicit approval before merging to `main`.
