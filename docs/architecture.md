# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components focused on loading, empty, error, and accessible content states; use the shared API client for all relative `/api` requests and keep data fetching in the capability components.
- Logic tier decision: Keep HTTP validation and status-code mapping in the Express routes, and keep persistence and capability calculations in `octofitService.ts`; return deliberate 4xx responses for malformed IDs, missing resources, and invalid payloads.
- Data tier decision: Use Mongoose schemas as the source of truth for required fields, references, defaults, and value constraints; keep representative, idempotent seed data in `src/scripts/seed.ts`.
- Activity tracking approach: Validate the referenced user and team before creating an activity, calculate points in the service layer from the submitted type and minutes, and persist the activity with its references and `occurredAt` timestamp.
- Team management approach: Validate a non-empty team name at the API boundary, create teams with a mascot and member references, and populate members when listing teams.
- Leaderboard approach: Aggregate activity points by team, join the totals to teams, sort descending by total points, and assign 1-based ranks in the service response.
- Workout suggestions approach: Find the user by email, use the user's goal and recent activity to choose and order seeded workout suggestions, include a human-readable reason, and return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — failures indicate missing Mongoose validation, relationships, defaults, or seed coverage.
- API command: `npm run test:api --prefix octofit-tracker/backend` — failures indicate incorrect route validation, status codes, persistence behavior, aggregation, or workout recommendation logic.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — failures indicate incorrect API usage, rendering, routing, or loading, empty, and accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — failures indicate TypeScript errors in the logic or data tiers.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — failures indicate TypeScript, bundling, or integration errors in the presentation tier.

Implement and rerun the checks in dependency order: data tests, API tests and backend build, then frontend tests and frontend build. Run the full exercise validation suite after all tier-specific checks pass.
