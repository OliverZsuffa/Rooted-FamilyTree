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
  parentsByChild: Map<string, string[]>,
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
  for (const members of clusters.values()) {
    const groupsByParentSet = new Map<string, string[]>();
    for (const member of members) {
      const parentSetKey = (parentsByChild.get(member) ?? []).join('|');
      groupsByParentSet.set(parentSetKey, [...(groupsByParentSet.get(parentSetKey) ?? []), member]);
    }
    const orderedGroups = [...groupsByParentSet.entries()].sort((first, second) =>
      first[1].length - second[1].length || compareIds(first[0], second[0]));
    members.splice(0, members.length, ...orderedGroups.flatMap(([, groupMembers]) => groupMembers.sort(compareIds)));
  }
  return { clusters, clusterByPerson };
}


type LayoutEdge = { parentId: string; childId: string };
const MAX_LAYOUT_SWEEPS = 8;
const MAX_LAYOUT_EVALUATIONS = 1200;

function layoutScore(rows: Map<number, string[]>, edges: LayoutEdge[], generationByPerson: Map<string, number>) {
  let crossings = 0;
  let span = 0;
  const ranks = new Map<number, Map<string, number>>();
  for (const [generation, ids] of rows) {
    ranks.set(generation, new Map(ids.map((id, index) => [id, index])));
  }
  const byLayer = new Map<number, LayoutEdge[]>();
  for (const edge of edges) {
    const generation = generationByPerson.get(edge.parentId);
    if (generation === undefined || generationByPerson.get(edge.childId) !== generation + 1) continue;
    byLayer.set(generation, [...(byLayer.get(generation) ?? []), edge]);
  }
  for (const [generation, layerEdges] of byLayer) {
    const source = ranks.get(generation)!;
    const target = ranks.get(generation + 1)!;
    const ordered = layerEdges.map(edge => ({
      a: source.get(edge.parentId)!,
      b: target.get(edge.childId)!,
    })).sort((x, y) => x.a - y.a || x.b - y.b);
    for (let i = 0; i < ordered.length; i += 1) {
      span += Math.abs(ordered[i].a - ordered[i].b);
      for (let j = i + 1; j < ordered.length; j += 1) {
        if (ordered[i].a !== ordered[j].a && ordered[i].b > ordered[j].b) crossings += 1;
      }
    }
  }
  return { crossings, span };
}

function optimiseRows(
  input: Map<number, string[]>,
  parentsByChild: Map<string, string[]>,
  componentIds: string[],
): Map<number, string[]> {
  const rows = new Map([...input].map(([generation, ids]) => [generation, [...ids]]));
  const generations = [...rows.keys()].sort((a, b) => a - b);
  const generationByPerson = new Map<string, number>();
  for (const [generation, ids] of rows) for (const id of ids) generationByPerson.set(id, generation);
  const edges: LayoutEdge[] = [];
  for (const childId of componentIds) {
    for (const parentId of parentsByChild.get(childId) ?? []) edges.push({ parentId, childId });
  }

  // Exact parent sets are indivisible blocks. Empty parent sets stay singleton.
  const blocksByGeneration = new Map<number, string[][]>();
  for (const generation of generations) {
    const blocks = new Map<string, string[]>();
    for (const id of rows.get(generation) ?? []) {
      const key = JSON.stringify(parentsByChild.get(id) ?? []);
      blocks.set(key, [...(blocks.get(key) ?? []), id]);
    }
    const seen = new Set<string>();
    const ordered: string[][] = [];
    for (const id of rows.get(generation) ?? []) {
      const key = JSON.stringify(parentsByChild.get(id) ?? []);
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(blocks.get(key)!);
      }
    }
    blocksByGeneration.set(generation, ordered);
  }

  let best = layoutScore(rows, edges, generationByPerson);
  let evaluations = 0;
  for (let sweep = 0; sweep < MAX_LAYOUT_SWEEPS && evaluations < MAX_LAYOUT_EVALUATIONS; sweep += 1) {
    const direction = sweep % 2 === 0 ? generations : [...generations].reverse();
    let improved = false;
    for (const generation of direction) {
      if (evaluations >= MAX_LAYOUT_EVALUATIONS) break;
      const blocks = blocksByGeneration.get(generation) ?? [];
      if (blocks.length < 2) continue;
      const neighbours = [...(rows.get(generation - 1) ?? []), ...(rows.get(generation + 1) ?? [])];
      if (!neighbours.length) continue;
      const rank = new Map(neighbours.map((id, index) => [id, index]));
      const originalIndex = new Map(blocks.map((block, index) => [block[0], index]));
      const related = (block: string[]) => {
        const ids: string[] = [];
        for (const id of block) {
          for (const parentId of parentsByChild.get(id) ?? []) if (rank.has(parentId)) ids.push(parentId);
          for (const edge of edges) if (edge.parentId === id && rank.has(edge.childId)) ids.push(edge.childId);
        }
        return ids;
      };
      const candidateBlocks = [...blocks].sort((a, b) => {
        const average = (block: string[]) => {
          const values = related(block).map(id => rank.get(id)!);
          return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length
            : (originalIndex.get(block[0]) ?? 0) * (neighbours.length + 1);
        };
        return average(a) - average(b) || originalIndex.get(a[0])! - originalIndex.get(b[0])!;
      });
      if (candidateBlocks.every((block, index) => block === blocks[index])) continue;
      const candidate = new Map(rows);
      candidate.set(generation, candidateBlocks.flat());
      const score = layoutScore(candidate, edges, generationByPerson);
      evaluations += 1;
      if (score.crossings < best.crossings || (score.crossings === best.crossings && score.span < best.span)) {
        rows.set(generation, candidateBlocks.flat());
        blocksByGeneration.set(generation, candidateBlocks);
        best = score;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return rows;
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
      const siblingData = createSiblingClusters(rowIds, generation, generations, childrenByParent, parentsByChild);
      clustersByGeneration.set(generation, siblingData.clusters);
      for (const [personId, clusterId] of siblingData.clusterByPerson) clusterByPerson.set(personId, clusterId);
    }

    // Parents participating in several distinct exact-parent-set groups are
    // structural anchors for the branches below them. Put those shared parents
    // first, then preserve the encounter order of their partner branches.
    const parentFamilySetCount = new Map<string, number>();
    const countedParentSets = new Set<string>();
    for (const parentIds of parentsByChild.values()) {
      const parentSetKey = parentIds.join('|');
      for (const parentId of parentIds) {
        const seenSets = parentFamilySetCount.get(parentId) ?? 0;
        const key = parentId + '\\u0000' + parentSetKey;
        if (!countedParentSets.has(key)) {
          countedParentSets.add(key);
          parentFamilySetCount.set(parentId, seenSets + 1);
        }
      }
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
        const firstAnchor = Math.max(...(clusters.get(first) ?? []).map((id) => parentFamilySetCount.get(id) ?? 0));
        const secondAnchor = Math.max(...(clusters.get(second) ?? []).map((id) => parentFamilySetCount.get(id) ?? 0));
        if (firstAnchor !== secondAnchor) return secondAnchor - firstAnchor;
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

    const optimisedRows = optimiseRows(orderedRows, parentsByChild, componentIds);

    return {
      key: componentIds[0],
      personIdsByGeneration: optimisedRows,
    };
  }).sort((first, second) => compareIds(first.key, second.key));
}
