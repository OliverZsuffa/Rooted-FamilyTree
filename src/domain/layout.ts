import type { Project } from './schema';
import { calculateGenerations } from './relationships';
import { getFamilyGroups } from './familyGroups';

type Position = { x: number; y: number };
type LayoutProject = Pick<Project, 'people' | 'parentage'> & Partial<Pick<Project, 'partnerships'>>;
type LayoutPerson = Project['people'][number];
type LayoutCluster = {
  members: LayoutPerson[];
  parentIds: Set<string>;
  childIds: Set<string>;
  partnerIds: Set<string>;
  firstIndex: number;
  width: number;
};
type LayoutScore = { crossings: number; span: number };

const CARD_WIDTH = 176;
const CARD_GAP = 48;
const CARD_PITCH = CARD_WIDTH + CARD_GAP;
const GENERATION_HEIGHT = 190;
const JUNCTION_SIZE = 18;
const FAMILY_TYPES = new Set(['biological_parent', 'adoptive_parent']);

function averageCentre(ids: Iterable<string>, positions: Record<string, Position>): number | null {
  const centres = [...new Set(ids)]
    .map((id) => positions[id])
    .filter((position): position is Position => !!position)
    .map((position) => position.x + CARD_WIDTH / 2);
  return centres.length ? centres.reduce((sum, value) => sum + value, 0) / centres.length : null;
}

function buildGenerationClusters(
  project: LayoutProject,
  generations: Map<string, number>,
): Map<number, LayoutCluster[]> {
  const byGeneration = new Map<number, LayoutPerson[]>();
  const parentsByChild = new Map<string, Set<string>>();
  const childrenByParent = new Map<string, Set<string>>();
  const partnersByPerson = new Map<string, Set<string>>();

  for (const person of project.people) {
    const generation = generations.get(person.id) ?? 0;
    byGeneration.set(generation, [...(byGeneration.get(generation) ?? []), person]);
  }

  for (const relation of project.parentage) {
    if (!FAMILY_TYPES.has(relation.type)) continue;
    const parents = parentsByChild.get(relation.childId) ?? new Set<string>();
    parents.add(relation.parentId);
    parentsByChild.set(relation.childId, parents);
    const children = childrenByParent.get(relation.parentId) ?? new Set<string>();
    children.add(relation.childId);
    childrenByParent.set(relation.parentId, children);
  }

  for (const partnership of project.partnerships ?? []) {
    const first = partnersByPerson.get(partnership.person1Id) ?? new Set<string>();
    first.add(partnership.person2Id);
    partnersByPerson.set(partnership.person1Id, first);
    const second = partnersByPerson.get(partnership.person2Id) ?? new Set<string>();
    second.add(partnership.person1Id);
    partnersByPerson.set(partnership.person2Id, second);
  }

  const rows = new Map<number, LayoutCluster[]>();
  for (const [generation, people] of byGeneration) {
    const generationIds = new Set(people.map((person) => person.id));
    const clusterParent = new Map(people.map((person) => [person.id, person.id]));

    const findCluster = (id: string): string => {
      const parent = clusterParent.get(id) ?? id;
      if (parent === id) return id;
      const root = findCluster(parent);
      clusterParent.set(id, root);
      return root;
    };

    const unionCluster = (first: string, second: string) => {
      const firstRoot = findCluster(first);
      const secondRoot = findCluster(second);
      if (firstRoot !== secondRoot) clusterParent.set(secondRoot, firstRoot);
    };

    for (const childIds of childrenByParent.values()) {
      const siblings = [...childIds].filter((id) => generationIds.has(id));
      for (let index = 1; index < siblings.length; index += 1) {
        unionCluster(siblings[0], siblings[index]);
      }
    }

    const originalOrder = new Map(people.map((person, index) => [person.id, index]));
    const grouped = new Map<string, LayoutPerson[]>();
    for (const person of people) {
      const root = findCluster(person.id);
      grouped.set(root, [...(grouped.get(root) ?? []), person]);
    }

    const clusters = [...grouped.values()].map((members) => {
      const parentIds = new Set<string>();
      const childIds = new Set<string>();
      const partnerIds = new Set<string>();
      for (const member of members) {
        for (const id of parentsByChild.get(member.id) ?? []) parentIds.add(id);
        for (const id of childrenByParent.get(member.id) ?? []) childIds.add(id);
        for (const id of partnersByPerson.get(member.id) ?? []) {
          if (id !== member.id) partnerIds.add(id);
        }
      }
      return {
        members,
        parentIds,
        childIds,
        partnerIds,
        firstIndex: Math.min(...members.map((person) => originalOrder.get(person.id) ?? 0)),
        width: members.length * CARD_WIDTH + (members.length - 1) * CARD_GAP,
      };
    }).sort((a, b) => a.firstIndex - b.firstIndex);

    rows.set(generation, clusters);
  }

  return rows;
}

function assignPositions(
  rows: Map<number, LayoutCluster[]>,
  project: LayoutProject,
  generations: Map<string, number>,
): Record<string, Position> {
  const positions: Record<string, Position> = {};
  const orderedGenerations = [...rows.keys()].sort((a, b) => a - b);

  for (const generation of orderedGenerations) {
    let nextX = 0;
    for (const cluster of rows.get(generation) ?? []) {
      cluster.members.forEach((person, index) => {
        positions[person.id] = {
          x: nextX + index * CARD_PITCH,
          y: generation * GENERATION_HEIGHT,
        };
      });
      nextX += cluster.width + CARD_GAP;
    }
  }

  // Shift each generation as a whole to retain average parent to child
  // centring while the cluster order is optimised globally.
  const generationOffsets = new Map<number, number>();
  for (const generation of orderedGenerations) {
    const connectedOffsets = project.parentage
      .filter((relation) => FAMILY_TYPES.has(relation.type)
        && generations.get(relation.childId) === generation
        && generations.get(relation.parentId) === generation - 1
        && positions[relation.parentId] && positions[relation.childId])
      .map((relation) => {
        const parentCentre = positions[relation.parentId].x + CARD_WIDTH / 2
          + (generationOffsets.get(generation - 1) ?? 0);
        const childCentre = positions[relation.childId].x + CARD_WIDTH / 2;
        return parentCentre - childCentre;
      });
    const offset = connectedOffsets.length
      ? connectedOffsets.reduce((sum, value) => sum + value, 0) / connectedOffsets.length
      : 0;
    generationOffsets.set(generation, offset);
    for (const cluster of rows.get(generation) ?? []) {
      for (const person of cluster.members) positions[person.id].x += offset;
    }
  }

  return positions;
}

function clusterBarycentre(cluster: LayoutCluster, positions: Record<string, Position>): number | null {
  const anchors = [
    { value: averageCentre(cluster.parentIds, positions), weight: 1 },
    { value: averageCentre(cluster.childIds, positions), weight: 1 },
    { value: averageCentre(cluster.partnerIds, positions), weight: 0.65 },
  ].filter((anchor): anchor is { value: number; weight: number } => anchor.value !== null);

  if (!anchors.length) return null;
  const totalWeight = anchors.reduce((sum, anchor) => sum + anchor.weight, 0);
  return anchors.reduce((sum, anchor) => sum + anchor.value * anchor.weight, 0) / totalWeight;
}

function calculateLayoutScore(
  project: LayoutProject,
  generations: Map<string, number>,
  positions: Record<string, Position>,
): LayoutScore {
  const edges = [...new Map(project.parentage
    .filter((relation) => FAMILY_TYPES.has(relation.type)
      && positions[relation.parentId] && positions[relation.childId])
    .map((relation) => [relation.parentId + '|' + relation.childId, relation])).values()];

  const layers = new Map<number, typeof edges>();
  for (const edge of edges) {
    const parentGeneration = generations.get(edge.parentId);
    if (parentGeneration === undefined || generations.get(edge.childId) !== parentGeneration + 1) continue;
    layers.set(parentGeneration, [...(layers.get(parentGeneration) ?? []), edge]);
  }

  let crossings = 0;
  for (const layerEdges of layers.values()) {
    const childCentres = [...new Set(layerEdges.map((edge) => positions[edge.childId].x + CARD_WIDTH / 2))]
      .sort((a, b) => a - b);
    const childRanks = new Map(childCentres.map((centre, index) => [centre, index + 1]));
    const tree = new Array(childCentres.length + 1).fill(0);
    const prefixCount = (index: number) => {
      let total = 0;
      for (let cursor = index; cursor > 0; cursor -= cursor & -cursor) total += tree[cursor];
      return total;
    };
    const addCount = (index: number) => {
      for (let cursor = index; cursor < tree.length; cursor += cursor & -cursor) tree[cursor] += 1;
    };

    const ordered = [...layerEdges].sort((first, second) =>
      positions[first.parentId].x - positions[second.parentId].x);
    let processed = 0;
    for (let index = 0; index < ordered.length;) {
      const parentId = ordered[index].parentId;
      let end = index + 1;
      while (end < ordered.length && ordered[end].parentId === parentId) end += 1;

      for (let edgeIndex = index; edgeIndex < end; edgeIndex += 1) {
        const rank = childRanks.get(positions[ordered[edgeIndex].childId].x + CARD_WIDTH / 2)!;
        crossings += processed - prefixCount(rank);
      }
      for (let edgeIndex = index; edgeIndex < end; edgeIndex += 1) {
        const rank = childRanks.get(positions[ordered[edgeIndex].childId].x + CARD_WIDTH / 2)!;
        addCount(rank);
        processed += 1;
      }
      index = end;
    }
  }

  const parentageSpan = edges.reduce((sum, relation) => {
    const parent = positions[relation.parentId];
    const child = positions[relation.childId];
    return sum + Math.abs(parent.x - child.x);
  }, 0);
  const partnershipSpan = (project.partnerships ?? []).reduce((sum, partnership) => {
    if (generations.get(partnership.person1Id) !== generations.get(partnership.person2Id)) return sum;
    const first = positions[partnership.person1Id];
    const second = positions[partnership.person2Id];
    return first && second ? sum + Math.abs(first.x - second.x) : sum;
  }, 0);

  return { crossings, span: parentageSpan + partnershipSpan * 0.65 };
}

function isBetterScore(candidate: LayoutScore, current: LayoutScore): boolean {
  return candidate.crossings < current.crossings
    || (candidate.crossings === current.crossings && candidate.span < current.span - 0.001);
}

function optimiseGenerationOrder(
  generation: number,
  rows: Map<number, LayoutCluster[]>,
  positions: Record<string, Position>,
  project: LayoutProject,
  generations: Map<string, number>,
): Record<string, Position> {
  const clusters = rows.get(generation);
  if (!clusters || clusters.length < 2) return positions;

  const previousOrder = new Map(clusters.map((cluster, index) => [cluster, index]));
  const candidate = [...clusters].sort((first, second) => {
    const firstTarget = clusterBarycentre(first, positions);
    const secondTarget = clusterBarycentre(second, positions);
    if (firstTarget === null && secondTarget === null) return previousOrder.get(first)! - previousOrder.get(second)!;
    if (firstTarget === null) return 1;
    if (secondTarget === null) return -1;
    return firstTarget - secondTarget || previousOrder.get(first)! - previousOrder.get(second)!;
  });

  if (candidate.every((cluster, index) => cluster === clusters[index])) return positions;

  const currentScore = calculateLayoutScore(project, generations, positions);
  rows.set(generation, candidate);
  const candidatePositions = assignPositions(rows, project, generations);
  const candidateScore = calculateLayoutScore(project, generations, candidatePositions);
  if (isBetterScore(candidateScore, currentScore)) return candidatePositions;

  rows.set(generation, clusters);
  return positions;
}

function calculateFamilyCentredPositions(
  project: LayoutProject,
  generations: Map<string, number>,
): Record<string, Position> {
  const rows = buildGenerationClusters(project, generations);
  let positions = assignPositions(rows, project, generations);
  const generationOrder = [...rows.keys()].sort((a, b) => a - b);

  // Alternate downward and upward sweeps. Every move is evaluated against the
  // complete tree, so a local improvement cannot add crossings or longer links.
  for (let pass = 0; pass < 12; pass += 1) {
    for (const generation of generationOrder) {
      positions = optimiseGenerationOrder(generation, rows, positions, project, generations);
    }
    for (const generation of [...generationOrder].reverse()) {
      positions = optimiseGenerationOrder(generation, rows, positions, project, generations);
    }
  }

  // Repack all generations using the final global order.
  positions = assignPositions(rows, project, generations);

  // Shift the whole tree together. This preserves every parent/child alignment.
  const personPositions = project.people.map((person) => positions[person.id]).filter((position): position is Position => !!position);
  const minX = personPositions.length ? Math.min(...personPositions.map((position) => position.x)) : 0;
  if (minX !== 0) {
    for (const person of project.people) {
      if (positions[person.id]) positions[person.id].x -= minX;
    }
  }

  // Each exact parent set has its own junction, even when children also share
  // one parent with children from another partnership.
  for (const group of getFamilyGroups(project)) {
    const parents = group.parentIds.map((id) => positions[id]).filter((position): position is Position => !!position);
    const children = group.childIds.map((id) => positions[id]).filter((position): position is Position => !!position);
    if (!parents.length || !children.length) continue;

    const parentCentre = parents.reduce((sum, position) => sum + position.x + CARD_WIDTH / 2, 0) / parents.length;
    const childCentre = children.reduce((sum, position) => sum + position.x + CARD_WIDTH / 2, 0) / children.length;
    positions[group.id] = {
      x: (parentCentre + childCentre) / 2 - JUNCTION_SIZE / 2,
      y: (Math.max(...parents.map((position) => position.y)) + Math.min(...children.map((position) => position.y))) / 2 + 35,
    };
  }

  return positions;
}

export function createFallbackPositions(project: LayoutProject): Record<string, Position> {
  const generationResult = calculateGenerations(project);
  const generations = generationResult.ok
    ? generationResult.generations
    : new Map(project.people.map((person) => [person.id, 0]));
  return calculateFamilyCentredPositions(project, generations);
}

export async function calculateAutoPositions(
  project: LayoutProject,
): Promise<Record<string, Position>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};
  return calculateFamilyCentredPositions(project, generationResult.generations);
}
