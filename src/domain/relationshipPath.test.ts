import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { findRelationshipPath } from './relationshipPath';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['grandparent', 'parentA', 'parentB', 'childA', 'childB', 'partner', 'unrelated'].map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

describe('relationship path finder', () => {
  it('returns the connecting ancestry path and its family junction', () => {
    const project = fixture();
    project.parentage = [
      { id: 'gp-parent', type: 'biological_parent', parentId: 'grandparent', childId: 'parentA' },
      { id: 'parent-child-a', type: 'biological_parent', parentId: 'parentA', childId: 'childA' },
      { id: 'parent-child-b', type: 'biological_parent', parentId: 'parentA', childId: 'childB' },
    ];
    const result = findRelationshipPath(project, 'childA', 'grandparent');
    expect(result?.label).toBe('grandparent');
    expect(result?.personIds).toEqual(['childA', 'parentA', 'grandparent']);
    expect(result?.relationshipIds).toEqual(['parent-child-a', 'gp-parent']);
    expect(result?.familyGroupIds).toContain('family:parentA');
  });

  it('recognises a direct partnership path', () => {
    const project = fixture();
    project.partnerships = [{ id: 'marriage', type: 'marriage', person1Id: 'parentA', person2Id: 'partner', startDate: null, endDate: null, nameChanges: [] }];
    expect(findRelationshipPath(project, 'parentA', 'partner')).toMatchObject({
      label: 'partner', personIds: ['parentA', 'partner'], relationshipIds: ['marriage'], ambiguous: false,
    });
  });

  it('returns no path for unrelated people', () => {
    expect(findRelationshipPath(fixture(), 'childA', 'unrelated')).toBeNull();
  });

  it('reports multiple equally short paths instead of silently hiding them', () => {
    const project = fixture();
    project.parentage = [
      { id: 'a1', type: 'biological_parent', parentId: 'parentA', childId: 'childA' },
      { id: 'a2', type: 'biological_parent', parentId: 'parentA', childId: 'childB' },
      { id: 'b1', type: 'biological_parent', parentId: 'parentB', childId: 'childA' },
      { id: 'b2', type: 'biological_parent', parentId: 'parentB', childId: 'childB' },
    ];
    const result = findRelationshipPath(project, 'childA', 'childB');
    expect(result?.ambiguous).toBe(true);
    expect(result?.alternativeCount).toBeGreaterThan(0);
  });

  it('handles selecting the same person twice', () => {
    expect(findRelationshipPath(fixture(), 'childA', 'childA')).toMatchObject({
      label: 'the same person', personIds: ['childA'], relationshipIds: [],
    });
  });
});
