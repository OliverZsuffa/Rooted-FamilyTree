import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { getFamilyGroups } from './familyGroups';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

describe('family group derivation', () => {
  it('groups children only when their exact recorded parent sets match', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'biological_parent', parentId: 'a', childId: 'd' },
      { id: '2', type: 'adoptive_parent', parentId: 'b', childId: 'd' },
      { id: '3', type: 'biological_parent', parentId: 'a', childId: 'e' },
      { id: '4', type: 'adoptive_parent', parentId: 'b', childId: 'e' },
      { id: '5', type: 'biological_parent', parentId: 'a', childId: 'f' },
      { id: '6', type: 'biological_parent', parentId: 'c', childId: 'f' },
    ];
    const groups = getFamilyGroups(project);
    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.childIds.includes('d'))?.childIds).toEqual(['d', 'e']);
    expect(groups.find((group) => group.childIds.includes('f'))?.parentIds).toEqual(['a', 'c']);
  });

  it('keeps a single recorded parent as a one-parent group', () => {
    const project = fixture();
    project.parentage = [{ id: '1', type: 'biological_parent', parentId: 'a', childId: 'd' }];
    expect(getFamilyGroups(project)).toMatchObject([{ parentIds: ['a'], childIds: ['d'] }]);
  });

  it('does not infer family groups from partnerships, step-parent or guardian records', () => {
    const project = fixture();
    project.parentage = [
      { id: '1', type: 'step_parent', parentId: 'a', childId: 'd' },
      { id: '2', type: 'guardian', parentId: 'b', childId: 'd' },
    ];
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null, nameChanges: [] }];
    expect(getFamilyGroups(project)).toEqual([]);
  });
});
