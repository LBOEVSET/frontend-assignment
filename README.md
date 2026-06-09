# Frontend Assignment — Implementation Notes

> Original assignment requirements are preserved below.

## Solution Overview

### Part 1 — Auto-Delete Todo List

React + TypeScript (Vite). Core logic lives in `src/hooks/useTodoList.ts`:

- State: `mainList` (left column) and a `Map<id, ColumnItem>` for items currently in columns
- `moveToColumn(item)` — removes from list, adds to column, starts `setTimeout(5000)`
- `returnToMain(item)` — clears the timer via a `useRef` map, removes from column, appends to list
- Countdown bar: pure CSS `scaleX` animation keyed on `addedAt` timestamp — no `setInterval`

### Part 2 (Optional) — Users by Department

`src/services/users.service.ts` exports two functions:
- `fetchUsersByDepartment()` — fetches `https://dummyjson.com/users?limit=0` and calls the transformer
- `groupByDepartment(users)` — pure function, easily unit-testable without network

## Local development

```bash
npm install
npm run dev     # http://localhost:5173
```

## Docker

```bash
docker build -t frontend-assignment .
docker run -p 8080:80 frontend-assignment
```

## CI/CD (GKE)

Push to `main` → GitHub Actions builds & pushes to `asia-southeast1-docker.pkg.dev/agentassistant-496719/assignment/frontend-assignment`, then rolls out to GKE namespace `assignment`.

Required GitHub secrets: `GCP_PROJECT_ID`, `GKE_CLUSTER`, `GKE_ZONE`, `WIF_PROVIDER`.

---

# Assignment

## 1. Auto Delete Todo List

```
    [
        {
            type: 'Fruit',
            name: 'Apple',
        },
        {
            type: 'Vegetable',
            name: 'Broccoli',
        },
        {
            type: 'Vegetable',
            name: 'Mushroom',
        },
        {
            type: 'Fruit',
            name: 'Banana',
        },
        {
            type: 'Vegetable',
            name: 'Tomato',
        },
        {
            type: 'Fruit',
            name: 'Orange',
        },
        {
            type: 'Fruit',
            name: 'Mango',
        },
        {
            type: 'Fruit',
            name: 'Pineapple',
        },
        {
            type: 'Vegetable',
            name: 'Cucumber',
        },
        {
            type: 'Fruit',
            name: 'Watermelon',
        },
        {
            type: 'Vegetable',
            name: 'Carrot',
        },
    ]
```

Please make a todo list that
- Have a list of clickable buttons.
- Each button will be moved into its own column separated by type.
- Once moved, each button will have 5 seconds on the screen and then will be moved back to the bottom of the main list.
- If click on the right column (Fruit/Vegetable) the item must go back to the bottom of the left column (list) immediately.

> [!CAUTION]
> Please host the test on a hosting service and send us the link.

See example in the link below
[Video Link](https://drive.google.com/file/d/170AYx0lOXs4DLyZiPGGIgmQpFhwTKNih/view?usp=sharing)

Please do your best to show your best solution
we are looking for
1. Answer the need of question
2. Clean code easy to read

Bonus: if you have multiple solutions we could discuss those theories in our interview (no need to submit multiple versions, just send us the best one you think.)

## 2. Create data from API *(OPTIONAL)*

API from <https://dummyjson.com/users>

- Your project must use Typescript, Typescript module, and HTTP framework (GRPC is plus)
- Tranforms JSON data from API to new data groupBy department
- We encourage you to write tests, which we will give you some extra score
- We will give you an extra score if you focus on performance.

--- sample response ---

```json
    {
        [Department]: {
            "male": 1,                      // ---> Male Count Summary
            "female": 1,                    // ---> Female Count Summary
            "ageRange": "XX-XX",            // ---> Range
            "hair": {                       // ---> "Color": Color Summary
                "Black": 1,                
                "Blond": 1,
                "Chestnut": 1,
                "Brown": 1
            },
            "addressUser": {                // ---> "firstNamelastName": postalCode
                "TerryMedhurst": "XXXXX",
            }
        }
    }, 
    ...
```
