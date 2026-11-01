import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './schema';
import { validateProjectForImport } from './projectValidation';

describe('backup validation', () => {
  it('accepts a valid project with custom attributes and partnerships', () => {
    const project = createEmptyProject();
    project.people = [
      { id: 'one', name: 'One', gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: { occupation: 'Teacher', age: 42, living: true }, displayAttribute: 'occupation' },
      { id: 'two', name: 'Two', gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
    ];
    project.partnerships = [{ id: 'marriage', type: 'marriage', person1Id: 'one', person2Id: 'two', startDate: '2000-01-01', endDate: null, nameChanges: [] }];
    expect(validateProjectForImport(project).success).toBe(true);
  });

  it('rejects duplicate person identifiers', () => {
    const project = createEmptyProject();
    project.people = [
      { id: 'same', name: 'One', gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
      { id: 'same', name: 'Two', gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null },
    ];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('duplicate people') });
  });

  it('rejects partnerships that reference missing people', () => {
    const project = createEmptyProject();
    project.partnerships = [{ id: 'p', type: 'partnership', person1Id: 'missing', person2Id: 'also-missing', startDate: null, endDate: null, nameChanges: [] }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false });
  });


  it('rejects partnership dates that end before they begin', () => {
    const project = createEmptyProject();
    project.people = ['one', 'two'].map((id) => ({ id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }));
    project.partnerships = [{ id: 'p', type: 'marriage', person1Id: 'one', person2Id: 'two', startDate: '2020-01-01', endDate: '2019-12-31', nameChanges: [] }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('date range') });
  });

  it('rejects a marriage name change for someone outside the partnership', () => {
    const project = createEmptyProject();
    project.people = ['one', 'two', 'three'].map((id) => ({
      id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null,
    }));
    project.partnerships = [{
      id: 'marriage', type: 'marriage', person1Id: 'one', person2Id: 'two', startDate: null, endDate: null,
      nameChanges: [{ personId: 'three', previousName: 'Three', newName: 'Changed Three', effectiveDate: null }],
    }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('outside that partnership') });
  });

  it('rejects a card attribute that does not exist', () => {
    const project = createEmptyProject();
    project.people = [{ id: 'one', name: 'One', gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: 'missing' }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('missing custom detail') });
  });

  it('rejects a person who died before their birth date', () => {
    const project = createEmptyProject();
    project.people = [{ id: 'one', name: 'One', gender: null, nameHistory: [], birthDate: '2000-01-01', deathDate: '1999-12-31', attributes: {}, displayAttribute: null }];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('death date') });
  });

  it('rejects circular ancestry before import', () => {
    const project = createEmptyProject();
    project.people = ['one', 'two'].map((id) => ({ id, name: id, gender: null, nameHistory: [], birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }));
    project.parentage = [
      { id: 'a', type: 'biological_parent', parentId: 'one', childId: 'two' },
      { id: 'b', type: 'adoptive_parent', parentId: 'two', childId: 'one' },
    ];
    expect(validateProjectForImport(project)).toMatchObject({ success: false, error: expect.stringContaining('cycle') });
  });
});
