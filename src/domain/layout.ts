import type { Project } from './schema';
import { calculateGenerations } from './relationships';


let elkPromise: Promise<InstanceType<(typeof import('elkjs/lib/elk.bundled.js'))['default']>> | null = null;

async function getElk() {
  if (!elkPromise) {
    elkPromise = import('elkjs/lib/elk.bundled.js').then(({ default: ELK }) => new ELK());
  }
  return elkPromise;
}

export async function calculateAutoPositions(
  project: Pick<Project, 'people' | 'parentage'>,
): Promise<Record<string, { x: number; y: number }>> {
  const generationResult = calculateGenerations(project);
  if (!generationResult.ok || project.people.length === 0) return {};

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
  const minX = Math.min(...children.map((node) => node.x ?? 0));
  return Object.fromEntries(children.map((node) => [
    node.id,
    {
      x: (node.x ?? 0) - minX,
      y: (generationResult.generations.get(node.id) ?? 0) * 190,
    },
  ]));
}
