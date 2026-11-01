import { describe, expect, it } from 'vitest';
import { createEmptyProject, projectSchema } from './schema';

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
    expect(parsed.people[0]).toMatchObject({ gender: null, nameHistory: [] });
    expect(parsed.partnerships[0].nameChanges).toEqual([]);
  });

  it('rejects invalid calendar dates', () => {
    const project = createEmptyProject();
    project.people = [{ id: 'p', name: 'Person', gender: null, nameHistory: [], birthDate: '2026-02-31', deathDate: null, attributes: {}, displayAttribute: null }];
    expect(() => projectSchema.parse(project)).toThrow();
  });

  it('rejects an unsupported schema version', () => {
    const project = createEmptyProject();
    expect(() => projectSchema.parse({ ...project, schemaVersion: 99 })).toThrow();
  });
});