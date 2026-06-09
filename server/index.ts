/**
 * TypeScript API server for the frontend assignment — Part 2.
 *
 * Exposes user-by-department data via:
 *   • HTTP  (Express)  → GET /users/department-summary   (port 3001)
 *   • gRPC             → DepartmentSummaryService.GetSummary (port 50051)
 *
 * Fetches data from dummyjson.com with parallel pagination, then caches the
 * result in memory for 1 hour so subsequent requests are instant.
 */

import express, { Request, Response, NextFunction } from 'express';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawUser {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  age: number;
  hair: { color: string };
  address: { postalCode: string };
  company: { department: string };
}

interface DepartmentEntry {
  male: number;
  female: number;
  ageRange: string;
  hair: Record<string, number>;
  addressUser: Record<string, string>;
}

// ── Data layer ────────────────────────────────────────────────────────────────

const DUMMYJSON_BASE = 'https://dummyjson.com/users';
const FIELDS = 'select=firstName,lastName,gender,age,hair,address,company';
const PAGE_SIZE = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache: { data: Record<string, DepartmentEntry>; ts: number } | null = null;

async function fetchAllUsers(): Promise<RawUser[]> {
  const firstRes = await fetch(
    `${DUMMYJSON_BASE}?limit=${PAGE_SIZE}&skip=0&${FIELDS}`,
  );
  if (!firstRes.ok) throw new Error(`dummyjson HTTP ${firstRes.status}`);

  const { users: firstPage, total } = (await firstRes.json()) as {
    users: RawUser[];
    total: number;
  };

  if (total <= PAGE_SIZE) return firstPage;

  const extraPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: extraPages }, (_, i) =>
      fetch(
        `${DUMMYJSON_BASE}?limit=${PAGE_SIZE}&skip=${(i + 1) * PAGE_SIZE}&${FIELDS}`,
      )
        .then(r => r.json() as Promise<{ users: RawUser[] }>)
        .then(d => d.users),
    ),
  );

  return [...firstPage, ...rest.flat()];
}

function groupByDepartment(users: RawUser[]): Record<string, DepartmentEntry> {
  type Acc = DepartmentEntry & { _ages: number[] };
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

// Singleton fetch — one in-flight request at a time, shared across callers.
let inflight: Promise<Record<string, DepartmentEntry>> | null = null;

async function getDepartmentSummary(): Promise<Record<string, DepartmentEntry>> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    console.log('[cache] hit');
    return cache.data;
  }

  if (inflight) {
    console.log('[cache] awaiting inflight request');
    return inflight;
  }

  console.log('[cache] miss — fetching from dummyjson');
  inflight = fetchAllUsers()
    .then(users => {
      const data = groupByDepartment(users);
      cache = { data, ts: Date.now() };
      console.log(`[cache] stored ${Object.keys(data).length} departments`);
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

// ── Express HTTP server ───────────────────────────────────────────────────────

const HTTP_PORT = 3001;
const app = express();

// CORS — allow the Vite dev server to call us.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/users/department-summary', async (_req: Request, res: Response) => {
  try {
    const data = await getDepartmentSummary();
    res.json(data);
  } catch (err) {
    console.error('[HTTP] error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] server listening on http://localhost:${HTTP_PORT}`);
});

// ── gRPC server ───────────────────────────────────────────────────────────────

const GRPC_PORT = 50051;
const PROTO_PATH = path.join(__dirname, 'proto/users.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,       // camelCase in JS
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDef) as any;

const grpcServer = new grpc.Server();

grpcServer.addService(proto.users.DepartmentSummaryService.service, {
  getSummary: async (
    _call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>,
  ) => {
    try {
      const summary = await getDepartmentSummary();

      // Map our internal shape to the proto field names (snake_case).
      const departments: Record<string, unknown> = {};
      for (const [dept, entry] of Object.entries(summary)) {
        departments[dept] = {
          male:         entry.male,
          female:       entry.female,
          age_range:    entry.ageRange,
          hair:         entry.hair,
          address_user: entry.addressUser,
        };
      }

      callback(null, { departments });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: String(err) }, null);
    }
  },
});

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('[gRPC] bind error:', err);
      process.exit(1);
    }
    console.log(`[gRPC] server listening on port ${port}`);
  },
);
