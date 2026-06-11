export type ItemType = 'Fruit' | 'Vegetable';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
}

export interface ColumnItem {
  item: Item;
  /** Timestamp when this item entered the column — used as CSS animation key */
  addedAt: number;
}

// ── Users page (optional part 2) ──────────────────────────────────────────────

export interface RawUser {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  age: number;
  hair: { color: string; type: string };
  address: { postalCode: string };
  company: { department: string };
}

export interface DepartmentSummary {
  male: number;
  female: number;
  ageRange: string;
  hair: Record<string, number>;
  addressUser: Record<string, string>;
}

export interface ApiMeta {
  responseTime: number; // ms
  isCached: boolean;
  cacheAge: number;     // ms since cache was populated
}

// ── Backend API types ─────────────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string; // "admin" | "user"
  created_at: string; // Go serializes as snake_case
}
