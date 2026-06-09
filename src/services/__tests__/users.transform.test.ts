import { describe, it, expect } from 'vitest';
import { groupByDepartment } from '../users.transform';
import type { RawUser } from '../../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<RawUser> = {}): RawUser => ({
  firstName:  'Alice',
  lastName:   'Smith',
  gender:     'female',
  age:        30,
  hair:       { color: 'Black', type: 'Straight' },
  address:    { postalCode: '10001' },
  company:    { department: 'Engineering' },
  ...overrides,
});

const USERS: RawUser[] = [
  makeUser({ firstName: 'Alice', lastName: 'Smith',   gender: 'female', age: 30, hair: { color: 'Black',    type: 'Straight' }, address: { postalCode: '10001' }, company: { department: 'Engineering' } }),
  makeUser({ firstName: 'Bob',   lastName: 'Jones',   gender: 'male',   age: 25, hair: { color: 'Blond',    type: 'Curly'    }, address: { postalCode: '10002' }, company: { department: 'Engineering' } }),
  makeUser({ firstName: 'Carol', lastName: 'Lee',     gender: 'female', age: 35, hair: { color: 'Black',    type: 'Straight' }, address: { postalCode: '20001' }, company: { department: 'Marketing'   } }),
  makeUser({ firstName: 'Dave',  lastName: 'Brown',   gender: 'male',   age: 40, hair: { color: 'Brown',    type: 'Wavy'     }, address: { postalCode: '20002' }, company: { department: 'Marketing'   } }),
  makeUser({ firstName: 'Eve',   lastName: 'White',   gender: 'female', age: 28, hair: { color: 'Chestnut', type: 'Straight' }, address: { postalCode: '30001' }, company: { department: 'Finance'     } }),
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('groupByDepartment', () => {

  it('returns all departments present in the input', () => {
    const result = groupByDepartment(USERS);
    expect(Object.keys(result).sort()).toEqual(['Engineering', 'Finance', 'Marketing']);
  });

  it('counts male and female correctly per department', () => {
    const result = groupByDepartment(USERS);
    expect(result['Engineering'].male).toBe(1);
    expect(result['Engineering'].female).toBe(1);
    expect(result['Marketing'].male).toBe(1);
    expect(result['Marketing'].female).toBe(1);
    expect(result['Finance'].male).toBe(0);
    expect(result['Finance'].female).toBe(1);
  });

  it('computes ageRange as "min-max" per department', () => {
    const result = groupByDepartment(USERS);
    expect(result['Engineering'].ageRange).toBe('25-30');
    expect(result['Marketing'].ageRange).toBe('35-40');
    expect(result['Finance'].ageRange).toBe('28-28');
  });

  it('counts hair colours correctly', () => {
    const result = groupByDepartment(USERS);
    expect(result['Engineering'].hair['Black']).toBe(1);
    expect(result['Engineering'].hair['Blond']).toBe(1);
    expect(result['Marketing'].hair['Black']).toBe(1);
    expect(result['Marketing'].hair['Brown']).toBe(1);
  });

  it('maps "firstNamelastName" → postalCode in addressUser', () => {
    const result = groupByDepartment(USERS);
    expect(result['Engineering'].addressUser['AliceSmith']).toBe('10001');
    expect(result['Engineering'].addressUser['BobJones']).toBe('10002');
    expect(result['Finance'].addressUser['EveWhite']).toBe('30001');
  });

  it('handles a single user correctly', () => {
    const result = groupByDepartment([makeUser()]);
    expect(result['Engineering'].male).toBe(0);
    expect(result['Engineering'].female).toBe(1);
    expect(result['Engineering'].ageRange).toBe('30-30');
  });

  it('returns empty object for empty input', () => {
    expect(groupByDepartment([])).toEqual({});
  });

  it('does not expose internal _ages field in output', () => {
    const result = groupByDepartment(USERS);
    for (const dept of Object.values(result)) {
      expect(dept).not.toHaveProperty('_ages');
    }
  });

  it('accumulates multiple hair colours across users in the same dept', () => {
    const users = [
      makeUser({ hair: { color: 'Black', type: 'Straight' } }),
      makeUser({ hair: { color: 'Black', type: 'Curly'    } }),
      makeUser({ hair: { color: 'Blond', type: 'Wavy'     } }),
    ];
    const result = groupByDepartment(users);
    expect(result['Engineering'].hair['Black']).toBe(2);
    expect(result['Engineering'].hair['Blond']).toBe(1);
  });

  it('last-write wins for duplicate full names in addressUser', () => {
    // same firstName+lastName in same dept → second postalCode overwrites
    const users = [
      makeUser({ firstName: 'Alice', lastName: 'Smith', address: { postalCode: '11111' } }),
      makeUser({ firstName: 'Alice', lastName: 'Smith', address: { postalCode: '22222' } }),
    ];
    const result = groupByDepartment(users);
    expect(result['Engineering'].addressUser['AliceSmith']).toBe('22222');
  });
});
