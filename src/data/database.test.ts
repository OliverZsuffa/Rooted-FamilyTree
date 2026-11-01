import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { createEmptyProject } from '../domain/schema';
import { loadProject, saveProject } from './database';

describe('local project database', () => {
  beforeEach(async () => {
    await deleteDB('rooted-local');
  });

  it('saves and reloads the complete project', async () => {
    const project = createEmptyProject();
    project.people = [{
      id: 'person-1', name: 'Ada', gender: null, nameHistory: [], birthDate: '1815-12-10', deathDate: null,
      attributes: { occupation: 'Mathematician', number: 1 }, displayAttribute: 'occupation',
    }];
    await saveProject(project);
    const loaded = await loadProject();
    expect(loaded?.people).toEqual(project.people);
    expect(loaded?.id).toBe(project.id);
    expect(loaded?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns null when no project has been saved', async () => {
    expect(await loadProject()).toBeNull();
  });

  it('rejects invalid data before writing it', async () => {
    const project = createEmptyProject();
    const invalid = { ...project, schemaVersion: 99 } as unknown as typeof project;
    await expect(saveProject(invalid)).rejects.toThrow();
    expect(await loadProject()).toBeNull();
  });
});
