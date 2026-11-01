# Request 003: Eliminate mobile drag flicker

## User report

Moving a person card on a phone causes persistent flickering during movement.

## Current implementation findings

The custom `PersonCard` touch handlers call `onPersonTouchDragMove` for every touch move. That callback updates the complete project state and causes the controlled React Flow node list and relationship edges to be regenerated.

At the same time, React Flow has `nodesDraggable` enabled and receives pointer events for the same physical gesture. The custom touch path and React Flow's built in pointer drag path can therefore compete to update the same node position.

This is the leading diagnosis. The implementation should verify the event flow and avoid assuming that CSS alone is the solution.

## Desired outcome

1. A person card follows a finger smoothly on phones without flicker or jumping.
2. Exactly one interaction path owns a drag gesture.
3. The tree and relationship lines remain visually stable while moving a card.
4. The final position is persisted and survives reload.
5. One completed drag creates exactly one undo history entry.
6. Cancelling a gesture does not create a misleading history entry.
7. Empty canvas panning and pinch zoom continue to work.
8. Desktop mouse dragging remains unchanged.
9. Generation boundaries and existing layout rules remain enforced.

## Scope

Focus on mobile person card dragging and regression coverage. Do not redesign the interface or change the data model.
