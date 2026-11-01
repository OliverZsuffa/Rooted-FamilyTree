import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { getKinshipLabel } from './kinship';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['greatGrandma', 'grandma', 'grandpa', 'mother', 'father', 'aunt', 'greatAunt', 'child', 'cousin', 'niece', 'greatNiece', 'unrelated'].map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}
const relation = (id: string, parentId: string, childId: string) => ({ id, type: 'biological_parent' as const, parentId, childId });

describe('kinship labels', () => {
  it('calculates direct ancestry and gendered labels', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'grandma')!.gender = 'female';
    project.people.find((person) => person.id === 'mother')!.gender = 'female';
    project.parentage = [relation('1', 'grandma', 'mother'), relation('2', 'mother', 'child')];
    expect(getKinshipLabel(project, 'child', 'grandma')).toBe('grandmother');
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('mother');
    expect(getKinshipLabel(project, 'grandma', 'child')).toBe('grandchild');
  });

  it('uses neutral labels when gender is unspecified or nonbinary', () => {
    const project = fixture();
    project.parentage = [relation('1', 'mother', 'child')];
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('parent');
    project.people.find((person) => person.id === 'mother')!.gender = 'nonbinary';
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('parent');
  });

  it('calculates aunts, great aunts, nieces, and great nieces', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'aunt')!.gender = 'female';
    project.people.find((person) => person.id === 'greatAunt')!.gender = 'female';
    project.people.find((person) => person.id === 'niece')!.gender = 'female';
    project.people.find((person) => person.id === 'greatNiece')!.gender = 'female';
    project.parentage = [
      relation('1', 'greatGrandma', 'grandma'),
      relation('2', 'greatGrandma', 'greatAunt'),
      relation('3', 'grandma', 'mother'),
      relation('4', 'grandma', 'aunt'),
      relation('5', 'mother', 'child'),
      relation('6', 'aunt', 'cousin'),
      relation('7', 'mother', 'niece'),
      relation('8', 'niece', 'greatNiece'),
    ];
    expect(getKinshipLabel(project, 'child', 'aunt')).toBe('aunt');
    expect(getKinshipLabel(project, 'child', 'greatAunt')).toBe('great-aunt');
    expect(getKinshipLabel(project, 'aunt', 'niece')).toBe('niece');
    expect(getKinshipLabel(project, 'aunt', 'greatNiece')).toBe('great-niece');
  });

  it('calculates cousin degree and removal', () => {
    const project = fixture();
    project.parentage = [
      relation('1', 'grandma', 'mother'), relation('2', 'grandpa', 'mother'),
      relation('3', 'grandma', 'aunt'), relation('4', 'grandpa', 'aunt'),
      relation('5', 'mother', 'child'), relation('6', 'aunt', 'cousin'),
      relation('7', 'cousin', 'niece'),
    ];
    expect(getKinshipLabel(project, 'child', 'cousin')).toBe('first cousin');
    expect(getKinshipLabel(project, 'child', 'niece')).toBe('first cousin once removed');
  });

  it('distinguishes half siblings and derives step relationships from recorded links', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'father')!.gender = 'male';
    project.people.find((person) => person.id === 'aunt')!.gender = 'female';
    project.parentage = [
      relation('1', 'mother', 'child'), relation('2', 'father', 'child'), relation('3', 'father', 'cousin'),
      { id: '4', type: 'step_parent', parentId: 'aunt', childId: 'child' },
    ];
    expect(getKinshipLabel(project, 'child', 'cousin')).toBe('half-sibling');
    expect(getKinshipLabel(project, 'child', 'aunt')).toBe('stepmother');
    expect(getKinshipLabel(project, 'aunt', 'child')).toBe('stepchild');
  });

  it('identifies direct adoptive parent and child relationships', () => {
    const project = fixture();
    project.people.find((person) => person.id === 'mother')!.gender = 'female';
    project.people.find((person) => person.id === 'child')!.gender = 'male';
    project.parentage = [{ id: 'adoption', type: 'adoptive_parent', parentId: 'mother', childId: 'child' }];
    expect(getKinshipLabel(project, 'child', 'mother')).toBe('adoptive mother');
    expect(getKinshipLabel(project, 'mother', 'child')).toBe('adopted son');
  });

  it('does not label unrelated people', () => {
    expect(getKinshipLabel(fixture(), 'child', 'unrelated')).toBeNull();
  });
});
