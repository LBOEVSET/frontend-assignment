# Frontend Assignment — Implementation Notes

> Original assignment requirements are preserved below.

## Solution Overview

### Part 1 — Auto-Delete Todo List

React + TypeScript (Vite). Core logic lives in `src/hooks/useTodoList.ts`:

- State: `mainList` (left column) and a `Map<id, ColumnItem>` for items currently in columns
- `moveToColumn(item)` — removes from list, adds to column, starts `setTimeout(5000)`
- `returnToMain(item)` — clears the timer via a `useRef` map, removes from column, appends to list
- Countdown bar: pure CSS `scaleX` animation keyed on `addedAt` timestamp — no `setInterval`

### Part 2 — Users by Department

`src/services/users.service.ts` fetches all users from `https://dummyjson.com/users` in parallel pages and groups them by department.

- **Server-side cache** (1 hour TTL) in the TypeScript Express server — fast repeat requests
- **`?force=true`** query param invalidates the cache for a fresh fetch
- API response includes cache metadata: `responseTime`, `isCached`, `cacheAge`
- Frontend shows a toggleable cache info panel and a "Fetch fresh data" button with tooltip
- **gRPC** endpoint also available on port `50051` via `DepartmentSummaryService.GetSummary`

### Part 3 — Backend Assignment Tab

The same React app includes a third tab that connects to the Go backend (User Management API):

- Login / Register auth flow → JWT stored in component state
- Full user CRUD: list, create, edit, delete
- Proxied through nginx (`/api/v1/` → `http://backend-challenge:8080`) in production

---

## Architecture

```
src/
  components/       ← TodoApp, ColumnList, etc.
  hooks/            ← useTodoList (core todo logic)
  pages/
    UsersPage.tsx   ← Department summary UI
    BackendPage.tsx ← Backend API UI (auth + CRUD)
  services/
    users.service.ts    ← dummyjson fetch + cache
    backend.service.ts  ← Go backend REST client
  types/            ← Shared TypeScript interfaces

server/
  index.ts          ← Express API (:3001) + gRPC server (:50051)
  proto/users.proto ← gRPC service definition
```

---

## Local Development

**Prerequisites:** Node 20+, Go backend running on `:8080` (optional for tab 3)

```bash
npm install
npm run dev     # React on :5173, Express API on :3001
```

Vite proxies:
- `/api/users/*` → `http://localhost:3001`
- `/api/v1/*` → `http://localhost:8080` (default) or override via `BACKEND_URL`

To point the proxy at the live GKE backend instead:
```bash
BACKEND_URL=http://8.233.137.90 npm run dev
```

No `.env` file needed — `BACKEND_URL` is not sensitive and defaults to `localhost:8080` in `vite.config.ts`.

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

Push to `main` or `dev` → GitHub Actions:
1. Builds with `docker buildx --platform linux/amd64`
2. Pushes to `asia-southeast1-docker.pkg.dev/agentassistant-496719/assignment/frontend-assignment`
3. Rolls out to GKE namespace `assignment`

**Required GitHub secrets:** `GCP_PROJECT_ID`, `GKE_CLUSTER`, `GKE_ZONE`, `WIF_PROVIDER`

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
