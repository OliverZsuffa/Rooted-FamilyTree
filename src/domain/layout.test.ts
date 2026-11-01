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
    expect(new Set(Object.values(positions).map(({ x, y }) => `${x},${y}`)).size).toBe(5);
    expect(positions.b.y).toBeGreaterThan(positions.a.y);
    expect(positions.d.y).toBeGreaterThan(positions.c.y);
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
      id, name: id, birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    const positions = await calculateAutoPositions(project);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'c', 'd']);
    const coordinates = Object.values(positions).map(({ x, y }) => `${x},${y}`);
    expect(new Set(coordinates).size).toBe(4);
    expect(coordinates.map((coordinate) => Number(coordinate.split(',')[0])).sort((a, b) => a - b))
      .toEqual([0, 224, 448, 672]);
  });
});
