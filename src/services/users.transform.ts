/**
 * Pure transformation — groups a flat array of raw users into a department
 * summary map.  Shared between the frontend (tests) and the API server.
 *
 * Having this as a separate module lets you unit-test the transform without
 * any network access and without importing the full service.
 */

import { RawUser, DepartmentSummary } from '../types';

export function groupByDepartment(
  users: RawUser[],
): Record<string, DepartmentSummary> {
  type Acc = DepartmentSummary & { _ages: number[] };
  const acc: Record<string, Acc> = {};

  for (const user of users) {
    const dept = user.company.department;

    if (!acc[dept]) {
      acc[dept] = { male: 0, female: 0, ageRange: '', hair: {}, addressUser: {}, _ages: [] };
    }

    const entry = acc[dept];
    entry[user.gender]++;
    entry._ages.push(user.age);

    const color = user.hair.color;
    entry.hair[color] = (entry.hair[color] ?? 0) + 1;

    const fullName = `${user.firstName}${user.lastName}`;
    entry.addressUser[fullName] = user.address.postalCode;
  }

  return Object.fromEntries(
    Object.entries(acc).map(([dept, { _ages, ...rest }]) => {
      const min = Math.min(..._ages);
      const max = Math.max(..._ages);
      return [dept, { ...rest, ageRange: `${min}-${max}` }];
    }),
  );
}
