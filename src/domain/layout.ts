import type { Project } from './schema';
import { calculateGenerations } from './relationships';
import { getFamilyGroups } from './familyGroups';

type Position = { x: number; y: number };

export function createFallbackPositions(project: Pick<Project, 'people' | 'parentage'>): Record<string, Position> {
  const generationResult = calculateGenerations(project);
  const bands = new Map<number, string[]>();
  for (const person of project.people) {
    const generation = generationResult.ok ? generationResult.generations.get(person.id) ?? 0 : 0;
    bands.set(generation, [...(bands.get(generation) ?? []), person.id]);
  }
  const positions: Record<string, Position> = {};
  for (const [generation, ids] of bands) {
    ids.forEach((id, index) => {
      positions[id] = { x: index * 240, y: generation * 220 };
    });
  }
  for (const group of getFamilyGroups(project)) {
    const parents = group.parentIds.map((id) => positions[id]).filter((value): value is Position => !!value);
    const children = group.childIds.map((id) => positions[id]).filter((value): value is Position => !!value);
    const points = parents.length ? parents : children;
    const x = points.length ? points.reduce((sum, point) => sum + point.x, 0) / points.length + 80 : 0;
    const y = parents.length && children.length
      ? (Math.max(...parents.map((point) => point.y)) + Math.min(...children.map((point) => point.y))) / 2 + 35
      : 0;
    positions[group.id] = { x, y };
  }
  return positions;
}

function createElk() {
  return import('elkjs/lib/elk.bundled.js').then(({ default: ELK }) => new ELK());
}

let elkPromise: ReturnType<typeof createElk> | null = null;

async function getElk() {
  elkPromise ??= createElk();
  return elkPromise;
}

export async function calculateAutoPositions(
  project: Pick<Project, 'people' | 'parentage'>,
): Promise<Record<string, Position>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};

  const fallback = createFallbackPositions(project);
  const groups = getFamilyGroups(project);
  const elk = await getElk();
  const graph = await elk.layout({
    id: 'rooted-tree',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '52',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
    },
    children: [
      ...project.people.map((person) => ({ id: person.id, width: 176, height: 70 })),
      ...groups.map((group) => ({ id: group.id, width: 18, height: 18 })),
    ],
    edges: groups.flatMap((group) => [
      ...group.parentIds.map((parentId) => ({ id: group.id + ':parent:' + parentId, sources: [parentId], targets: [group.id] })),
      ...group.childIds.map((childId) => ({ id: group.id + ':child:' + childId, sources: [group.id], targets: [childId] })),
    ]),
  });

  const nodes = graph.children ?? [];
  const minX = nodes.length ? Math.min(...nodes.map((node) => node.x ?? 0)) : 0;
  const laidOut: Record<string, Position> = { ...fallback };
  for (const node of nodes) {
    laidOut[node.id] = {
      x: Math.max(0, (node.x ?? fallback[node.id]?.x ?? 0) - minX),
      y: node.y ?? fallback[node.id]?.y ?? 0,
    };
  }

  // Keep every person in its calculated generation row, even when ELK adds junction layers.
  for (const person of project.people) {
    const generation = generationResult.generations.get(person.id) ?? 0;
    laidOut[person.id] = { ...laidOut[person.id], y: generation * 220 };
  }
  for (const group of groups) {
    const parents = group.parentIds.map((id) => laidOut[id]).filter((value): value is Position => !!value);
    const children = group.childIds.map((id) => laidOut[id]).filter((value): value is Position => !!value);
    if (parents.length && children.length) {
      laidOut[group.id] = {
        x: (Math.min(...children.map((point) => point.x)) + Math.max(...parents.map((point) => point.x))) / 2,
        y: (Math.max(...parents.map((point) => point.y)) + Math.min(...children.map((point) => point.y))) / 2 + 35,
      };
    }
  }
  return laidOut;
}
