import type { Project } from './schema';
import { calculateGenerations } from './relationships';

export function createFallbackPositions(project: Pick<Project, 'people' | 'parentage'>): Record<string, { x: number; y: number }> {
  const generationResult = calculateGenerations(project);
  const bands = new Map<number, string[]>();
  for (const person of project.people) {
    const generation = generationResult.ok ? generationResult.generations.get(person.id) ?? 0 : 0;
    bands.set(generation, [...(bands.get(generation) ?? []), person.id]);
  }
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [generation, ids] of bands) {
    ids.forEach((id, index) => {
      positions[id] = { x: index * 240, y: generation * 190 };
    });
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
): Promise<Record<string, { x: number; y: number }>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};

  const fallback = createFallbackPositions(project);
  const elk = await getElk();
  const graph = await elk.layout({
    id: 'rooted-tree',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers': '105',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: project.people.map((person) => ({ id: person.id, width: 176, height: 70 })),
    edges: project.parentage
      .filter((relation) => relation.type === 'biological_parent' || relation.type === 'adoptive_parent')
      .map((relation) => ({ id: relation.id, sources: [relation.parentId], targets: [relation.childId] })),
  });

  const children = graph.children ?? [];
  const minX = children.length ? Math.min(...children.map((node) => node.x ?? 0)) : 0;
  const laidOut = Object.fromEntries(children.map((node) => [
    node.id,
    {
      x: (node.x ?? 0) - minX,
      y: (generationResult.generations.get(node.id) ?? 0) * 190,
    },
  ]));
  return { ...fallback, ...laidOut };
}
