import { describe, expect, it } from 'vitest';
import { createEmptyProject, type Project } from './schema';
import { buildRelationshipEdges } from './relationshipEdges';

function fixture(): Project {
  const project = createEmptyProject();
  project.people = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
  }));
  return project;
}

describe('relationship edge construction', () => {
  it('consolidates a matching partnership into the family junction', () => {
    const project = fixture();
    project.parentage = [
      { id: 'a-child', type: 'biological_parent', parentId: 'a', childId: 'c' },
      { id: 'b-child', type: 'adoptive_parent', parentId: 'b', childId: 'c' },
      { id: 'step', type: 'step_parent', parentId: 'd', childId: 'c' },
      { id: 'guardian', type: 'guardian', parentId: 'e', childId: 'c' },
    ];
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null, nameChanges: [] }];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c', 'd', 'e', 'family:a|b'], null, new Set(), { a: { x: 0, y: 0 }, b: { x: 240, y: 0 } });
    expect(edges.map((edge) => edge.id).sort()).toEqual(['family:a|b:child:c', 'family:a|b:parent:a', 'family:a|b:parent:b', 'guardian', 'step']);
    expect(edges.some((edge) => edge.id === 'ab')).toBe(false);
  });

  it('keeps a partnership separate when it has no matching recorded children', () => {
    const project = fixture();
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null, nameChanges: [] }];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c'], null, new Set());
    expect(edges.map((edge) => edge.id)).toEqual(['ab']);
  });

  it('does not infer children from a marriage', () => {
    const project = fixture();
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null, nameChanges: [] }];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c'], null, new Set());
    expect(edges.map((edge) => edge.id)).toEqual(['ab']);
  });

  it('keeps family groups separate for multiple partnerships', () => {
    const project = fixture();
    project.parentage = [
      { id: 'a-d', type: 'biological_parent', parentId: 'a', childId: 'd' },
      { id: 'b-d', type: 'biological_parent', parentId: 'b', childId: 'd' },
      { id: 'a-e', type: 'biological_parent', parentId: 'a', childId: 'e' },
      { id: 'c-e', type: 'biological_parent', parentId: 'c', childId: 'e' },
    ];
    const edges = buildRelationshipEdges(project, ['a', 'b', 'c', 'd', 'e', 'family:a|b', 'family:a|c'], null, new Set());
    expect(edges.some((edge) => edge.id === 'family:a|b:child:d')).toBe(true);
    expect(edges.some((edge) => edge.id === 'family:a|c:child:e')).toBe(true);
  });

  it('marks manually incomplete family and partnership edges with the warning colour token', () => {
    const project = fixture();
    project.parentage = [{ id: 'parent-child', type: 'biological_parent', parentId: 'a', childId: 'c', manualIncomplete: true }];
    const familyEdges = buildRelationshipEdges(project, ['a', 'c', 'family:a'], null, new Set());
    expect(familyEdges.every((edge) => edge.style?.stroke === 'var(--edge-incomplete)')).toBe(true);
    project.parentage = [];
    project.partnerships = [{ id: 'ab', type: 'marriage', person1Id: 'a', person2Id: 'b', startDate: null, endDate: null, nameChanges: [], manualIncomplete: true }];
    const partnershipEdges = buildRelationshipEdges(project, ['a', 'b'], null, new Set());
    expect(partnershipEdges[0].style?.stroke).toBe('var(--edge-incomplete)');
  });

  it('does not emit connectors with hidden endpoints', () => {
    const project = fixture();
    project.parentage = [{ id: 'parent-child', type: 'biological_parent', parentId: 'a', childId: 'b' }];
    expect(buildRelationshipEdges(project, ['a'], null, new Set())).toEqual([]);
  });
});
