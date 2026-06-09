# Frontend Assignment

## Solution Overview

### Part 1 — Auto-Delete Todo List

React + TypeScript (Vite). Core logic in `src/hooks/useTodoList.ts`:

- `moveToColumn(item)` — removes from main list, places in the type column, starts a 5s `setTimeout`
- `returnToMain(item)` — cancels the timer, removes from column, appends to bottom of main list
- Countdown bar: pure CSS `scaleX` animation driven by `addedAt` timestamp — no `setInterval`

### Part 2 — Users by Department

`src/services/users.service.ts` fetches all users from `https://dummyjson.com/users` in parallel pages and groups them by department.

- **Server-side cache** (1-hour TTL) in the TypeScript/Express server — fast repeat requests
- **`?force=true`** query param bypasses the cache for a fresh fetch
- API response includes `responseTime`, `isCached`, `cacheAge` metadata
- gRPC endpoint on port `50051` via `DepartmentSummaryService.GetSummary`

### Part 3 — Backend Assignment Tab

The same React app connects to the Go backend (Part 3 of the assignment):

- Login / Register auth flow → JWT stored in component state
- Full user CRUD: list, create, edit, delete via the Go REST API
- Proxied through nginx in production (`/api/v1/` → `backend-challenge:8080`)

---

## Project Structure

```
src/
  components/       ← TodoApp, ItemButton, ColumnList, MainList
  hooks/            ← useTodoList (core todo state machine)
  pages/
    UsersPage.tsx   ← Department summary with cache info panel
    BackendPage.tsx ← Backend API UI (auth + CRUD)
    LotteryPage.tsx ← Lottery Search System design proposal
  services/
    users.service.ts    ← dummyjson fetch + 1-hour server-side cache
    backend.service.ts  ← Go backend REST client
  types/            ← Shared TypeScript interfaces
  __tests__/        ← App routing tests

server/
  index.ts          ← Express API (:3001) + gRPC server (:50051)
  proto/users.proto ← gRPC service definition
```

---

## Local Development

**Prerequisites:** Node 20+, Go backend on `:8080` (optional for tab 3)

```bash
npm install
npm run dev      # React on :5173, Express API on :3001
```

Vite proxies:
- `/api/users/*` → `http://localhost:3001` (TypeScript Express)
- `/api/v1/*` → `http://localhost:8080` or override via `BACKEND_URL`

To point tab 3 at the live GKE backend:
```bash
BACKEND_URL=http://8.233.137.90 npm run dev
```

---

## Testing

Tests use **Vitest** with jsdom and `@testing-library/react`.

```bash
npm test               # run all tests (watch mode)
npm run test:coverage  # run with coverage report
```

Coverage thresholds (enforced in CI):

| Metric     | Threshold |
|------------|-----------|
| Lines      | 80%       |
| Functions  | 80%       |
| Statements | 80%       |
| Branches   | 65%       |

Test files are co-located with source under `__tests__/` directories:

| File | What it covers |
|------|----------------|
| `src/__tests__/App.test.tsx` | Top-level routing and tab switching |
| `src/components/__tests__/TodoApp.test.tsx` | Item move and 5s auto-return |
| `src/components/__tests__/ItemButton.test.tsx` | Render, click, countdown bar |
| `src/components/__tests__/ColumnList.test.tsx` | Column render and click-back |
| `src/components/__tests__/MainList.test.tsx` | List render and click |
| `src/pages/__tests__/UsersPage.test.tsx` | Loading, data, cache panel, refresh |
| `src/pages/__tests__/BackendPage.test.tsx` | Auth tabs, login/register flow, CRUD |
| `src/pages/__tests__/LotteryPage.test.tsx` | Section labels, Redis keys, state machine |
| `src/services/__tests__/users.service.test.ts` | Fetch, cache, refresh, error paths |
| `src/services/__tests__/backend.service.test.ts` | All REST calls and error paths |
| `src/services/__tests__/users.transform.test.ts` | Department grouping transform |

---

## Docker (single image)

The production image runs nginx + Node.js in one container via supervisord:

```bash
docker build -t frontend-assignment .
docker run -p 80:80 -p 50051:50051 frontend-assignment
```

nginx serves the React static files and proxies API routes internally.

---

## CI/CD (GKE)

Push to `main` or `dev` → GitHub Actions runs two jobs:

**Job 1 — Test & SonarQube scan:**
1. `npm ci` and `npm run test:coverage` — fails if any threshold is missed
2. SonarQube scan via `SonarSource/sonarqube-scan-action@v6`
3. Quality Gate check — fails build if gate is RED

**Job 2 — Build & deploy** (runs only if Job 1 passes):
1. Builds with `docker buildx --platform linux/amd64`
2. Pushes to `asia-southeast1-docker.pkg.dev/agentassistant-496719/assignment/frontend-assignment`
3. Rolls out to GKE namespace `assignment`

**Required GitHub secrets:**

| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | GCP project ID |
| `GKE_CLUSTER` | GKE cluster name |
| `GKE_ZONE` | GKE cluster zone |
| `WIF_PROVIDER` | Workload Identity Federation provider |
| `SONARQUBE_URL` | `http://<sonarqube-external-ip>:9000` |
| `SONARQUBE_TOKEN` | SonarQube analysis token |

**Live URL:** `http://8.233.137.90`

---

# Original Assignment

## 1. Auto Delete Todo List

```json
[
  { "type": "Fruit",     "name": "Apple"      },
  { "type": "Vegetable", "name": "Broccoli"   },
  { "type": "Vegetable", "name": "Mushroom"   },
  { "type": "Fruit",     "name": "Banana"     },
  { "type": "Vegetable", "name": "Tomato"     },
  { "type": "Fruit",     "name": "Orange"     },
  { "type": "Fruit",     "name": "Mango"      },
  { "type": "Fruit",     "name": "Pineapple"  },
  { "type": "Vegetable", "name": "Cucumber"   },
  { "type": "Fruit",     "name": "Watermelon" },
  { "type": "Vegetable", "name": "Carrot"     }
]
```

Please make a todo list that:
- Has a list of clickable buttons
- Each button will be moved into its own column separated by type
- Once moved, each button will have 5 seconds on the screen and then will be moved back to the bottom of the main list
- If click on the right column (Fruit/Vegetable) the item must go back to the bottom of the left column (list) immediately

[Video Link](https://drive.google.com/file/d/170AYx0lOXs4DLyZiPGGIgmQpFhwTKNih/view?usp=sharing)

## 2. Create data from API *(OPTIONAL)*

API from <https://dummyjson.com/users>

- Your project must use Typescript, Typescript module, and HTTP framework (GRPC is plus)
- Transforms JSON data from API to new data groupBy department
- We encourage you to write tests, which we will give you some extra score
- We will give you an extra score if you focus on performance

```json
{
  "[Department]": {
    "male": 1,
    "female": 1,
    "ageRange": "XX-XX",
    "hair": {
      "Black": 1,
      "Blond": 1,
      "Chestnut": 1,
      "Brown": 1
    },
    "addressUser": {
      "TerryMedhurst": "XXXXX"
    }
  }
}
```
