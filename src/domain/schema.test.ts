import { describe, expect, it } from 'vitest';
import { createEmptyProject, partialDateSchema, projectSchema } from './schema';

describe('project schema', () => {
  it('creates a valid empty project', () => {
    expect(projectSchema.parse(createEmptyProject()).people).toEqual([]);
  });

  it('defaults new optional fields when parsing older version 1 backups', () => {
    const project = createEmptyProject();
    const legacy = {
      ...project,
      people: [{ id: 'legacy', name: 'Legacy person', birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }],
      partnerships: [{ id: 'marriage', type: 'marriage', person1Id: 'legacy', person2Id: 'legacy-partner', startDate: null, endDate: null }],
    };
    const parsed = projectSchema.parse(legacy);
    expect(parsed.people[0]).toMatchObject({ gender: null, nameHistory: [], name: 'Legacy person' });
    expect(parsed.partnerships[0].nameChanges).toEqual([]);
  });

  it('accepts all three supported date precisions', () => {
    for (const value of ['1984', '1984-03', '1984-03-17']) expect(partialDateSchema.safeParse(value).success).toBe(true);
  });

  it('rejects invalid partial and full dates', () => {
    for (const value of ['0000', '1984-13', '1984-00', '1984-02-30', '1984-3', '1984-03-1', 'not a date']) {
      expect(partialDateSchema.safeParse(value).success).toBe(false);
    }
  });

  it('retains structured name and manual completeness fields when supplied', () => {
    const parsed = projectSchema.parse({ ...createEmptyProject(), people: [{
      id: 'p', name: 'A B', firstName: 'A', middleName: '', lastName: 'B', manualIncomplete: true,
    }] });
    expect(parsed.people[0]).toMatchObject({ firstName: 'A', middleName: '', lastName: 'B', manualIncomplete: true });
  });

  it('rejects unsupported schema versions', () => {
    expect(() => projectSchema.parse({ ...createEmptyProject(), schemaVersion: 99 })).toThrow();
  });
});
