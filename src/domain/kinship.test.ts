import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { getKinshipLabel } from './kinship';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['grandma', 'grandpa', 'mother', 'father', 'aunt', 'child', 'cousin', 'unrelated'].map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

describe('kinship labels', () => {
  it('calculates direct ancestry and gendered labels', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'grandma')!.gender = 'female';
    project.people.find((person) => person.id === 'mother')!.gender = 'female';
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'grandma', childId: 'mother' },
      { id: '2', type: 'biological_parent', parentId: 'mother', childId: 'child' },
    ];
    expect(getKinshipLabel(project, 'child', 'grandma')).toBe('grandmother');
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('mother');
    expect(getKinshipLabel(project, 'grandma', 'child')).toBe('grandchild');
  });

  it('uses neutral labels when gender is unspecified or nonbinary', () => {
    const project = fixture();
    project.parentage = [{ id: '1', type: 'biological_parent', parentId: 'mother', childId: 'child' }];
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('parent');
    project.people.find((person) => person.id === 'mother')!.gender = 'nonbinary';
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('parent');
  });

  it('calculates aunt and cousin relationships', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'aunt')!.gender = 'female';
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'grandma', childId: 'mother' },
      { id: '2', type: 'biological_parent', parentId: 'grandma', childId: 'aunt' },
      { id: '3', type: 'biological_parent', parentId: 'grandpa', childId: 'mother' },
      { id: '4', type: 'biological_parent', parentId: 'mother', childId: 'child' },
      { id: '5', type: 'biological_parent', parentId: 'father', childId: 'child' },
      { id: '6', type: 'biological_parent', parentId: 'aunt', childId: 'cousin' },
    ];
    expect(getKinshipLabel(project, 'child', 'aunt')).toBe('aunt');
    expect(getKinshipLabel(project, 'child', 'cousin')).toBe('cousin');
  });

  it('distinguishes half siblings and derives step relationships from recorded links', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'father')!.gender = 'male';
    project.people.find((person) => person.id === 'aunt')!.gender = 'female';
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'mother', childId: 'child' },
      { id: '2', type: 'biological_parent', parentId: 'father', childId: 'child' },
      { id: '3', type: 'biological_parent', parentId: 'father', childId: 'cousin' },
      { id: '4', type: 'step_parent', parentId: 'aunt', childId: 'child' },
    ];
    expect(getKinshipLabel(project, 'child', 'cousin')).toBe('half-sibling');
    expect(getKinshipLabel(project, 'child', 'aunt')).toBe('stepmother');
    expect(getKinshipLabel(project, 'aunt', 'child')).toBe('stepchild');
  });

  it('does not label unrelated people', () => {
    const project = fixture();
    expect(getKinshipLabel(project, 'child', 'unrelated')).toBeNull();
  });
});
