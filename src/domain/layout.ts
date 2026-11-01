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
  const byGeneration = new Map<number, typeof children>();
  for (const node of children) {
    const generation = generationResult.generations.get(node.id) ?? 0;
    byGeneration.set(generation, [...(byGeneration.get(generation) ?? []), node]);
  }

  const laidOut: Record<string, { x: number; y: number }> = { ...fallback };
  for (const [generation, nodes] of byGeneration) {
    const ordered = [...nodes].sort((first, second) =>
      ((first.x ?? fallback[first.id]?.x ?? 0) - (second.x ?? fallback[second.id]?.x ?? 0))
      || first.id.localeCompare(second.id));
    let nextAvailableX = 0;
    for (const node of ordered) {
      const elkX = Math.max(0, (node.x ?? fallback[node.id]?.x ?? 0) - minX);
      const x = Math.max(elkX, nextAvailableX);
      laidOut[node.id] = { x, y: generation * 190 };
      nextAvailableX = x + 224;
    }
  }
  return laidOut;
}
