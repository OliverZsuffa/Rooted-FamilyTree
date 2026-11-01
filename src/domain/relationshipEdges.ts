import type { Edge } from '@xyflow/react';
import type { Project } from './schema';
import { getFamilyGroups } from './familyGroups';

export function buildRelationshipEdges(
  project: Project,
  visibleNodeIds: Iterable<string>,
  selectedId: string | null,
  highlightedIds: Set<string>,
  positions: Record<string, { x: number; y: number }> = {},
): Edge[] {
  const visibleIds = new Set(visibleNodeIds);
  const result: Edge[] = [];
  const familyGroups = getFamilyGroups(project);
  const consolidatedPartnershipIds = new Set<string>();
  for (const group of familyGroups) {
    if (group.parentIds.length !== 2 || !visibleIds.has(group.id) || !group.parentIds.every((id) => visibleIds.has(id)) || !group.childIds.some((id) => visibleIds.has(id))) continue;
    const partnership = project.partnerships.find((item) => [item.person1Id, item.person2Id].sort().join('|') === group.parentIds.join('|'));
    if (partnership) consolidatedPartnershipIds.add(partnership.id);
  }

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
    if (consolidatedPartnershipIds.has(partnership.id)) continue;
    if (!visibleIds.has(partnership.person1Id) || !visibleIds.has(partnership.person2Id)) continue;
    result.push({
      id: partnership.id,
      source: partnership.person1Id,
      target: partnership.person2Id,
      sourceHandle: (positions[partnership.person1Id]?.x ?? 0) <= (positions[partnership.person2Id]?.x ?? 0) ? 'partnership-out-right' : 'partnership-out-left',
      targetHandle: (positions[partnership.person1Id]?.x ?? 0) <= (positions[partnership.person2Id]?.x ?? 0) ? 'partnership-in-left' : 'partnership-in-right',
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
      opacity: !selectedId || (() => { const groupId = edge.id.includes(':parent:') || edge.id.includes(':child:') ? edge.id.slice(0, edge.id.lastIndexOf(':')) : null; if (groupId && highlightedIds.has(groupId)) return true; return edge.source.startsWith('family:') ? highlightedIds.has(edge.target) : edge.target.startsWith('family:') ? highlightedIds.has(edge.source) : highlightedIds.has(edge.source) && highlightedIds.has(edge.target); })() ? 1 : 0.15,
    },
  }));
}
