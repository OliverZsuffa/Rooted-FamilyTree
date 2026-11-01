import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { calculateGenerations, getSiblings, validateParentage } from './relationships';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id, birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }));
  return project;
}

describe('family generations', () => {
  it('assigns generations from biological and adoptive parentage', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'a', childId: 'c' },
      { id: '2', type: 'adoptive_parent', parentId: 'c', childId: 'd' },
    ];
    const result = calculateGenerations(project);
    expect(result.ok).toBe(true);
    if (result.ok) expect([...result.generations]).toEqual([['a', 0], ['b', 0], ['c', 1], ['d', 2]]);
  });

  it('does not let step-parent or guardian relationships change generations', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'step_parent', parentId: 'a', childId: 'c' },
      { id: '2', type: 'guardian', parentId: 'b', childId: 'c' },
    ];
    const result = calculateGenerations(project);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.generations.get('c')).toBe(0);
  });

  it('rejects cycles', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: '2', type: 'adoptive_parent', parentId: 'b', childId: 'a' },
    ];
    expect(calculateGenerations(project)).toMatchObject({ ok: false, error: expect.stringContaining('cycle') });
  });

  it('rejects parents assigned to incompatible generations', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: '2', type: 'biological_parent', parentId: 'b', childId: 'c' },
      { id: '3', type: 'biological_parent', parentId: 'b', childId: 'd' },
      { id: '4', type: 'adoptive_parent', parentId: 'c', childId: 'd' },
    ];
    expect(calculateGenerations(project)).toMatchObject({ ok: false, error: expect.stringContaining('same generation') });
  });

  it('derives siblings from shared biological or adoptive parents', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: '2', type: 'biological_parent', parentId: 'a', childId: 'c' },
    ];
    expect(getSiblings(project, 'b').map((person) => person.id)).toEqual(['c']);
  });

  it('rejects duplicate relationships', () => {
    const project = fixture();
    const relation = { id: '1', type: 'biological_parent' as const, parentId: 'a', childId: 'b' };
    project.parentage = [relation];
    expect(validateParentage(project, { ...relation, id: '2' })).toContain('already exists');
  });
});
