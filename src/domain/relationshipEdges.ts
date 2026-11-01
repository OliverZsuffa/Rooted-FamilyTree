import type { Edge } from '@xyflow/react';
import type { Project } from './schema';

export function buildRelationshipEdges(
  project: Project,
  visibleNodeIds: Iterable<string>,
  selectedId: string | null,
  highlightedIds: Set<string>,
): Edge[] {
  const visibleIds = new Set(visibleNodeIds);
  const result: Edge[] = [];
  const consumedParentage = new Set<string>();

  for (const partnership of project.partnerships) {
    const sharedPairs = project.parentage.flatMap((first) => {
      if (first.parentId !== partnership.person1Id) return [];
      const second = project.parentage.find((other) =>
        other.childId === first.childId && other.parentId === partnership.person2Id);
      return second ? [{ first, second }] : [];
    });
    const junctionId = 'junction:' + partnership.id;
    const visiblePairs = sharedPairs.filter(({ first }) => visibleIds.has(first.childId));

    if (visiblePairs.length && visibleIds.has(junctionId)
      && visibleIds.has(partnership.person1Id) && visibleIds.has(partnership.person2Id)) {
      result.push(
        { id: partnership.id + ':first', source: partnership.person1Id, target: junctionId, type: 'smoothstep', style: { stroke: '#78805a', strokeWidth: 1.5 } },
        { id: partnership.id + ':second', source: partnership.person2Id, target: junctionId, type: 'smoothstep', style: { stroke: '#78805a', strokeWidth: 1.5 } },
      );
      for (const { first, second } of visiblePairs) {
        consumedParentage.add(first.id);
        consumedParentage.add(second.id);
        result.push({
          id: partnership.id + ':child:' + first.childId,
          source: junctionId,
          target: first.childId,
          type: 'smoothstep',
          style: { stroke: '#8b765e', strokeWidth: 1.5 },
        });
      }
    } else if (!visiblePairs.length) {
      result.push({
        id: partnership.id,
        source: partnership.person1Id,
        target: partnership.person2Id,
        type: 'straight',
        label: partnership.type === 'marriage' ? '♥' : '♡',
        labelStyle: { fill: '#78805a', fontSize: 13 },
        style: { stroke: '#78805a', strokeWidth: 1.5 },
      });
    }
  }

  for (const relation of project.parentage) {
    if (consumedParentage.has(relation.id)) continue;
    result.push({
      id: relation.id,
      source: relation.parentId,
      target: relation.childId,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: relation.type === 'biological_parent' ? '#8b765e' : '#a99a83',
        strokeWidth: 1.5,
        strokeDasharray: relation.type === 'guardian' || relation.type === 'step_parent' ? '5 4' : undefined,
      },
    });
  }

  return result
    .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: !selectedId || (highlightedIds.has(edge.source) && highlightedIds.has(edge.target)) ? 1 : 0.15,
      },
    }));
}
