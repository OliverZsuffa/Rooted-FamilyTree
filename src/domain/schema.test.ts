import { describe, expect, it } from 'vitest';
import { createEmptyProject, projectSchema } from './schema';

describe('project schema', () => {
  it('creates a valid empty project', () => {
    expect(projectSchema.parse(createEmptyProject()).people).toEqual([]);
  });

  it('rejects invalid calendar dates', () => {
    const project = createEmptyProject();
    project.people = [{ id: 'p', name: 'Person', birthDate: '2026-02-31', deathDate: null, attributes: {}, displayAttribute: null }];
    expect(() => projectSchema.parse(project)).toThrow();
  });

  it('rejects an unsupported schema version', () => {
    const project = createEmptyProject();
    expect(() => projectSchema.parse({ ...project, schemaVersion: 99 })).toThrow();
  });
});