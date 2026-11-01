import type { Edge } from '@xyflow/react';
import type { Project } from './schema';
import { getFamilyGroups } from './familyGroups';

export function buildRelationshipEdges(
  project: Project,
  visibleNodeIds: Iterable<string>,
  selectedId: string | null,
  highlightedIds: Set<string>,
): Edge[] {
  const visibleIds = new Set(visibleNodeIds);
  const result: Edge[] = [];

  for (const group of getFamilyGroups(project)) {
    if (!visibleIds.has(group.id)) continue;
    for (const parentId of group.parentIds) {
      if (!visibleIds.has(parentId)) continue;
      result.push({
        id: group.id + ':parent:' + parentId,
        source: parentId,
        target: group.id,
        type: 'smoothstep',
        style: { stroke: '#8b765e', strokeWidth: 1.5 },
      });
    }
    for (const childId of group.childIds) {
      if (!visibleIds.has(childId)) continue;
      result.push({
        id: group.id + ':child:' + childId,
        source: group.id,
        target: childId,
        type: 'smoothstep',
        style: { stroke: '#8b765e', strokeWidth: 1.5 },
      });
    }
  }

  for (const relation of project.parentage) {
    if (relation.type === 'biological_parent' || relation.type === 'adoptive_parent') continue;
    if (!visibleIds.has(relation.parentId) || !visibleIds.has(relation.childId)) continue;
    result.push({
      id: relation.id,
      source: relation.parentId,
      target: relation.childId,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#a99a83',
        strokeWidth: 1.5,
        strokeDasharray: '5 4',
      },
    });
  }

  for (const partnership of project.partnerships) {
    if (!visibleIds.has(partnership.person1Id) || !visibleIds.has(partnership.person2Id)) continue;
    result.push({
      id: partnership.id,
      source: partnership.person1Id,
      target: partnership.person2Id,
      sourceHandle: 'partnership-right',
      targetHandle: 'partnership-left',
      type: 'bezier',
      label: partnership.type === 'marriage' ? '♥' : '♡',
      labelStyle: { fill: '#78805a', fontSize: 13 },
      labelBgStyle: { fill: '#f2eee4', fillOpacity: 0.95 },
      style: { stroke: '#78805a', strokeWidth: 1.7 },
    });
  }

  return result.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: !selectedId || (highlightedIds.has(edge.source) && highlightedIds.has(edge.target)) ? 1 : 0.15,
    },
  }));
}
