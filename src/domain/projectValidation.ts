import { projectSchema, type Project } from './schema';
import { calculateGenerations } from './relationships';

export type ProjectValidation =
  | { success: true; project: Project }
  | { success: false; error: string };

export function validateProjectForImport(input: unknown): ProjectValidation {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'This file is not a valid Rooted backup.' };

  const project = parsed.data;
  const personIds = project.people.map((person) => person.id);
  if (new Set(personIds).size !== personIds.length) {
    return { success: false, error: 'The backup contains duplicate people.' };
  }

  const relationshipIds = [...project.parentage, ...project.partnerships].map((item) => item.id);
  if (new Set(relationshipIds).size !== relationshipIds.length) {
    return { success: false, error: 'The backup contains duplicate relationship records.' };
  }

  const parentageKeys = project.parentage.map((item) => [item.parentId, item.childId, item.type].join(':'));
  if (new Set(parentageKeys).size !== parentageKeys.length) {
    return { success: false, error: 'The backup contains duplicate parentage relationships.' };
  }

  if (project.people.some((person) => person.birthDate && person.deathDate && person.deathDate < person.birthDate)) {
    return { success: false, error: 'A person has a death date before their birth date.' };
  }

  const people = new Set(personIds);
  if (project.people.some((person) => person.displayAttribute && !Object.prototype.hasOwnProperty.call(person.attributes, person.displayAttribute))) {
    return { success: false, error: 'A person card refers to a missing custom detail.' };
  }
  if (project.partnerships.some((item) => !people.has(item.person1Id)
    || !people.has(item.person2Id) || item.person1Id === item.person2Id
    || (item.startDate && item.endDate && item.endDate < item.startDate))) {
    return { success: false, error: 'A partnership contains an invalid person reference or date range.' };
  }

  const generations = calculateGenerations(project);
  if (!generations.ok) return { success: false, error: generations.error };
  return { success: true, project };
}
