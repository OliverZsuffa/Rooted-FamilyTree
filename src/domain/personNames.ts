import type { Person } from './schema';

export type PersonNameUpdate =
  | { valid: true; fields: Partial<Pick<Person, 'firstName' | 'middleName' | 'lastName' | 'name'>> }
  | { valid: false; fields: {} };

/**
 * Builds a safe structured-name update for an existing person.
 * An entirely blank form means "leave the existing name untouched", which
 * is important for legacy records that only have a display name.
 */
export function getPersonNameUpdate(person: Person, first: string, middle: string, last: string): PersonNameUpdate {
  if (!first && !middle && !last) return { valid: true, fields: {} };
  if (!first) return { valid: false, fields: {} };

  return {
    valid: true,
    fields: {
      firstName: first,
      middleName: middle,
      lastName: last,
      name: person.nameHistory.length ? person.name : [first, middle, last].filter(Boolean).join(' '),
    },
  };
}
