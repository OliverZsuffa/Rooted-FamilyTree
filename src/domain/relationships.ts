import type { Parentage, ParentageType, Person, Project } from './schema';

export type GenerationResult =
  | { ok: true; generations: Map<string, number> }
  | { ok: false; error: string };

const GENERATION_TYPES = new Set<ParentageType>(['biological_parent', 'adoptive_parent']);

export function calculateGenerations(project: Pick<Project, 'people' | 'parentage'>): GenerationResult {
  const people = new Set(project.people.map((person) => person.id));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  for (const person of project.people) {
    incoming.set(person.id, []);
    outgoing.set(person.id, []);
  }

  for (const relation of project.parentage) {
    if (!people.has(relation.parentId) || !people.has(relation.childId)) {
      return { ok: false, error: 'A parentage relationship refers to a person that does not exist.' };
    }
    if (relation.parentId === relation.childId) {
      return { ok: false, error: 'A person cannot be their own parent.' };
    }
    if (!GENERATION_TYPES.has(relation.type)) continue;
    incoming.get(relation.childId)!.push(relation.parentId);
    outgoing.get(relation.parentId)!.push(relation.childId);
  }

  const indegree = new Map([...incoming].map(([id, parents]) => [id, parents.length]));
  const queue = project.people.filter((person) => indegree.get(person.id) === 0).map((person) => person.id);
  const generations = new Map<string, number>();
  for (const id of queue) generations.set(id, 0);

  let visited = 0;
  while (queue.length) {
    const parentId = queue.shift()!;
    visited += 1;
    for (const childId of outgoing.get(parentId) ?? []) {
      const parents = incoming.get(childId) ?? [];
      const parentGenerations = parents.map((id) => generations.get(id)!);
      if (new Set(parentGenerations).size > 1) {
        return { ok: false, error: 'Biological and adoptive parents must belong to the same generation.' };
      }
      generations.set(childId, parentGenerations[0] + 1);
      indegree.set(childId, indegree.get(childId)! - 1);
      if (indegree.get(childId) === 0) queue.push(childId);
    }
  }

  if (visited !== project.people.length) {
    return { ok: false, error: 'This parentage would create a cycle in the family tree.' };
  }
  return { ok: true, generations };
}

export function validateParentage(project: Project, relation: Parentage): string | null {
  if (!project.people.some((person) => person.id === relation.parentId)
    || !project.people.some((person) => person.id === relation.childId)) {
    return 'Choose two existing people.';
  }
  if (project.parentage.some((item) => item.parentId === relation.parentId && item.childId === relation.childId && item.type === relation.type)) {
    return 'This relationship already exists.';
  }
  return calculateGenerations({ people: project.people, parentage: [...project.parentage, relation] }).ok
    ? null
    : calculateGenerations({ people: project.people, parentage: [...project.parentage, relation] }).error;
}

export function getSiblings(project: Project, personId: string): Person[] {
  const parentIds = new Set(project.parentage
    .filter((item) => item.childId === personId && GENERATION_TYPES.has(item.type))
    .map((item) => item.parentId));
  if (!parentIds.size) return [];
  const siblingIds = new Set(project.parentage
    .filter((item) => parentIds.has(item.parentId) && GENERATION_TYPES.has(item.type))
    .map((item) => item.childId));
  siblingIds.delete(personId);
  return project.people.filter((person) => siblingIds.has(person.id));
}
