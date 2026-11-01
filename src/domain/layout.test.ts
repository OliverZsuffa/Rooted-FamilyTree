import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './schema';
import { calculateAutoPositions, createFallbackPositions } from './layout';

function makeProject(personIds: string[]) {
  const project = createEmptyProject();
  project.people = personIds.map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

function centre(position: { x: number }) {
  return position.x + 88;
}

describe('family-centred automatic layout', () => {
  it('centres a sibling group beneath the midpoint between two parents', () => {
    const project = makeProject(['parentA', 'parentB', 'childA', 'childB', 'childC']);
    project.parentage = project.people.slice(2).flatMap((child) => [
      { id: 'a-' + child.id, type: 'biological_parent' as const, parentId: 'parentA', childId: child.id },
      { id: 'b-' + child.id, type: 'biological_parent' as const, parentId: 'parentB', childId: child.id },
    ]);

    const positions = createFallbackPositions(project);
    const parentMidpoint = (centre(positions.parentA) + centre(positions.parentB)) / 2;
    const childrenMidpoint = (centre(positions.childA) + centre(positions.childB) + centre(positions.childC)) / 3;

    expect(childrenMidpoint).toBeCloseTo(parentMidpoint);
    expect(positions.childA.y).toBeGreaterThan(positions.parentA.y);
    expect(positions.childB.x - positions.childA.x).toBe(224);
    expect(positions.childC.x - positions.childB.x).toBe(224);
  });

  it('centres a single-parent sibling group beneath that parent', () => {
    const project = makeProject(['parent', 'childA', 'childB']);
    project.parentage = project.people.slice(1).map((child) => ({
      id: 'relation-' + child.id, type: 'adoptive_parent' as const, parentId: 'parent', childId: child.id,
    }));

    const positions = createFallbackPositions(project);
    expect((centre(positions.childA) + centre(positions.childB)) / 2).toBeCloseTo(centre(positions.parent));
  });

  it('keeps full and half siblings adjacent without separating a shared-parent cluster', async () => {
    const project = makeProject(['parentA', 'parentB', 'parentC', 'childA', 'childB', 'childC', 'unrelated']);
    project.parentage = [
      { id: 'a1', type: 'biological_parent' as const, parentId: 'parentA', childId: 'childA' },
      { id: 'a2', type: 'biological_parent' as const, parentId: 'parentA', childId: 'childB' },
      { id: 'b2', type: 'biological_parent' as const, parentId: 'parentB', childId: 'childB' },
      { id: 'b3', type: 'biological_parent' as const, parentId: 'parentB', childId: 'childC' },
      { id: 'c3', type: 'biological_parent' as const, parentId: 'parentC', childId: 'childC' },
    ];

    const positions = await calculateAutoPositions(project);
    const order = ['childA', 'childB', 'childC', 'unrelated'].sort((a, b) => positions[a].x - positions[b].x);
    const siblingIndexes = order.map((id, index) => ['childA', 'childB', 'childC'].includes(id) ? index : -1).filter((index) => index >= 0);

    expect(Math.max(...siblingIndexes) - Math.min(...siblingIndexes)).toBe(2);
    expect(project.people.every((person) => positions[person.id] !== undefined)).toBe(true);
    expect(new Set(project.people.map((person) => person.id)).size).toBe(project.people.length);
  });

  it('keeps distinct recorded parent sets as separate junctions without duplicating shared children', () => {
    const project = makeProject(['parentA', 'parentB', 'parentC', 'childAB', 'childAC']);
    project.parentage = [
      { id: 'ab-a', type: 'biological_parent' as const, parentId: 'parentA', childId: 'childAB' },
      { id: 'ab-b', type: 'biological_parent' as const, parentId: 'parentB', childId: 'childAB' },
      { id: 'ac-a', type: 'biological_parent' as const, parentId: 'parentA', childId: 'childAC' },
      { id: 'ac-c', type: 'biological_parent' as const, parentId: 'parentC', childId: 'childAC' },
    ];

    const positions = createFallbackPositions(project);
    expect(positions['family:parentA|parentB']).toBeDefined();
    expect(positions['family:parentA|parentC']).toBeDefined();
    expect(positions.childAB).toBeDefined();
    expect(positions.childAC).toBeDefined();
    expect(Object.keys(positions).filter((id) => id === 'childAB')).toHaveLength(1);
    expect(positions['family:parentA|parentB'].x).not.toBe(positions['family:parentA|parentC'].x);
  });

  it('does not infer parentage from unrelated people or partnership records', () => {
    const project = makeProject(['a', 'b', 'c', 'd']);
    const positions = createFallbackPositions(project);
    expect(positions.a.x).toBe(0);
    expect(positions.b.x).toBe(224);
    expect(positions.c.x).toBe(448);
    expect(positions.d.x).toBe(672);
    expect(Object.keys(positions)).toHaveLength(4);
  });

  it('keeps cards in each generation from overlapping', async () => {
    const project = makeProject(['p1', 'p2', 'p3', 'c1', 'c2', 'c3', 'c4']);
    project.parentage = [
      { id: 'r1', type: 'biological_parent' as const, parentId: 'p1', childId: 'c1' },
      { id: 'r2', type: 'biological_parent' as const, parentId: 'p1', childId: 'c2' },
      { id: 'r3', type: 'biological_parent' as const, parentId: 'p2', childId: 'c3' },
      { id: 'r4', type: 'biological_parent' as const, parentId: 'p3', childId: 'c4' },
    ];

    const positions = await calculateAutoPositions(project);
    for (const generation of [0, 1]) {
      const row = project.people
        .filter((person) => positions[person.id].y === generation * 190)
        .map((person) => positions[person.id].x)
        .sort((a, b) => a - b);
      for (let index = 1; index < row.length; index += 1) {
        expect(row[index] - row[index - 1]).toBeGreaterThanOrEqual(176);
      }
    }
  });

  it('returns no positions for an empty project or invalid ancestry', async () => {
    const empty = createEmptyProject();
    expect(createFallbackPositions(empty)).toEqual({});
    expect(await calculateAutoPositions(empty)).toEqual({});

    const invalid = makeProject(['a', 'b']);
    invalid.parentage = [
      { id: 'ab', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: 'ba', type: 'biological_parent', parentId: 'b', childId: 'a' },
    ];
    expect(await calculateAutoPositions(invalid)).toEqual({});
  });
});
