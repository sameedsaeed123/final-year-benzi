# Documentation

Rules for project documentation. If someone can't set up and understand your project in 15 minutes by reading the docs — the docs have failed.

All numeric values and specific tool names in this file are [DEFAULT] — adjust per project and stack.

---

## README.md (Recommended for Every Project)

### Template

```markdown
# Project Name

One-line description of what this project does.

## Tech Stack

List your project's key technologies (frontend, backend, database, etc.)

## Prerequisites

List required runtimes, tools, and services with minimum versions.

## Getting Started

### 1. Clone the repository

  git clone <repository-url>
  cd <project-name>

### 2. Install dependencies

  <your package manager's install command>

### 3. Set up environment

  cp .env.example .env
  # Edit .env with your local values

### 4. Start required services (if applicable)

  # Show how to start database, cache, etc. (Docker or local)

### 5. Seed development data (optional)

  <your seed command>

### 6. Start the development server

  <your dev server command>

## Available Scripts

| Command | Description |
|---------|-------------|
| (list your project's actual commands here) |

## Project Structure

  (show your project's actual folder layout — see project-structure.md for guidance)

## API Documentation

Link to API docs (auto-generated or separate file).

## Contributing

See CONTRIBUTING.md for guidelines.

## License

Your license
```

### Rules

- README is the FIRST file a new developer reads — it must be accurate and complete
- If any setup step fails when following the README — the README is broken (treat as a bug)
- Update README whenever setup process changes (dependency added, env var added, etc.)
- Include ACTUAL commands, not "install the dependencies" without showing how
- Include troubleshooting section if there are common setup issues

---

## CONTRIBUTING.md (IF working in a team)

### Template

```markdown
# Contributing

## Development Setup

Follow the README.md for initial setup.

## Branch Convention

See git-workflow.md for branching and commit rules.

## Pull Request Process

1. Create a feature branch from develop (or main)
2. Make your changes following the coding rules
3. Run linter and tests locally
4. Push and create a PR with the template filled out
5. Request review from at least one team member
6. Address all review comments
7. Squash merge after approval

## Code Style

- Follow naming.md for all naming
- Follow code-formatting.md for formatting
- Linter must pass with zero errors
- No `any` types without justification comment

## Commit Messages

Format: {type}: {description}

See git-workflow.md for details and examples.
```

---

## CHANGELOG.md (Recommended for all projects)

### Format: Keep a Changelog

```markdown
# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

### Added
- New module integration (#45)

### Fixed
- Rate limiting not resetting after timeout (#52)

## [1.2.0] - 2024-01-15

### Added
- Added export capability
- Enhanced data display
- Added configuration option

### Changed
- Upgraded framework to latest version
- Improved data processing performance

### Fixed
- Session expiry not redirecting properly (#38)
- Pagination returning incorrect total count (#41)

### Security
- Updated auth library to patch CVE-2024-XXXX

## [1.1.0] - 2024-01-01

### Added
- Permission system
- Resource management module
```

### Rules

- Update CHANGELOG on every PR that adds, changes, or fixes something user-facing
- Use categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Link to issue/PR numbers
- Date format: YYYY-MM-DD
- Most recent version at the top
- Maintain an [Unreleased] section for work not yet tagged

---

## API Documentation

### Rules

- Every public API endpoint should be documented
- Documentation lives with the code (auto-generated preferred: Swagger/OpenAPI, JSDoc, Sphinx)
- For each endpoint, document:
  - HTTP method and path
  - Description of what it does
  - Authentication requirements
  - Required permissions
  - Request parameters (path, query, body) with types and validation rules
  - Response shape for success (with example)
  - Response shape for each error case (with status code)
  - Rate limits

### Example API Doc Entry

```markdown
## Create Resource

Creates a new resource record.

**Endpoint:** `POST /api/resources`

**Authentication:** Required

**Permissions:** `resources:create`

**Request Body:**

| Field       | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| name       | string | yes      | Display name (2-100 chars) |
| email      | string | yes      | Valid email, unique       |
| groupId    | string | yes      | Parent group ID           |
| type       | string | no       | Resource type             |

**Success Response:** `201 Created`

  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "group": { "id": "...", "name": "Team Alpha" },
    "createdAt": "2024-01-15T10:30:00Z"
  }

**Error Responses:**

| Status | Body                                             |
|--------|--------------------------------------------------|
| 400    | { "error": "Name is required." }                 |
| 401    | { "error": "Unauthorized" }                      |
| 403    | { "error": "You do not have permission..." }     |
| 409    | { "error": "A record with this email exists." }  |
```

---

## Architecture Documentation (docs/ folder)

### Recommended Documents

```
docs/
├── architecture.md        # High-level system architecture (with diagram)
├── api.md                 # API endpoint documentation (or link to Swagger)
├── database.md            # Database schema, associations, key queries
├── deployment.md          # How to deploy to each environment
└── decisions/             # Architecture Decision Records (ADRs)
    ├── 001-database-choice.md
    ├── 002-auth-strategy.md
    └── 003-realtime-approach.md
```

### Architecture Decision Records (ADRs)

When you make a significant technical decision, document it:

```markdown
# ADR-001: Database Choice

## Status: Accepted

## Context
Brief description of the problem and constraints.

## Decision
State the chosen technology/approach.

## Reasoning
- Why this option fits (list key reasons)
- Team familiarity, performance needs, data shape, etc.

## Alternatives Considered
- Option B: Why it was rejected
- Option C: Why it was rejected

## Consequences
- Trade-offs accepted
- Things to watch out for
- Operational considerations
```

---

## Code Comments (Rules)

### JSDoc / Docstrings for Public APIs

```
Every exported/public function, class, and type MUST have a doc comment (internal helpers follow the comment rules in `code-formatting.md`):

/**
 * Build a database query filter that scopes results to records
 * visible to the given actor based on their role and access level.
 *
 * @param actor - The authenticated user making the request
 * @param options - Additional filter options
 * @param options.includeInactive - Include inactive records (default: false)
 * @returns Filter object suitable for query execution
 * @throws {Error} If actor has no assigned scope
 */
export function buildScopedFilter(
  actor: VerifiedUser,
  options?: { includeInactive?: boolean },
): Record<string, unknown> { ... }
```

### When Comments Are Required

- **Public function signatures** — what it does, params, return value
- **Complex algorithms** — high-level approach explanation
- **Workarounds / hacks** — WHY it exists, link to issue, when to remove
- **Regex patterns** — what the pattern matches
- **Non-obvious business rules** — WHY this calculation works this way
- **TODOs** — with issue number and assignee: `// TODO(#123): migrate to new API by Q2`

### When Comments Are BANNED

- Narrating obvious code ("get the user", "return the result")
- Explaining what you changed ("updated this to fix the bug" — that belongs in the commit summary)
- Commented-out code (delete it; git has history)
- Divider comments (`// ============ SECTION ============` — restructure instead)

---

## Inline Documentation Style

```
REQUIRED: Explain WHY, not WHAT

// Cost 12 balances security with auth response time under 500ms on current hardware
const BCRYPT_ROUNDS = 12;

// Round to 2 decimals for display; intermediate math stays unrounded
const displayValue = Math.round(rawTotal * 100) / 100;

// Rate limited to 5/hour to prevent enumeration attacks (see security.md)
const SENSITIVE_ACTION_RATE_LIMIT = { max: 5, windowMs: 3600000 };
```

```
BANNED: Explain WHAT is obvious from reading the code

// Set bcrypt rounds to 12
const BCRYPT_ROUNDS = 12;

// Round the display value
const displayValue = Math.round(rawTotal * 100) / 100;

// Create rate limit config
const SENSITIVE_ACTION_RATE_LIMIT = { max: 5, windowMs: 3600000 };
```

---

## Documentation Maintenance

### Rules

1. **Treat docs as code** — review doc changes in PRs like code changes
2. **Update docs with code** — if you change a function's behavior, update its docstring in the same PR
3. **Dead docs are worse than no docs** — outdated documentation actively misleads; delete it if you can't maintain it
4. **Auto-generate where possible** — Swagger from route definitions, TypeDoc from JSDoc, etc.
5. **Test your README** — periodically do a fresh clone and follow the setup steps
6. **Version the docs** — API docs should be versioned alongside the API (v1 docs for v1 API)
