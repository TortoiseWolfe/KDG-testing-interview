# KDG Coding Interview Project

## Stack
- **API**: C# ASP.NET Core 8 with Entity Framework Core + PostgreSQL 16
- **Client**: React 19, TypeScript, Vite
- **Infrastructure**: Docker Compose (all services)

## Rules

### Docker-first
No local SDKs installed. ALL commands run through Docker:
```bash
docker compose up -d          # start stack
docker compose build          # rebuild after Dockerfile changes
docker compose logs -f api    # view logs
```

### Git workflow
- **Never commit directly to main.** Always use feature branches.
- **Never merge to main locally.** Use PRs for all merges to main.
- `/ship` must: commit, push the feature branch, then open a PR via `gh pr create`.
- After PR is approved and merged on GitHub, delete the local branch.
- Conventional commits: feat/fix/docs/refactor/test/chore

### Interview specs
Paste assignment files into `context/` so Claude can read them.

## URLs
| Service | URL |
|---------|-----|
| Client  | http://localhost:3000 |
| API     | http://localhost:5000/api/customers |
| Swagger | http://localhost:5000/swagger |

## Test Commands
```bash
# Backend (xUnit)
docker compose --profile test run --rm api-tests

# Frontend (Vitest)
docker compose --profile test run --rm client-tests

# Load test (k6 — 10 VUs, 30s)
docker compose --profile test run --rm k6 run /scripts/script.js
```

## Key Paths
```
compose.yaml                          # all services
server/Dockerfile                     # .NET multi-stage (base/dev/test)
server/src/KdgApi/                    # API source
server/tests/KdgApi.Tests/            # xUnit tests
client/Dockerfile                     # Node multi-stage (base/deps/dev/test)
client/src/components/                # React components
client/src/components/__tests__/      # Vitest tests
context/                              # interview specs go here
scripts/seed.sh                       # seed 100 customers
loadtest/script.js                    # k6 load test
```

## Seed Data
```bash
bash scripts/seed.sh                  # 100 realistic customers
docker compose down -v && docker compose up -d  # reset DB if needed
```
