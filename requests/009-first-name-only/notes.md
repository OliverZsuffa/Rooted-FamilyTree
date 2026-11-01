# Request 009 notes

- This is a separate, focused change from Request 008.
- The existing person-card completeness logic already treats a missing last name as incomplete. The implementation should reuse it.
- The current editor has two separate blockers: browser-level required attributes on first and last name, and save-handler validation requiring both names.
- The current edit path also updates structured name fields only when both first and last names are present.
- Preserve legacy display names and name history when the user is editing unrelated attributes and has not entered structured name components.
- Do not begin application code changes until the implementation plan is explicitly approved.
