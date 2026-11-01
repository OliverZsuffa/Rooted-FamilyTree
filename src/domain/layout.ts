import type { Project } from './schema';
import { calculateGenerations } from './relationships';
import { getFamilyGroups } from './familyGroups';

type Position = { x: number; y: number };

const CARD_WIDTH = 176;
const CARD_GAP = 48;
const CARD_PITCH = CARD_WIDTH + CARD_GAP;
const GENERATION_HEIGHT = 190;
const JUNCTION_SIZE = 18;

function calculateFamilyCentredPositions(
  project: Pick<Project, 'people' | 'parentage'>,
  generations: Map<string, number>,
): Record<string, Position> {
  const byGeneration = new Map<number, typeof project.people>();
  for (const person of project.people) {
    const generation = generations.get(person.id) ?? 0;
    byGeneration.set(generation, [...(byGeneration.get(generation) ?? []), person]);
  }

  const positions: Record<string, Position> = {};

  // Parent generations are placed first, allowing each child cluster to use the
  // actual horizontal centre of its recorded parents as its target.
  for (const [generation, people] of [...byGeneration.entries()].sort((a, b) => a[0] - b[0])) {
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

    const childrenByParent = new Map<string, string[]>();
    for (const relation of project.parentage) {
      if (relation.type !== 'biological_parent' && relation.type !== 'adoptive_parent') continue;
      if (!generationIds.has(relation.childId)) continue;
      childrenByParent.set(relation.parentId, [...(childrenByParent.get(relation.parentId) ?? []), relation.childId]);
    }
    for (const siblingIds of childrenByParent.values()) {
      const uniqueIds = [...new Set(siblingIds)];
      for (let index = 1; index < uniqueIds.length; index += 1) {
        unionCluster(uniqueIds[0], uniqueIds[index]);
      }
    }

    const originalOrder = new Map(people.map((person, index) => [person.id, index]));
    const clusters = new Map<string, typeof people>();
    for (const person of people) {
      const root = findCluster(person.id);
      clusters.set(root, [...(clusters.get(root) ?? []), person]);
    }

    const positionedClusters = [...clusters.values()].map((members) => {
      const parentIds = new Set<string>();
      for (const child of members) {
        for (const relation of project.parentage) {
          if (relation.childId === child.id
            && (relation.type === 'biological_parent' || relation.type === 'adoptive_parent')) {
            parentIds.add(relation.parentId);
          }
        }
      }
      const parentCentres = [...parentIds]
        .map((id) => positions[id])
        .filter((position): position is Position => !!position)
        .map((position) => position.x + CARD_WIDTH / 2);
      const targetCentre = parentCentres.length
        ? parentCentres.reduce((sum, value) => sum + value, 0) / parentCentres.length
        : null;
      return {
        members,
        targetCentre,
        firstIndex: Math.min(...members.map((person) => originalOrder.get(person.id) ?? 0)),
        width: members.length * CARD_WIDTH + (members.length - 1) * CARD_GAP,
      };
    }).sort((a, b) => {
      if (a.targetCentre !== null && b.targetCentre !== null) {
        return a.targetCentre - b.targetCentre || a.firstIndex - b.firstIndex;
      }
      if (a.targetCentre !== null) return -1;
      if (b.targetCentre !== null) return 1;
      return a.firstIndex - b.firstIndex;
    });

    let nextAvailableX: number | null = null;
    for (const cluster of positionedClusters) {
      const desiredLeft = cluster.targetCentre === null
        ? nextAvailableX === null ? 0 : nextAvailableX + CARD_GAP
        : cluster.targetCentre - cluster.width / 2;
      const left: number = nextAvailableX === null ? desiredLeft : Math.max(desiredLeft, nextAvailableX + CARD_GAP);
      cluster.members.forEach((person, index) => {
        positions[person.id] = {
          x: left + index * CARD_PITCH,
          y: generation * GENERATION_HEIGHT,
        };
      });
      nextAvailableX = left + cluster.width;
    }
  }

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

export function createFallbackPositions(project: Pick<Project, 'people' | 'parentage'>): Record<string, Position> {
  const generationResult = calculateGenerations(project);
  const generations = generationResult.ok
    ? generationResult.generations
    : new Map(project.people.map((person) => [person.id, 0]));
  return calculateFamilyCentredPositions(project, generations);
}

export async function calculateAutoPositions(
  project: Pick<Project, 'people' | 'parentage'>,
): Promise<Record<string, Position>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};
  return calculateFamilyCentredPositions(project, generationResult.generations);
}
