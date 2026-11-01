import type { Project } from './schema';
import { getFamilyGroups } from './familyGroups';
import { getKinshipLabel } from './kinship';

export type RelationshipPath = {
  label: string;
  personIds: string[];
  relationshipIds: string[];
  familyGroupIds: string[];
  ambiguous: boolean;
  alternativeCount: number;
};

type Link = { personId: string; relationshipId: string; kind: 'parentage' | 'partnership' };

export function findRelationshipPath(project: Project, firstId: string, secondId: string): RelationshipPath | null {
  const people = new Set(project.people.map((person) => person.id));
  if (!people.has(firstId) || !people.has(secondId)) return null;
  if (firstId === secondId) return {
    label: 'the same person',
    personIds: [firstId],
    relationshipIds: [],
    familyGroupIds: [],
    ambiguous: false,
    alternativeCount: 0,
  };

  const links = new Map<string, Link[]>();
  const add = (from: string, to: string, relationshipId: string, kind: Link['kind']) => {
    links.set(from, [...(links.get(from) ?? []), { personId: to, relationshipId, kind }]);
  };
  for (const relation of project.parentage) {
    if (!people.has(relation.parentId) || !people.has(relation.childId)) continue;
    add(relation.parentId, relation.childId, relation.id, 'parentage');
    add(relation.childId, relation.parentId, relation.id, 'parentage');
  }
  for (const relation of project.partnerships) {
    if (!people.has(relation.person1Id) || !people.has(relation.person2Id)) continue;
    add(relation.person1Id, relation.person2Id, relation.id, 'partnership');
    add(relation.person2Id, relation.person1Id, relation.id, 'partnership');
  }

  const queue: Array<{ id: string; personIds: string[]; relationshipIds: string[]; kinds: Link['kind'][] }> = [
    { id: firstId, personIds: [firstId], relationshipIds: [], kinds: [] },
  ];
  const bestDepth = new Map<string, number>([[firstId, 0]]);
  const paths: typeof queue = [];
  let shortest = Number.POSITIVE_INFINITY;
  while (queue.length) {
    const current = queue.shift()!;
    const depth = current.relationshipIds.length;
    if (depth > shortest) break;
    if (current.id === secondId) {
      shortest = depth;
      paths.push(current);
      continue;
    }
    for (const link of links.get(current.id) ?? []) {
      if (current.personIds.includes(link.personId)) continue;
      const nextDepth = depth + 1;
      const knownDepth = bestDepth.get(link.personId);
      if (knownDepth !== undefined && nextDepth > knownDepth) continue;
      bestDepth.set(link.personId, nextDepth);
      queue.push({
        id: link.personId,
        personIds: [...current.personIds, link.personId],
        relationshipIds: [...current.relationshipIds, link.relationshipId],
        kinds: [...current.kinds, link.kind],
      });
    }
  }
  if (!paths.length) return null;

  const uniquePaths = paths.filter((path, index) =>
    paths.findIndex((other) => other.relationshipIds.join('|') === path.relationshipIds.join('|')
      && other.personIds.join('|') === path.personIds.join('|')) === index);
  let kinship = getKinshipLabel(project, firstId, secondId);
  const isPartner = (a: string, b: string) => project.partnerships.some((item) =>
    (item.person1Id === a && item.person2Id === b) || (item.person1Id === b && item.person2Id === a));
  const parentIds = (id: string) => project.parentage.filter((item) =>
    (item.type === 'biological_parent' || item.type === 'adoptive_parent') && item.childId === id).map((item) => item.parentId);
  const areSiblings = (a: string, b: string) => parentIds(a).some((id) => parentIds(b).includes(id));
  if (!kinship) {
    const subjectParents = parentIds(firstId);
    const subjectChildren = project.parentage.filter((item) =>
      (item.type === 'biological_parent' || item.type === 'adoptive_parent') && item.parentId === firstId).map((item) => item.childId);
    const partnerIds = project.partnerships.flatMap((item) =>
      item.person1Id === firstId ? [item.person2Id] : item.person2Id === firstId ? [item.person1Id] : []);
    const siblingOfSubject = project.people.some((person) => person.id !== firstId && areSiblings(firstId, person.id) && isPartner(person.id, secondId));
    const siblingOfPartner = partnerIds.some((partnerId) => areSiblings(partnerId, secondId));
    if (siblingOfSubject || siblingOfPartner) kinship = 'sibling-in-law';
    else if (subjectParents.some((parentId) => isPartner(parentId, secondId))
      || partnerIds.some((partnerId) => parentIds(partnerId).includes(secondId))) kinship = 'parent-in-law';
    else if (subjectChildren.some((childId) => isPartner(childId, secondId))
      || partnerIds.some((partnerId) => project.parentage.some((item) =>
        (item.type === 'biological_parent' || item.type === 'adoptive_parent') && item.parentId === secondId && item.childId === partnerId))) kinship = 'child-in-law';
  }
  const directPartnership = uniquePaths[0].relationshipIds.length === 1
    && project.partnerships.some((item) => item.id === uniquePaths[0].relationshipIds[0]);
  const hasPartnership = uniquePaths[0].kinds.includes('partnership');
  const label = kinship ?? (directPartnership ? 'partner' : hasPartnership ? 'related through marriage or partnership' : 'connected through recorded relationships');
  const selected = uniquePaths[0];
  const familyGroupIds = getFamilyGroups(project).filter((group) =>
    selected.personIds.some((parentId, index) => index < selected.personIds.length - 1
      && group.parentIds.includes(parentId)
      && group.childIds.includes(selected.personIds[index + 1])
      || index > 0 && group.parentIds.includes(parentId)
      && group.childIds.includes(selected.personIds[index - 1])))
    .map((group) => group.id);

  return {
    label,
    personIds: selected.personIds,
    relationshipIds: selected.relationshipIds,
    familyGroupIds,
    ambiguous: uniquePaths.length > 1,
    alternativeCount: Math.max(0, uniquePaths.length - 1),
  };
}
