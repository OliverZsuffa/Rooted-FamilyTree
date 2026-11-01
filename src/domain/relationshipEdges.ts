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
  const routeLanes = new Map<string, number>();
  const routeIntervals = familyGroups.map((group) => {
    const points = [...group.parentIds, ...group.childIds].map((id) => positions[id]).filter((point): point is { x: number; y: number } => !!point);
    return { id: group.id, left: points.length ? Math.min(...points.map((point) => point.x)) : 0, right: points.length ? Math.max(...points.map((point) => point.x + 176)) : 0 };
  }).sort((a, b) => a.left - b.left || a.right - b.right || a.id.localeCompare(b.id));
  const laneEnds: number[] = [];
  for (const interval of routeIntervals) {
    let lane = laneEnds.findIndex((end) => end < interval.left);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = interval.right;
    routeLanes.set(interval.id, lane);
  }
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
        sourceHandle: 'parentage-out-bottom',
        targetHandle: 'family-in-top',
        type: 'smoothstep',
        pathOptions: { offset: 24 + (routeLanes.get(group.id) ?? 0) * 14, borderRadius: 10 },
        style: { stroke: project.parentage.some((relation) => relation.parentId === parentId && group.childIds.includes(relation.childId) && relation.manualIncomplete) ? 'var(--edge-incomplete)' : 'var(--edge-parentage)', strokeWidth: 1.5 },
      });
    }
    for (const childId of group.childIds) {
      if (!visibleIds.has(childId)) continue;
      result.push({
        id: group.id + ':child:' + childId,
        source: group.id,
        target: childId,
        sourceHandle: 'family-out-bottom',
        targetHandle: 'parentage-in-top',
        type: 'smoothstep',
        pathOptions: { offset: 24 + (routeLanes.get(group.id) ?? 0) * 14, borderRadius: 10 },
        style: { stroke: project.parentage.some((relation) => relation.childId === childId && group.parentIds.includes(relation.parentId) && relation.manualIncomplete) ? 'var(--edge-incomplete)' : 'var(--edge-parentage)', strokeWidth: 1.5 },
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
      sourceHandle: 'parentage-out-bottom',
      targetHandle: 'parentage-in-top',
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: relation.manualIncomplete ? 'var(--edge-incomplete)' : 'var(--edge-secondary)',
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
      labelStyle: { fill: partnership.manualIncomplete ? 'var(--edge-incomplete)' : 'var(--edge-partnership)', fontSize: 13 },
      labelBgStyle: { fill: 'var(--paper)', fillOpacity: 0.95 },
      style: { stroke: partnership.manualIncomplete ? 'var(--edge-incomplete)' : 'var(--edge-partnership)', strokeWidth: 1.7 },
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
