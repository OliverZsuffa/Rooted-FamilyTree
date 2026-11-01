import type { Project } from './schema';

const FAMILY_TYPES = new Set(['biological_parent', 'adoptive_parent']);

export type FamilyGroup = {
  id: string;
  parentIds: string[];
  childIds: string[];
  generation: number;
};

export function getFamilyGroups(project: Pick<Project, 'people' | 'parentage'>): FamilyGroup[] {
  const parentsByChild = new Map<string, Set<string>>();
  for (const relation of project.parentage) {
    if (!FAMILY_TYPES.has(relation.type)) continue;
    const parents = parentsByChild.get(relation.childId) ?? new Set<string>();
    parents.add(relation.parentId);
    parentsByChild.set(relation.childId, parents);
  }

  const grouped = new Map<string, { parentIds: string[]; childIds: string[] }>();
  for (const [childId, parentSet] of parentsByChild) {
    const parentIds = [...parentSet].sort();
    if (!parentIds.length) continue;
    const key = parentIds.map((id) => encodeURIComponent(id)).join('|');
    const group = grouped.get(key) ?? { parentIds, childIds: [] };
    group.childIds.push(childId);
    grouped.set(key, group);
  }


  return [...grouped.entries()].map(([key, group]) => ({
    id: 'family:' + key,
    parentIds: group.parentIds,
    childIds: group.childIds.sort(),
  })).sort((a, b) => a.id.localeCompare(b.id));
}
