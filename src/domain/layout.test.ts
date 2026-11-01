import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './schema';
import { createFallbackPositions } from './layout';

describe('fallback family-tree layout', () => {
  it('assigns a distinct position to every person, including disconnected branches', () => {
    const project = createEmptyProject();
    project.people = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    project.parentage = [
      { id: 'ab', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: 'cd', type: 'adoptive_parent', parentId: 'c', childId: 'd' },
    ];
    const positions = createFallbackPositions(project);
    expect(['a', 'b', 'c', 'd', 'e'].every((id) => positions[id] !== undefined)).toBe(true);
    expect(positions['family:a']).toBeDefined();
    expect(positions['family:c']).toBeDefined();
    expect(new Set(Object.values(positions).map(({ x, y }) => `${x},${y}`)).size).toBe(7);
    expect(positions.b.y).toBeGreaterThan(positions.a.y);
    expect(positions.d.y).toBeGreaterThan(positions.c.y);
  });

  it('centres the family junction between parent and child groups', () => {
    const project = createEmptyProject();
    project.people = ['parentA', 'parentB', 'childA', 'childB', 'childC'].map((id) => ({
      id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    project.parentage = project.people.slice(2).flatMap((child) => [
      { id: 'a-' + child.id, type: 'biological_parent' as const, parentId: 'parentA', childId: child.id },
      { id: 'b-' + child.id, type: 'biological_parent' as const, parentId: 'parentB', childId: child.id },
    ]);
    const positions = createFallbackPositions(project);
    const parentCenter = (positions.parentA.x + positions.parentB.x) / 2 + 88;
    const childCenter = (positions.childA.x + positions.childB.x + positions.childC.x) / 3 + 88;
    expect(positions['family:parentA|parentB'].x + 9).toBeCloseTo((parentCenter + childCenter) / 2);
  });

  it('keeps full and half siblings together in the same generation', async () => {
    const project = createEmptyProject();
    project.people = ['parentA', 'parentB', 'parentC', 'soloParent', 'childA', 'childB', 'childC', 'soloChild'].map((id) => ({
      id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    project.parentage = [
      { id: 'a1', type: 'biological_parent', parentId: 'parentA', childId: 'childA' },
      { id: 'a2', type: 'biological_parent', parentId: 'parentA', childId: 'childB' },
      { id: 'b2', type: 'biological_parent', parentId: 'parentB', childId: 'childB' },
      { id: 'b3', type: 'biological_parent', parentId: 'parentB', childId: 'childC' },
      { id: 'solo', type: 'adoptive_parent', parentId: 'soloParent', childId: 'soloChild' },
    ];
    const positions = await calculateAutoPositions(project);
    const childOrder = ['childA', 'childB', 'childC', 'soloChild'].sort((a, b) => positions[a].x - positions[b].x);
    const siblingIndexes = childOrder.map((id, index) => ['childA', 'childB', 'childC'].includes(id) ? index : -1).filter((index) => index >= 0);
    expect(Math.max(...siblingIndexes) - Math.min(...siblingIndexes)).toBe(2);
  });

  it('returns no stale positions for an empty replacement tree', () => {
    const project = createEmptyProject();
    expect(createFallbackPositions(project)).toEqual({});
  });
});

import { calculateAutoPositions } from './layout';

describe('ELK layout collision handling', () => {
  it('keeps disconnected people apart even when ELK places them in the same column', async () => {
    const project = createEmptyProject();
    project.people = ['a', 'b', 'c', 'd'].map((id) => ({
      id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    const positions = await calculateAutoPositions(project);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'c', 'd']);
    const coordinates = Object.values(positions).map(({ x, y }) => `${x},${y}`);
    expect(new Set(coordinates).size).toBe(4);
    expect(coordinates.map((coordinate) => Number(coordinate.split(',')[0])).sort((a, b) => a - b))
      .toEqual([0, 224, 448, 672]);
  });
});
