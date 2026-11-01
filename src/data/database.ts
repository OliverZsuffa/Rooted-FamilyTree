import { openDB } from 'idb';
import { projectSchema, type Project } from '../domain/schema';

const DATABASE_NAME = 'rooted-local';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';
const ACTIVE_PROJECT_KEY = 'active';

async function database() {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PROJECT_STORE)) db.createObjectStore(PROJECT_STORE);
    },
  });
}

export async function loadProject(): Promise<Project | null> {
  const db = await database();
  try {
    const stored = await db.get(PROJECT_STORE, ACTIVE_PROJECT_KEY);
    if (!stored) return null;
    return projectSchema.parse(stored);
  } finally {
    db.close();
  }
}

export async function saveProject(project: Project): Promise<void> {
  const validated = projectSchema.parse({ ...project, updatedAt: new Date().toISOString() });
  const db = await database();
  try {
    await db.put(PROJECT_STORE, validated, ACTIVE_PROJECT_KEY);
  } finally {
    db.close();
  }
}
