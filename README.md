# KDG Coding Interview

C# ASP.NET Core API + React/TypeScript + PostgreSQL — all Docker-first, TDD from the start.

## Quick Start

```bash
docker compose up -d
```

```bash
bash scripts/seed.sh
```

| Service | URL |
|---------|-----|
| Client  | http://localhost:3000 |
| API     | http://localhost:5000/api/customers |
| Swagger | http://localhost:5000/swagger |

## Interview Workflow

### Phase 0 — Paste the assignment

Save interview specs into the `context/` folder so Claude can read them:

```bash
# paste or copy the assignment file
cp ~/Downloads/assignment.pdf context/
# or create a markdown file
nano context/assignment.md
```

### Phase 1 — Decompose the project

```
/deep-project
```

Breaks the assignment into well-scoped planning units.

### Phase 2 — Plan the implementation

```
/deep-plan
```

Creates a detailed, TDD-oriented implementation plan with sections.

### Phase 3 — Implement with TDD

```
/deep-implement
```

Executes the plan section-by-section: red-green-refactor, code review, git commits.

### Phase 4 — Run all tests

```bash
# Backend tests
docker compose --profile test run --rm api-tests

# Frontend tests
docker compose --profile test run --rm client-tests

# Load test (10 VUs, 30s)
docker compose --profile test run --rm k6 run /scripts/script.js
```

### Phase 5 — Ship it

```
/ship
```

Commits, merges to main, and pushes.

## Useful Commands

```bash
# Rebuild after Dockerfile changes
docker compose build

# View logs
docker compose logs -f api
docker compose logs -f client

# Reset database (wipe + recreate)
docker compose down -v && docker compose up -d

# Re-seed after reset
bash scripts/seed.sh

# Open a GitHub issue
export $(grep GITHUB_TOKEN .env | xargs) && gh issue create

# Check running containers
docker compose ps
```
