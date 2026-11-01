import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './schema';
import { createFallbackPositions } from './layout';

describe('fallback family-tree layout', () => {
  it('assigns a distinct position to every person, including disconnected branches', () => {
    const project = createEmptyProject();
    project.people = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id, name: id, birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    project.parentage = [
      { id: 'ab', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: 'cd', type: 'adoptive_parent', parentId: 'c', childId: 'd' },
    ];
    const positions = createFallbackPositions(project);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(new Set(Object.values(positions).map(({ x, y }) => `${x},${y}`)).size).toBe(5);
    expect(positions.b.y).toBeGreaterThan(positions.a.y);
    expect(positions.d.y).toBeGreaterThan(positions.c.y);
  });

  it('returns no stale positions for an empty replacement tree', () => {
    const project = createEmptyProject();
    expect(createFallbackPositions(project)).toEqual({});
  });
});
