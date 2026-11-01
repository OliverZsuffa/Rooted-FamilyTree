import type { Parentage, ParentageType, Person, Project } from './schema';

export type GenerationResult =
  | { ok: true; generations: Map<string, number> }
  | { ok: false; error: string };

const GENERATION_TYPES = new Set<ParentageType>(['biological_parent', 'adoptive_parent']);

export function calculateGenerations(project: Pick<Project, 'people' | 'parentage'>): GenerationResult {
  const people = new Set(project.people.map((person) => person.id));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  const adjacency = new Map<string, { id: string; offset: number }[]>();

  for (const person of project.people) {
    incoming.set(person.id, []);
    outgoing.set(person.id, []);
    adjacency.set(person.id, []);
  }

  for (const relation of project.parentage) {
    if (!people.has(relation.parentId) || !people.has(relation.childId)) {
      return { ok: false, error: 'A relationship refers to a person that does not exist.' };
    }
    if (relation.parentId === relation.childId) {
      return { ok: false, error: 'A person cannot be their own parent.' };
    }
    if (!GENERATION_TYPES.has(relation.type)) continue;
    incoming.get(relation.childId)!.push(relation.parentId);
    outgoing.get(relation.parentId)!.push(relation.childId);
    adjacency.get(relation.parentId)!.push({ id: relation.childId, offset: 1 });
    adjacency.get(relation.childId)!.push({ id: relation.parentId, offset: -1 });
  }

  // A topological pass detects circular ancestry independently of generation offsets.
  const indegree = new Map([...incoming].map(([id, parents]) => [id, parents.length]));
  const queue = project.people.filter((person) => indegree.get(person.id) === 0).map((person) => person.id);
  let visited = 0;
  while (queue.length) {
    const parentId = queue.shift()!;
    visited += 1;
    for (const childId of outgoing.get(parentId) ?? []) {
      indegree.set(childId, indegree.get(childId)! - 1);
      if (indegree.get(childId) === 0) queue.push(childId);
    }
  }
  if (visited !== project.people.length) {
    return { ok: false, error: 'This parentage would create a cycle in the family tree.' };
  }

  // Each connected ancestry component gets its own offset. This lets a newly added
  // parent join an existing generation without incorrectly forcing them to generation zero.
  const offsets = new Map<string, number>();
  const components: string[][] = [];
  for (const person of project.people) {
    if (offsets.has(person.id)) continue;
    const component: string[] = [];
    const pending = [person.id];
    offsets.set(person.id, 0);
    while (pending.length) {
      const current = pending.pop()!;
      component.push(current);
      for (const edge of adjacency.get(current) ?? []) {
        const expected = offsets.get(current)! + edge.offset;
        if (offsets.has(edge.id)) {
          if (offsets.get(edge.id) !== expected) {
            return { ok: false, error: 'Biological and adoptive parents must belong to the same generation.' };
          }
        } else {
          offsets.set(edge.id, expected);
          pending.push(edge.id);
        }
      }
    }
    components.push(component);
  }

  const generations = new Map<string, number>();
  for (const component of components) {
    const minimum = Math.min(...component.map((id) => offsets.get(id)!));
    for (const id of component) generations.set(id, offsets.get(id)! - minimum);
  }
  return { ok: true, generations };
}

export function validateParentage(project: Project, relation: Parentage): string | null {
  if (!project.people.some((person) => person.id === relation.parentId)
    || !project.people.some((person) => person.id === relation.childId)) return 'Choose two existing people.';
  if (project.parentage.some((item) => item.parentId === relation.parentId
    && item.childId === relation.childId && item.type === relation.type)) return 'This relationship already exists.';
  const result = calculateGenerations({ people: project.people, parentage: [...project.parentage, relation] });
  return result.ok ? null : result.error;
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
