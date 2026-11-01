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
      positions[id] = { x: index * 240, y: generation * 190 };
    });
  }
  for (const group of getFamilyGroups(project)) {
    const parents = group.parentIds.map((id) => positions[id]).filter((value): value is Position => !!value);
    const children = group.childIds.map((id) => positions[id]).filter((value): value is Position => !!value);
    const points = [...parents, ...children];
    const parentCenter = parents.length ? parents.reduce((sum, point) => sum + point.x + 88, 0) / parents.length : null;
    const childCenter = children.length ? children.reduce((sum, point) => sum + point.x + 88, 0) / children.length : null;
    const x = parentCenter !== null && childCenter !== null ? (parentCenter + childCenter) / 2 - 9 : points.length ? points.reduce((sum, point) => sum + point.x + 88, 0) / points.length - 9 : 0;
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
  const elkX = new Map(nodes.map((node) => [node.id, Math.max(0, (node.x ?? fallback[node.id]?.x ?? 0) - minX)]));
  const byGeneration = new Map<number, typeof project.people>();
  for (const person of project.people) {
    const generation = generationResult.generations.get(person.id) ?? 0;
    byGeneration.set(generation, [...(byGeneration.get(generation) ?? []), person]);
  }
  // ELK supplies family-aware ordering. A final collision pass guarantees readable card spacing.
  for (const [generation, people] of byGeneration) {
    // Cluster people who share a recorded parent so full and half siblings stay adjacent.
    // Overlapping family groups naturally merge into one soft ordering cluster.
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
      const firstRoot = findCluster(first), secondRoot = findCluster(second);
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
      for (let index = 1; index < uniqueIds.length; index += 1) unionCluster(uniqueIds[0], uniqueIds[index]);
    }
    const clusters = new Map<string, typeof people>();
    for (const person of people) {
      const root = findCluster(person.id);
      clusters.set(root, [...(clusters.get(root) ?? []), person]);
    }
    const ordered = [...clusters.values()]
      .map((cluster) => cluster.sort((a, b) => (elkX.get(a.id) ?? 0) - (elkX.get(b.id) ?? 0) || a.id.localeCompare(b.id)))
      .sort((a, b) => Math.min(...a.map((person) => elkX.get(person.id) ?? 0)) - Math.min(...b.map((person) => elkX.get(person.id) ?? 0)) || a[0].id.localeCompare(b[0].id))
      .flat();
    let nextAvailableX = 0;
    for (const person of ordered) {
      const x = Math.max(elkX.get(person.id) ?? fallback[person.id]?.x ?? 0, nextAvailableX);
      laidOut[person.id] = { x, y: generation * 190 };
      nextAvailableX = x + 224;
    }
  }
  for (const node of nodes) {
    if (node.id.startsWith('family:')) laidOut[node.id] = { x: elkX.get(node.id) ?? fallback[node.id]?.x ?? 0, y: node.y ?? fallback[node.id]?.y ?? 0 };
  }
  for (const group of groups) {
    const parents = group.parentIds.map((id) => laidOut[id]).filter((value): value is Position => !!value);
    const children = group.childIds.map((id) => laidOut[id]).filter((value): value is Position => !!value);
    if (parents.length && children.length) {
      laidOut[group.id] = {
        x: ((parents.reduce((sum, point) => sum + point.x + 88, 0) / parents.length) + (children.reduce((sum, point) => sum + point.x + 88, 0) / children.length)) / 2 - 9,
        y: (Math.max(...parents.map((point) => point.y)) + Math.min(...children.map((point) => point.y))) / 2 + 35,
      };
    }
  }
  return laidOut;
}
