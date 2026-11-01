import type { Project } from './schema';
import { calculateGenerations } from './relationships';
import { getFamilyGroups } from './familyGroups';
import { buildFamilyTraversal, type FamilyTraversalComponent } from './familyTraversal';

type Position = { x: number; y: number };
type LayoutProject = Pick<Project, 'people' | 'parentage'> & Partial<Pick<Project, 'partnerships'>>;

const CARD_WIDTH = 176;
const CARD_GAP = 48;
const CARD_PITCH = CARD_WIDTH + CARD_GAP;
const GENERATION_HEIGHT = 190;
const JUNCTION_SIZE = 18;
const JUNCTION_GAP = 26;

function compareIds(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function rowWidth(personCount: number): number {
  return personCount ? personCount * CARD_WIDTH + (personCount - 1) * CARD_GAP : 0;
}

/**
 * Partnerships can keep otherwise separate ancestry components near one
 * another, but they never merge those components or influence generations.
 */
function groupPartnerConnectedComponents(
  components: FamilyTraversalComponent[],
  project: LayoutProject,
): FamilyTraversalComponent[][] {
  const componentByPerson = new Map<string, string>();
  const componentByKey = new Map(components.map((component) => [component.key, component]));
  const neighbours = new Map(components.map((component) => [component.key, new Set<string>()]));

  for (const component of components) {
    for (const ids of component.personIdsByGeneration.values()) {
      for (const id of ids) componentByPerson.set(id, component.key);
    }
  }

  for (const partnership of project.partnerships ?? []) {
    const first = componentByPerson.get(partnership.person1Id);
    const second = componentByPerson.get(partnership.person2Id);
    if (!first || !second || first === second) continue;
    neighbours.get(first)?.add(second);
    neighbours.get(second)?.add(first);
  }

  const visited = new Set<string>();
  const groups: FamilyTraversalComponent[][] = [];
  for (const component of [...components].sort((a, b) => compareIds(a.key, b.key))) {
    if (visited.has(component.key)) continue;
    const keys: string[] = [];
    const pending = [component.key];
    visited.add(component.key);
    while (pending.length) {
      const current = pending.pop()!;
      keys.push(current);
      const next = [...(neighbours.get(current) ?? [])].sort(compareIds).reverse();
      for (const key of next) {
        if (visited.has(key)) continue;
        visited.add(key);
        pending.push(key);
      }
    }
    groups.push(keys.map((key) => componentByKey.get(key)!).sort((a, b) => compareIds(a.key, b.key)));
  }

  return groups.sort((first, second) => compareIds(first[0].key, second[0].key));
}

function calculateFamilyJunctionPositions(
  project: LayoutProject,
  positions: Record<string, Position>,
): void {
  const junctions = getFamilyGroups(project).flatMap((group) => {
    const parents = group.parentIds.map((id) => positions[id]).filter((position): position is Position => !!position);
    const children = group.childIds.map((id) => positions[id]).filter((position): position is Position => !!position);
    if (!parents.length || !children.length) return [];
    const parentCentre = parents.reduce((sum, position) => sum + position.x + CARD_WIDTH / 2, 0) / parents.length;
    const childCentre = children.reduce((sum, position) => sum + position.x + CARD_WIDTH / 2, 0) / children.length;
    return [{
      id: group.id,
      x: (parentCentre + childCentre) / 2 - JUNCTION_SIZE / 2,
      y: (Math.max(...parents.map((position) => position.y)) + Math.min(...children.map((position) => position.y))) / 2 + 35,
    }];
  }).sort((first, second) => first.y - second.y || first.x - second.x || compareIds(first.id, second.id));

  // Junctions are small, but distinct exact-parent-set groups must not sit on
  // top of one another when their parent and child centres happen to coincide.
  const lastXByRow = new Map<number, number>();
  for (const junction of junctions) {
    const rowKey = Math.round(junction.y);
    const previousX = lastXByRow.get(rowKey);
    if (previousX !== undefined && junction.x < previousX + JUNCTION_GAP) {
      junction.x = previousX + JUNCTION_GAP;
    }
    lastXByRow.set(rowKey, junction.x);
    positions[junction.id] = { x: junction.x, y: junction.y };
  }
}

function calculateRecursivePositions(
  project: LayoutProject,
  generations: Map<string, number>,
): Record<string, Position> {
  const components = buildFamilyTraversal(project, generations);
  const partnerGroups = groupPartnerConnectedComponents(components, project);
  const positions: Record<string, Position> = {};
  let nextBlockX = 0;

  for (const partnerGroup of partnerGroups) {
    for (const component of partnerGroup) {
      const rows = [...component.personIdsByGeneration.entries()].sort((a, b) => a[0] - b[0]);
      const blockWidth = Math.max(CARD_WIDTH, ...rows.map(([, ids]) => rowWidth(ids.length)));
      for (const [generation, ids] of rows) {
        const width = rowWidth(ids.length);
        const startX = nextBlockX + (blockWidth - width) / 2;
        ids.forEach((id, index) => {
          positions[id] = {
            x: startX + index * CARD_PITCH,
            y: generation * GENERATION_HEIGHT,
          };
        });
      }
      nextBlockX += blockWidth + CARD_GAP;
    }
    // Keep ancestry components connected by partnership records in the same
    // neighbourhood, without interleaving their internal family ordering.
    nextBlockX += CARD_GAP;
  }

  calculateFamilyJunctionPositions(project, positions);
  return positions;
}

function createFlatFallbackPositions(project: LayoutProject): Record<string, Position> {
  const positions: Record<string, Position> = {};
  [...project.people].sort((a, b) => compareIds(a.id, b.id)).forEach((person, index) => {
    positions[person.id] = { x: index * CARD_PITCH, y: 0 };
  });
  return positions;
}

export function createFallbackPositions(project: LayoutProject): Record<string, Position> {
  if (!project.people.length) return {};
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok) return createFlatFallbackPositions(project);
  return calculateRecursivePositions(project, generationResult.generations);
}

export async function calculateAutoPositions(
  project: LayoutProject,
): Promise<Record<string, Position>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};
  return calculateRecursivePositions(project, generationResult.generations);
}
