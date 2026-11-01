import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { buildRelationshipEdges } from './relationshipEdges';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id, name: id, birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

describe('relationship edge construction', () => {
  it('renders every supported parentage type and an independent partnership', () => {
    const project = fixture();
    project.parentage = [
      { id: 'bio', type: 'biological_parent', parentId: 'a', childId: 'b' },
      { id: 'adopt', type: 'adoptive_parent', parentId: 'a', childId: 'c' },
      { id: 'step', type: 'step_parent', parentId: 'd', childId: 'b' },
      { id: 'guardian', type: 'guardian', parentId: 'e', childId: 'c' },
    ];
    project.partnerships = [{ id: 'marriage', type: 'marriage', person1Id: 'c', person2Id: 'd', startDate: null, endDate: null }];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c', 'd', 'e'], null, new Set());
    expect(edges.map((edge) => edge.id).sort()).toEqual(['adopt', 'bio', 'guardian', 'marriage', 'step']);
    expect(edges.find((edge) => edge.id === 'step')?.style).toMatchObject({ strokeDasharray: '5 4' });
    expect(edges.find((edge) => edge.id === 'guardian')?.style).toMatchObject({ strokeDasharray: '5 4' });
  });

  it('routes shared children through the correct partnership junction', () => {
    const project = fixture();
    project.parentage = [
      { id: 'a-child', type: 'biological_parent', parentId: 'a', childId: 'c' },
      { id: 'b-child', type: 'biological_parent', parentId: 'b', childId: 'c' },
    ];
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null }];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c', 'junction:ab'], null, new Set());
    expect(edges.map((edge) => edge.id).sort()).toEqual(['ab:child:c', 'ab:first', 'ab:second']);
    expect(edges.every((edge) => edge.source !== 'a-child' && edge.source !== 'b-child')).toBe(true);
  });

  it('keeps multiple partnerships and their children separate', () => {
    const project = fixture();
    project.parentage = [
      { id: 'a-x', type: 'biological_parent', parentId: 'a', childId: 'd' },
      { id: 'b-x', type: 'biological_parent', parentId: 'b', childId: 'd' },
      { id: 'a-y', type: 'biological_parent', parentId: 'a', childId: 'e' },
      { id: 'c-y', type: 'biological_parent', parentId: 'c', childId: 'e' },
    ];
    project.partnerships = [
      { id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null },
      { id: 'ac', type: 'partnership', person1Id: 'a', person2Id: 'c', startDate: null, endDate: null },
    ];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c', 'd', 'e', 'junction:ab', 'junction:ac'], null, new Set());
    expect(edges).toHaveLength(6);
    expect(edges.some((edge) => edge.id === 'ab:child:d' && edge.target === 'd')).toBe(true);
    expect(edges.some((edge) => edge.id === 'ac:child:e' && edge.target === 'e')).toBe(true);
  });

  it('does not emit edges with endpoints hidden by search', () => {
    const project = fixture();
    project.parentage = [{ id: 'parent-child', type: 'biological_parent', parentId: 'a', childId: 'b' }];
    const edges = buildRelationshipEdges(project, ['a'], null, new Set());
    expect(edges).toEqual([]);
  });
});
