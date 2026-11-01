import type { Person, Project } from './schema';

const ancestryTypes = new Set(['biological_parent', 'adoptive_parent']);

function gendered(person: Person | undefined, female: string, male: string, neutral: string): string {
  if (person?.gender === 'female') return female;
  if (person?.gender === 'male') return male;
  return neutral;
}

function ancestry(project: Project, startId: string): Map<string, number> {
  const parents = new Map<string, string[]>();
  for (const relation of project.parentage) {
    if (!ancestryTypes.has(relation.type)) continue;
    parents.set(relation.childId, [...(parents.get(relation.childId) ?? []), relation.parentId]);
  }
  const distances = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
  while (queue.length) {
    const current = queue.shift()!;
    for (const parentId of parents.get(current.id) ?? []) {
      const depth = current.depth + 1;
      if (distances.has(parentId) && distances.get(parentId)! <= depth) continue;
      distances.set(parentId, depth);
      queue.push({ id: parentId, depth });
    }
  }
  return distances;
}

function parentsOf(project: Project, id: string): string[] {
  return [...new Set(project.parentage
    .filter((relation) => ancestryTypes.has(relation.type) && relation.childId === id)
    .map((relation) => relation.parentId))];
}

function siblings(project: Project, firstId: string, secondId: string): { shared: number; firstCount: number; secondCount: number } {
  const first = parentsOf(project, firstId);
  const second = parentsOf(project, secondId);
  return { shared: first.filter((id) => second.includes(id)).length, firstCount: first.length, secondCount: second.length };
}

function stepParentIds(project: Project, childId: string): Set<string> {
  const ids = new Set(project.parentage.filter((r) => r.type === 'step_parent' && r.childId === childId).map((r) => r.parentId));
  const biologicalParents = parentsOf(project, childId);
  for (const partnership of project.partnerships) {
    if (biologicalParents.includes(partnership.person1Id)) ids.add(partnership.person2Id);
    if (biologicalParents.includes(partnership.person2Id)) ids.add(partnership.person1Id);
  }
  return ids;
}

export function getKinshipLabel(project: Project, subjectId: string, relativeId: string): string | null {
  if (subjectId === relativeId) return null;
  const people = new Map(project.people.map((person) => [person.id, person]));
  const subject = people.get(subjectId);
  const relative = people.get(relativeId);
  if (!subject || !relative) return null;

  const relativeAncestors = ancestry(project, relativeId);
  const subjectAncestors = ancestry(project, subjectId);
  const relativeAsAncestor = subjectAncestors.get(relativeId);
  const subjectAsAncestor = relativeAncestors.get(subjectId);
  if (relativeAsAncestor !== undefined) {
    if (relativeAsAncestor === 1) return gendered(relative, 'mother', 'father', 'parent');
    if (relativeAsAncestor === 2) return gendered(relative, 'grandmother', 'grandfather', 'grandparent');
    return gendered(relative, 'great-grandmother', 'great-grandfather', 'great-grandparent');
  }
  if (subjectAsAncestor !== undefined) {
    if (subjectAsAncestor === 1) return gendered(relative, 'daughter', 'son', 'child');
    if (subjectAsAncestor === 2) return gendered(relative, 'granddaughter', 'grandson', 'grandchild');
    return gendered(relative, 'great-granddaughter', 'great-grandson', 'great-grandchild');
  }

  const sibling = siblings(project, subjectId, relativeId);
  if (sibling.shared > 0) {
    if (sibling.shared === 1 && (sibling.firstCount > 1 || sibling.secondCount > 1)) {
      return gendered(relative, 'half-sister', 'half-brother', 'half-sibling');
    }
    return gendered(relative, 'sister', 'brother', 'sibling');
  }

  const subjectParents = parentsOf(project, subjectId);
  const relativeParents = parentsOf(project, relativeId);
  const auntUncle = subjectParents.some((parentId) => siblings(project, parentId, relativeId).shared > 0);
  if (auntUncle) return gendered(relative, 'aunt', 'uncle', 'parent’s sibling');
  const nieceNephew = relativeParents.some((parentId) => siblings(project, parentId, subjectId).shared > 0);
  if (nieceNephew) return gendered(relative, 'niece', 'nephew', 'sibling’s child');

  let cousinDepth: number | null = null;
  for (const [ancestorId, subjectDepth] of subjectAncestors) {
    const relativeDepth = relativeAncestors.get(ancestorId);
    if (relativeDepth === undefined || subjectDepth < 2 || relativeDepth < 2) continue;
    const total = subjectDepth + relativeDepth;
    if (cousinDepth === null || total < cousinDepth) cousinDepth = total;
  }
  if (cousinDepth !== null) return 'cousin';

  if (stepParentIds(project, subjectId).has(relativeId)) return gendered(relative, 'stepmother', 'stepfather', 'stepparent');
  if (stepParentIds(project, relativeId).has(subjectId)) return gendered(relative, 'stepdaughter', 'stepson', 'stepchild');

  const subjectStepParents = stepParentIds(project, subjectId);
  const relativeStepParents = stepParentIds(project, relativeId);
  if ([...subjectStepParents].some((id) => relativeStepParents.has(id))) {
    return gendered(relative, 'stepsister', 'stepbrother', 'stepsibling');
  }
  return null;
}

export function getKinshipRows(project: Project, subjectId: string): Array<{ person: Person; label: string }> {
  return project.people.flatMap((person) => {
    const label = getKinshipLabel(project, subjectId, person.id);
    return label ? [{ person, label }] : [];
  }).sort((a, b) => a.label.localeCompare(b.label) || a.person.name.localeCompare(b.person.name));
}
