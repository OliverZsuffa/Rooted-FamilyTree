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

describe('recursive family layout', () => {
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

  it('keeps multigenerational ancestry branches on consistent sides when input order is interleaved', () => {
    const project = makeProject(['grandparentA1', 'grandparentB1', 'grandparentA2', 'grandparentB2', 'father', 'mother', 'child']);
    project.parentage = [
      { id: 'a1-mother', type: 'biological_parent', parentId: 'grandparentA1', childId: 'mother' },
      { id: 'a2-mother', type: 'biological_parent', parentId: 'grandparentA2', childId: 'mother' },
      { id: 'b1-father', type: 'biological_parent', parentId: 'grandparentB1', childId: 'father' },
      { id: 'b2-father', type: 'biological_parent', parentId: 'grandparentB2', childId: 'father' },
      { id: 'mother-child', type: 'biological_parent', parentId: 'mother', childId: 'child' },
      { id: 'father-child', type: 'biological_parent', parentId: 'father', childId: 'child' },
    ];
    project.partnerships = [{
      id: 'parents-partnership',
      type: 'marriage',
      person1Id: 'mother',
      person2Id: 'father',
      startDate: null,
      endDate: null,
      nameChanges: [],
    }];

    const positions = createFallbackPositions(project);
    const branchACentre = (centre(positions.grandparentA1) + centre(positions.grandparentA2)) / 2;
    const branchBCentre = (centre(positions.grandparentB1) + centre(positions.grandparentB2)) / 2;
    const motherCentre = centre(positions.mother);
    const fatherCentre = centre(positions.father);

    expect(Math.abs(positions.grandparentA1.x - positions.grandparentA2.x)).toBe(224);
    expect(Math.abs(positions.grandparentB1.x - positions.grandparentB2.x)).toBe(224);
    expect(Math.sign(branchACentre - branchBCentre)).toBe(Math.sign(motherCentre - fatherCentre));
  });

  it('places a shared parent before partner branches and keeps each child branch together', () => {
    const project = makeProject(['shared', 'partnerA', 'partnerB', 'childA', 'childB1', 'childB2']);
    project.parentage = [
      { id: 'shared-a', type: 'biological_parent', parentId: 'shared', childId: 'childA' },
      { id: 'partner-a', type: 'biological_parent', parentId: 'partnerA', childId: 'childA' },
      { id: 'shared-b1', type: 'biological_parent', parentId: 'shared', childId: 'childB1' },
      { id: 'partner-b1', type: 'biological_parent', parentId: 'partnerB', childId: 'childB1' },
      { id: 'shared-b2', type: 'biological_parent', parentId: 'shared', childId: 'childB2' },
      { id: 'partner-b2', type: 'biological_parent', parentId: 'partnerB', childId: 'childB2' },
    ];

    const positions = createFallbackPositions(project);
    const topOrder = ['shared', 'partnerA', 'partnerB'].sort((a, b) => positions[a].x - positions[b].x);
    const childOrder = ['childA', 'childB1', 'childB2'].sort((a, b) => positions[a].x - positions[b].x);

    expect(topOrder).toEqual(['shared', 'partnerA', 'partnerB']);
    expect(childOrder).toEqual(['childA', 'childB1', 'childB2']);
  });

  it('does not use gender to determine branch placement', () => {
    const project = makeProject(['grandparentA1', 'grandparentB1', 'grandparentA2', 'grandparentB2', 'father', 'mother', 'child']);
    project.parentage = [
      { id: 'a1-mother', type: 'biological_parent', parentId: 'grandparentA1', childId: 'mother' },
      { id: 'a2-mother', type: 'biological_parent', parentId: 'grandparentA2', childId: 'mother' },
      { id: 'b1-father', type: 'biological_parent', parentId: 'grandparentB1', childId: 'father' },
      { id: 'b2-father', type: 'biological_parent', parentId: 'grandparentB2', childId: 'father' },
      { id: 'mother-child', type: 'biological_parent', parentId: 'mother', childId: 'child' },
      { id: 'father-child', type: 'biological_parent', parentId: 'father', childId: 'child' },
    ];

    const original = createFallbackPositions(project);
    project.people.find((person) => person.id === 'mother')!.gender = 'male';
    project.people.find((person) => person.id === 'father')!.gender = 'female';
    const changedGender = createFallbackPositions(project);

    expect(changedGender).toEqual(original);
  });

  it('keeps the same global ordering for repeated calculations', () => {
    const project = makeProject(['g1', 'g2', 'g3', 'g4', 'p1', 'p2', 'c1', 'c2']);
    project.parentage = [
      { id: 'r1', type: 'biological_parent', parentId: 'g1', childId: 'p1' },
      { id: 'r2', type: 'biological_parent', parentId: 'g2', childId: 'p1' },
      { id: 'r3', type: 'biological_parent', parentId: 'g3', childId: 'p2' },
      { id: 'r4', type: 'biological_parent', parentId: 'g4', childId: 'p2' },
      { id: 'r5', type: 'biological_parent', parentId: 'p1', childId: 'c1' },
      { id: 'r6', type: 'biological_parent', parentId: 'p2', childId: 'c1' },
      { id: 'r7', type: 'biological_parent', parentId: 'p1', childId: 'c2' },
      { id: 'r8', type: 'biological_parent', parentId: 'p2', childId: 'c2' },
    ];

    expect(createFallbackPositions(project)).toEqual(createFallbackPositions(project));
  });

  it('expands an ancestor sibling group downwards to include cousin branches', () => {
    const project = makeProject(['grandparentA', 'grandparentB', 'parent', 'uncle', 'child', 'cousin']);
    project.parentage = [
      { id: 'a-parent', type: 'biological_parent', parentId: 'grandparentA', childId: 'parent' },
      { id: 'b-parent', type: 'biological_parent', parentId: 'grandparentB', childId: 'parent' },
      { id: 'a-uncle', type: 'biological_parent', parentId: 'grandparentA', childId: 'uncle' },
      { id: 'b-uncle', type: 'biological_parent', parentId: 'grandparentB', childId: 'uncle' },
      { id: 'parent-child', type: 'biological_parent', parentId: 'parent', childId: 'child' },
      { id: 'uncle-cousin', type: 'biological_parent', parentId: 'uncle', childId: 'cousin' },
    ];

    const positions = createFallbackPositions(project);
    expect(Math.abs(positions.parent.x - positions.uncle.x)).toBe(224);
    expect(Math.abs(positions.child.x - positions.cousin.x)).toBe(224);
    expect(positions.child.y).toBe(positions.cousin.y);
  });

  it('keeps a person with children from multiple partnerships in one position', () => {
    const project = makeProject(['parent', 'partnerA', 'partnerB', 'childA', 'childB']);
    project.parentage = [
      { id: 'p-a', type: 'biological_parent', parentId: 'parent', childId: 'childA' },
      { id: 'a-a', type: 'biological_parent', parentId: 'partnerA', childId: 'childA' },
      { id: 'p-b', type: 'biological_parent', parentId: 'parent', childId: 'childB' },
      { id: 'b-b', type: 'biological_parent', parentId: 'partnerB', childId: 'childB' },
    ];

    const positions = createFallbackPositions(project);
    expect(positions.parent).toBeDefined();
    expect(Object.keys(positions).filter((id) => id === 'parent')).toHaveLength(1);
    expect(Math.abs(positions.childA.x - positions.childB.x)).toBe(224);
    expect(positions['family:parent|partnerA']).toBeDefined();
    expect(positions['family:parent|partnerB']).toBeDefined();
  });

  it('keeps partnership-connected ancestry components adjacent without merging their generations', () => {
    const project = makeProject(['aParent', 'aChild', 'middleParent', 'middleChild', 'zParent', 'zChild']);
    project.parentage = [
      { id: 'a', type: 'biological_parent', parentId: 'aParent', childId: 'aChild' },
      { id: 'm', type: 'biological_parent', parentId: 'middleParent', childId: 'middleChild' },
      { id: 'z', type: 'biological_parent', parentId: 'zParent', childId: 'zChild' },
    ];
    project.partnerships = [{
      id: 'a-z-partnership',
      type: 'partnership',
      person1Id: 'aChild',
      person2Id: 'zChild',
      startDate: null,
      endDate: null,
      nameChanges: [],
    }];

    const positions = createFallbackPositions(project);
    expect(Math.abs(positions.aChild.x - positions.zChild.x)).toBe(224);
    expect(positions.aChild.y).toBe(positions.zChild.y);
    expect(positions.middleChild.x).not.toBe(positions.aChild.x);
  });

  it('does not depend on person or relationship insertion order', () => {
    const project = makeProject(['gA', 'gB', 'parentA', 'parentB', 'uncle', 'child', 'cousin']);
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'gA', childId: 'parentA' },
      { id: '2', type: 'biological_parent', parentId: 'gB', childId: 'parentA' },
      { id: '3', type: 'biological_parent', parentId: 'gA', childId: 'uncle' },
      { id: '4', type: 'biological_parent', parentId: 'gB', childId: 'uncle' },
      { id: '5', type: 'biological_parent', parentId: 'parentA', childId: 'child' },
      { id: '6', type: 'biological_parent', parentId: 'uncle', childId: 'cousin' },
    ];
    const original = createFallbackPositions(project);
    const permuted = {
      ...project,
      people: [...project.people].reverse(),
      parentage: [...project.parentage].reverse(),
    };
    expect(createFallbackPositions(permuted)).toEqual(original);
  });

  it('places every person exactly once and never overlaps cards in a generation', () => {
    const project = makeProject(['g1', 'g2', 'p1', 'p2', 'p3', 'c1', 'c2', 'c3', 'isolated']);
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'g1', childId: 'p1' },
      { id: '2', type: 'biological_parent', parentId: 'g2', childId: 'p1' },
      { id: '3', type: 'biological_parent', parentId: 'g1', childId: 'p2' },
      { id: '4', type: 'biological_parent', parentId: 'g2', childId: 'p2' },
      { id: '5', type: 'biological_parent', parentId: 'p1', childId: 'c1' },
      { id: '6', type: 'biological_parent', parentId: 'p2', childId: 'c1' },
      { id: '7', type: 'biological_parent', parentId: 'p2', childId: 'c2' },
      { id: '8', type: 'biological_parent', parentId: 'p3', childId: 'c3' },
    ];

    const positions = createFallbackPositions(project);
    for (const person of project.people) expect(positions[person.id]).toBeDefined();
    expect(new Set(project.people.map((person) => person.id)).size).toBe(project.people.length);
    const rows = new Map<number, number[]>();
    for (const person of project.people) {
      const y = positions[person.id].y;
      rows.set(y, [...(rows.get(y) ?? []), positions[person.id].x]);
    }
    for (const xs of rows.values()) {
      const ordered = xs.sort((a, b) => a - b);
      for (let index = 1; index < ordered.length; index += 1) {
        expect(ordered[index] - ordered[index - 1]).toBeGreaterThanOrEqual(176);
      }
    }
  });

  it('handles pedigree collapse without duplicating a shared ancestor or descendant', () => {
    const project = makeProject(['ancestorA', 'ancestorB', 'parentA', 'parentB', 'child']);
    project.parentage = [
      { id: 'a-pa', type: 'biological_parent', parentId: 'ancestorA', childId: 'parentA' },
      { id: 'b-pa', type: 'biological_parent', parentId: 'ancestorB', childId: 'parentA' },
      { id: 'a-pb', type: 'biological_parent', parentId: 'ancestorA', childId: 'parentB' },
      { id: 'b-pb', type: 'biological_parent', parentId: 'ancestorB', childId: 'parentB' },
      { id: 'pa-child', type: 'biological_parent', parentId: 'parentA', childId: 'child' },
      { id: 'pb-child', type: 'biological_parent', parentId: 'parentB', childId: 'child' },
    ];

    const positions = createFallbackPositions(project);
    for (const person of project.people) expect(positions[person.id]).toBeDefined();
    expect(new Set(project.people.map((person) => person.id)).size).toBe(project.people.length);
    expect(Math.abs(positions.parentA.x - positions.parentB.x)).toBe(224);
    expect(positions.child.y).toBe(positions.parentA.y + 190);
    expect(Object.keys(positions).filter((id) => id === 'ancestorA')).toHaveLength(1);
  });


  it('keeps the corrected CA, AB, BA exact-parent-set groups together', () => {
    const project = makeProject(['A', 'B', 'C', 'CA', 'AB', 'BA']);
    project.parentage = [
      { id: 'ca-c', type: 'biological_parent', parentId: 'C', childId: 'CA' },
      { id: 'ca-a', type: 'biological_parent', parentId: 'A', childId: 'CA' },
      { id: 'ab-a', type: 'biological_parent', parentId: 'A', childId: 'AB' },
      { id: 'ab-b', type: 'biological_parent', parentId: 'B', childId: 'AB' },
      { id: 'ba-a', type: 'biological_parent', parentId: 'A', childId: 'BA' },
      { id: 'ba-b', type: 'biological_parent', parentId: 'B', childId: 'BA' },
    ];

    const positions = createFallbackPositions(project);
    const childOrder = ['CA', 'AB', 'BA'].sort((a, b) => positions[a].x - positions[b].x);
    const abIndex = childOrder.indexOf('AB');
    const baIndex = childOrder.indexOf('BA');

    expect(Math.abs(abIndex - baIndex)).toBe(1);
    expect(childOrder).toContain('CA');
    expect(Object.keys(positions).filter((id) => ['A', 'B', 'C', 'CA', 'AB', 'BA'].includes(id))).toHaveLength(6);
  });

  it('keeps shared people unique after global layered ordering', () => {
    const project = makeProject(['shared', 'partnerA', 'partnerB', 'childA', 'childB']);
    project.parentage = [
      { id: 's-a', type: 'biological_parent', parentId: 'shared', childId: 'childA' },
      { id: 'a-a', type: 'biological_parent', parentId: 'partnerA', childId: 'childA' },
      { id: 's-b', type: 'biological_parent', parentId: 'shared', childId: 'childB' },
      { id: 'b-b', type: 'biological_parent', parentId: 'partnerB', childId: 'childB' },
    ];

    const positions = createFallbackPositions(project);
    expect(positions.shared).toBeDefined();
    expect(Object.keys(positions).filter((id) => id === 'shared')).toHaveLength(1);
    expect(positions.childA.y).toBe(positions.childB.y);
  });

});
