import type { Parentage, Project } from './schema';

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

  const generationById = new Map<string, number>();
  const knownIds = new Set(project.people.map((person) => person.id));
  for (const relation of project.parentage as Parentage[]) {
    if (FAMILY_TYPES.has(relation.type) && knownIds.has(relation.parentId) && knownIds.has(relation.childId)) {
      generationById.set(relation.childId, (generationById.get(relation.parentId) ?? 0) + 1);
    }
  }

  return [...grouped.entries()].map(([key, group]) => ({
    id: 'family:' + key,
    parentIds: group.parentIds,
    childIds: group.childIds.sort(),
    generation: Math.max(1, ...group.childIds.map((id) => generationById.get(id) ?? 1)),
  })).sort((a, b) => a.id.localeCompare(b.id));
}
