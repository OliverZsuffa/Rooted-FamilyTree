import type { Project } from './schema';

type TraversalProject = Pick<Project, 'people' | 'parentage'>;

export type FamilyTraversalComponent = {
  key: string;
  personIdsByGeneration: Map<number, string[]>;
};

const FAMILY_TYPES = new Set(['biological_parent', 'adoptive_parent']);

function compareIds(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function createSiblingClusters(
  personIds: string[],
  generation: number,
  generations: Map<string, number>,
  childrenByParent: Map<string, string[]>,
): { clusters: Map<string, string[]>; clusterByPerson: Map<string, string> } {
  const parent = new Map(personIds.map((id) => [id, id]));
  const find = (id: string): string => {
    const current = parent.get(id);
    if (!current || current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };
  const union = (first: string, second: string) => {
    const firstRoot = find(first);
    const secondRoot = find(second);
    if (firstRoot === secondRoot) return;
    if (compareIds(firstRoot, secondRoot) < 0) parent.set(secondRoot, firstRoot);
    else parent.set(firstRoot, secondRoot);
  };

  for (const childIds of childrenByParent.values()) {
    const siblings = childIds
      .filter((id) => generations.get(id) === generation && parent.has(id))
      .sort(compareIds);
    for (let index = 1; index < siblings.length; index += 1) union(siblings[0], siblings[index]);
  }

  const clusters = new Map<string, string[]>();
  const clusterByPerson = new Map<string, string>();
  for (const id of [...personIds].sort(compareIds)) {
    const key = find(id);
    clusters.set(key, [...(clusters.get(key) ?? []), id]);
    clusterByPerson.set(id, key);
  }
  for (const members of clusters.values()) members.sort(compareIds);
  return { clusters, clusterByPerson };
}

/**
 * Builds one deterministic ordering per ancestry component.
 *
 * The first pass follows the user's bottom-up idea: start with the youngest
 * generation, then discover each ancestor and that ancestor's sibling group.
 * The second pass expands those discovered branches downwards, which adds
 * cousins and other collateral descendants without duplicating people.
 */
export function buildFamilyTraversal(
  project: TraversalProject,
  generations: Map<string, number>,
): FamilyTraversalComponent[] {
  const personIds = project.people.map((person) => person.id).sort(compareIds);
  if (!personIds.length) return [];

  const knownPeople = new Set(personIds);
  const parentsByChild = new Map<string, string[]>();
  const childrenByParent = new Map<string, string[]>();
  const ancestryNeighbours = new Map(personIds.map((id) => [id, new Set<string>()]));

  for (const relation of project.parentage) {
    if (!FAMILY_TYPES.has(relation.type)
      || !knownPeople.has(relation.parentId)
      || !knownPeople.has(relation.childId)) continue;
    parentsByChild.set(relation.childId, [...(parentsByChild.get(relation.childId) ?? []), relation.parentId]);
    childrenByParent.set(relation.parentId, [...(childrenByParent.get(relation.parentId) ?? []), relation.childId]);
    ancestryNeighbours.get(relation.parentId)!.add(relation.childId);
    ancestryNeighbours.get(relation.childId)!.add(relation.parentId);
  }
  for (const values of parentsByChild.values()) values.sort(compareIds);
  for (const values of childrenByParent.values()) values.sort(compareIds);

  const components: string[][] = [];
  const visited = new Set<string>();
  for (const startId of personIds) {
    if (visited.has(startId)) continue;
    const component: string[] = [];
    const pending = [startId];
    visited.add(startId);
    while (pending.length) {
      const current = pending.pop()!;
      component.push(current);
      const neighbours = [...(ancestryNeighbours.get(current) ?? [])].sort(compareIds).reverse();
      for (const neighbour of neighbours) {
        if (visited.has(neighbour)) continue;
        visited.add(neighbour);
        pending.push(neighbour);
      }
    }
    components.push(component.sort(compareIds));
  }

  return components.map((componentIds) => {
    const componentSet = new Set(componentIds);
    const componentGenerations = componentIds.map((id) => generations.get(id) ?? 0);
    const minimumGeneration = Math.min(...componentGenerations);
    const maximumGeneration = Math.max(...componentGenerations);
    const clustersByGeneration = new Map<number, Map<string, string[]>>();
    const clusterByPerson = new Map<string, string>();
    const bottomUpRows = new Map<number, string[]>();

    for (let generation = minimumGeneration; generation <= maximumGeneration; generation += 1) {
      const rowIds = componentIds.filter((id) => (generations.get(id) ?? 0) === generation);
      const siblingData = createSiblingClusters(rowIds, generation, generations, childrenByParent);
      clustersByGeneration.set(generation, siblingData.clusters);
      for (const [personId, clusterId] of siblingData.clusterByPerson) clusterByPerson.set(personId, clusterId);
    }

    // Start with the youngest row. Every sibling network is kept together.
    const youngestClusters = [...(clustersByGeneration.get(maximumGeneration) ?? new Map())]
      .sort((first, second) => compareIds(first[1][0], second[1][0]));
    bottomUpRows.set(maximumGeneration, youngestClusters.flatMap(([, members]) => members));

    // Walk upwards. Encounter order follows the descendants already placed.
    for (let generation = maximumGeneration - 1; generation >= minimumGeneration; generation -= 1) {
      const childOrder = bottomUpRows.get(generation + 1) ?? [];
      const firstSeenCluster = new Map<string, number>();
      const firstSeenMember = new Map<string, number>();
      let encounter = 0;

      for (const childId of childOrder) {
        for (const parentId of parentsByChild.get(childId) ?? []) {
          if (!componentSet.has(parentId) || generations.get(parentId) !== generation) continue;
          const clusterId = clusterByPerson.get(parentId);
          if (!clusterId) continue;
          if (!firstSeenCluster.has(clusterId)) firstSeenCluster.set(clusterId, encounter);
          if (!firstSeenMember.has(parentId)) firstSeenMember.set(parentId, encounter);
          encounter += 1;
        }
      }

      const clusters = clustersByGeneration.get(generation) ?? new Map<string, string[]>();
      const orderedClusterIds = [...clusters.keys()].sort((first, second) => {
        const firstSeen = firstSeenCluster.get(first);
        const secondSeen = firstSeenCluster.get(second);
        if (firstSeen !== undefined || secondSeen !== undefined) {
          if (firstSeen === undefined) return 1;
          if (secondSeen === undefined) return -1;
          if (firstSeen !== secondSeen) return firstSeen - secondSeen;
        }
        return compareIds(clusters.get(first)![0], clusters.get(second)![0]);
      });
      const orderedIds: string[] = [];
      for (const clusterId of orderedClusterIds) {
        const members = [...clusters.get(clusterId)!].sort((first, second) => {
          const firstSeen = firstSeenMember.get(first);
          const secondSeen = firstSeenMember.get(second);
          if (firstSeen !== undefined || secondSeen !== undefined) {
            if (firstSeen === undefined) return 1;
            if (secondSeen === undefined) return -1;
            if (firstSeen !== secondSeen) return firstSeen - secondSeen;
          }
          return compareIds(first, second);
        });
        orderedIds.push(...members);
      }
      bottomUpRows.set(generation, orderedIds);
    }

    // Expand downwards from the ordered oldest row. This is what brings in
    // descendants of an ancestor's siblings, including cousins not on the
    // original path from the youngest seed people.
    const orderedRows = new Map<number, string[]>();
    orderedRows.set(minimumGeneration, bottomUpRows.get(minimumGeneration) ?? []);
    for (let generation = minimumGeneration + 1; generation <= maximumGeneration; generation += 1) {
      const parentOrder = orderedRows.get(generation - 1) ?? [];
      const parentRank = new Map(parentOrder.map((id, index) => [id, index]));
      const firstSeenCluster = new Map<string, number>();
      const firstSeenMember = new Map<string, number>();
      let encounter = 0;

      for (const parentId of parentOrder) {
        for (const childId of childrenByParent.get(parentId) ?? []) {
          if (!componentSet.has(childId) || generations.get(childId) !== generation) continue;
          const clusterId = clusterByPerson.get(childId);
          if (!clusterId) continue;
          if (!firstSeenCluster.has(clusterId)) firstSeenCluster.set(clusterId, encounter);
          const rank = parentRank.get(parentId) ?? Number.MAX_SAFE_INTEGER;
          const previousRank = firstSeenMember.get(childId);
          if (previousRank === undefined || rank < previousRank) firstSeenMember.set(childId, rank);
          encounter += 1;
        }
      }

      const clusters = clustersByGeneration.get(generation) ?? new Map<string, string[]>();
      const fallbackRank = new Map((bottomUpRows.get(generation) ?? []).map((id, index) => [id, index]));
      const orderedClusterIds = [...clusters.keys()].sort((first, second) => {
        const firstSeen = firstSeenCluster.get(first);
        const secondSeen = firstSeenCluster.get(second);
        if (firstSeen !== undefined || secondSeen !== undefined) {
          if (firstSeen === undefined) return 1;
          if (secondSeen === undefined) return -1;
          if (firstSeen !== secondSeen) return firstSeen - secondSeen;
        }
        return compareIds(clusters.get(first)![0], clusters.get(second)![0]);
      });
      const orderedIds: string[] = [];
      for (const clusterId of orderedClusterIds) {
        const members = [...clusters.get(clusterId)!].sort((first, second) => {
          const firstParentRank = firstSeenMember.get(first);
          const secondParentRank = firstSeenMember.get(second);
          if (firstParentRank !== undefined || secondParentRank !== undefined) {
            if (firstParentRank === undefined) return 1;
            if (secondParentRank === undefined) return -1;
            if (firstParentRank !== secondParentRank) return firstParentRank - secondParentRank;
          }
          const rankDifference = (fallbackRank.get(first) ?? Number.MAX_SAFE_INTEGER)
            - (fallbackRank.get(second) ?? Number.MAX_SAFE_INTEGER);
          return rankDifference || compareIds(first, second);
        });
        orderedIds.push(...members);
      }
      orderedRows.set(generation, orderedIds);
    }

    return {
      key: componentIds[0],
      personIdsByGeneration: orderedRows,
    };
  }).sort((first, second) => compareIds(first.key, second.key));
}
