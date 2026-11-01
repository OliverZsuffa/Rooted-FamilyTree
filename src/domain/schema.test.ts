import { describe, expect, it } from 'vitest';
import { createEmptyProject, projectSchema } from './schema';

describe('project schema', () => {
  it('creates a valid empty project', () => {
    expect(projectSchema.parse(createEmptyProject()).people).toEqual([]);
  });
  it('rejects an unsupported schema version', () => {
    const project = createEmptyProject();
    expect(() => projectSchema.parse({ ...project, schemaVersion: 99 })).toThrow();
  });
});