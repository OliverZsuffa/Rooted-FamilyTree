import { describe, expect, it } from 'vitest';
import { getPersonNameUpdate } from './personNames';
import type { Person } from './schema';

const basePerson: Person = {
  id: 'person-1',
  name: 'Legacy Display Name',
  gender: null,
  nameHistory: [],
  birthDate: null,
  deathDate: null,
  attributes: {},
  displayAttribute: null,
};

describe('getPersonNameUpdate', () => {
  it('allows a first name without middle or last names', () => {
    expect(getPersonNameUpdate(basePerson, 'Ada', '', '')).toEqual({
      valid: true,
      fields: { firstName: 'Ada', middleName: '', lastName: '', name: 'Ada' },
    });
  });

  it('composes complete names from the available components', () => {
    expect(getPersonNameUpdate(basePerson, 'Ada', 'Mary', 'Lovelace')).toMatchObject({
      valid: true,
      fields: { name: 'Ada Mary Lovelace' },
    });
    expect(getPersonNameUpdate(basePerson, 'Ada', '', 'Lovelace')).toMatchObject({
      valid: true,
      fields: { name: 'Ada Lovelace' },
    });
  });

  it('rejects middle-name-only and surname-only structured edits', () => {
    expect(getPersonNameUpdate(basePerson, '', 'Mary', '')).toEqual({ valid: false, fields: {} });
    expect(getPersonNameUpdate(basePerson, '', '', 'Lovelace')).toEqual({ valid: false, fields: {} });
  });

  it('preserves legacy display names when structured name fields are left blank', () => {
    expect(getPersonNameUpdate(basePerson, '', '', '')).toEqual({ valid: true, fields: {} });
  });

  it('does not rewrite the canonical display name when name history exists', () => {
    const historicalPerson = {
      ...basePerson,
      nameHistory: [{ id: 'history-1', previousName: 'Ada King', newName: 'Ada Lovelace', partnershipId: 'marriage-1' }],
    };
    expect(getPersonNameUpdate(historicalPerson, 'Ada', '', 'Byron')).toMatchObject({
      valid: true,
      fields: { firstName: 'Ada', middleName: '', lastName: 'Byron', name: 'Legacy Display Name' },
    });
  });
});
