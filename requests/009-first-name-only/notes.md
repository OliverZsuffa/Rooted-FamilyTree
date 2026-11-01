# Request 009 notes

- This is a separate, focused change from Request 008.
- The existing person-card completeness logic already treats a missing last name as incomplete. The implementation reuses it unchanged.
- The editor now requires only a first name for new records. Middle and last names are optional.
- On edit, supplying any structured name component requires a first name. Leaving all structured name inputs empty preserves legacy name fields, display name, and history while allowing unrelated edits.
- Existing name history display behaviour is retained: when history exists, editing structured components does not rewrite the canonical display name.
- Automated regression coverage includes creation, editing, persistence after reload, incomplete status, and legacy-name helper behaviour.
