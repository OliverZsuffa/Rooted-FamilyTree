import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './schema';
import { validateProjectForImport } from './projectValidation';

describe('backup validation', () => {
  it('accepts a valid project with custom attributes and partnerships', () => {
    const project = createEmptyProject();
    project.people = [
      { id: 'one', name: 'One', birthDate: null, deathDate: null, attributes: { occupation: 'Teacher', age: 42, living: true }, displayAttribute: 'occupation' },
      { id: 'two', name: 'Two', birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
    ];
    project.partnerships = [{ id: 'marriage', type: 'marriage', person1Id: 'one', person2Id: 'two', startDate: '2000-01-01', endDate: null }];
    expect(validateProjectForImport(project).success).toBe(true);
  });

  it('rejects duplicate person identifiers', () => {
    const project = createEmptyProject();
    project.people = [
      { id: 'same', name: 'One', birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
      { id: 'same', name: 'Two', birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
    ];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('duplicate people') });
  });

  it('rejects partnerships that reference missing people', () => {
    const project = createEmptyProject();
    project.partnerships = [{ id: 'p', type: 'partnership', person1Id: 'missing', person2Id: 'also-missing', startDate: null, endDate: null }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false });
  });

  it('rejects circular ancestry before import', () => {
    const project = createEmptyProject();
    project.people = ['one', 'two'].map((id) => ({ id, name: id, birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }));
    project.parentage = [
      { id: 'a', type: 'biological_parent', parentId: 'one', childId: 'two' },
      { id: 'b', type: 'adoptive_parent', parentId: 'two', childId: 'one' },
    ];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('cycle') });
  });
});
