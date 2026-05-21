# Universal Coding Rulebook — Read This Before Writing Any Code

These rules exist so that every project — or any AI agent — follows the exact same patterns, structure, and quality standards. The code should look and feel like it came from the same developer, regardless of stack, platform, or domain.

**The rules describe HOW to structure code, not WHAT product to build.**

---

## Which Files to Read

**Not every file applies to every project.** Read the "Always Apply" files on every task. Read the feature-specific files only when the project has that feature.

### ALWAYS Apply (Every Project)

These define your coding DNA — they apply even if the project is a single-page calculator.

| File | What It Covers |
|------|---------------|
| `naming.md` | Variable, function, file, and API naming conventions |
| `code-patterns.md` | Structural blueprints: function anatomy, component anatomy, handler anatomy, error handling, async/concurrency, conditionals, shorthand operators, conciseness, declaration sorting order |
| `code-formatting.md` | Indentation, line length, imports, linting, comments |
| `project-structure.md` | Folder layouts for web, mobile, API, desktop, CLI, monorepo |
| `git-workflow.md` | Branch naming, commit format, PR process, releases |
| `maintenance.md` | Adding features, removing legacy, cleanup routines, dependency updates, technical debt, refactoring |
| `security.md` | Security rules (apply relevant sections based on what the project touches) |
| `testing.md` | Test pyramid, naming, coverage, mocking, CI integration |
| `devops.md` | Environment setup, Docker, CI/CD, deployment, secrets |
| `documentation.md` | README, CHANGELOG, API docs, ADRs, code comments |

### Apply ONLY When the Feature Exists

If the project has no real-time features, ignore `realtime.md`. If there's no file upload, ignore `file-media.md`. Don't add complexity for features that don't exist.

| File | Applies When Your Project Has... |
|------|----------------------------------|
| `api-design.md` | A backend API (REST, GraphQL, RPC) |
| `frontend.md` | A user interface (web or desktop renderer) |
| `database.md` | A database (SQL or NoSQL) |
| `realtime.md` | Real-time data synchronization, presence, or any WebSocket/SSE feature |
| `ui-design-system.md` | A visual user interface |
| `mobile.md` | A mobile app (React Native, Flutter, native) |
| `desktop-cli.md` | A desktop app (Electron, Tauri) or CLI tool |
| `logging.md` | A deployed backend service |
| `internationalization.md` | Multi-language support or users in multiple regions |
| `outbound-email.md` | Email sending or multi-channel outbound alerts |
| `search-filtering.md` | Searchable lists or data tables |
| `state-machines.md` | Domain entities with lifecycle states |
| `caching.md` | Performance-sensitive data or expensive queries |
| `file-media.md` | File upload, image handling, or media processing |

---

## How to Read the Rule Files

The rulebook contains three types of content:

| Label | Meaning |
|---|---|
| **(unlabeled)** | **CODING STANDARD** — same pattern every project, every feature, every developer. Follow it. |
| **`[DEFAULT]`** | **Configurable starting point** — use it unless the project specifies otherwise. |
| **`[REFERENCE]`** | **Common features checklist** — NOT a rule. Just a reminder of what's typical. You decide what to build. |

| Rule Language | What It Actually Means |
|---|---|
| **MUST / ALWAYS / REQUIRED** | This is the default. Follow it unless you have a documented reason not to. |
| **NEVER / BANNED** | Don't do this unless the alternative is worse AND you document why. |

**Override rule:** Any rule can be overridden if you document why. The goal is consistent, intentional decisions.

**Key insight:** If you're building an UNKNOWN feature not covered by any rule file, the coding STANDARDS still apply — function anatomy, naming, file placement, error handling. You don't need a dedicated rule file for every feature; you just need the universal patterns.

---

## Mandatory Pre-Work

Before starting any task, read:

- `naming.md` — especially § Banned Abbreviations and § Single-Letter Variables
- `code-patterns.md` — especially § Guard Clauses, § Shorthand Conditional Operators, § Code Conciseness & Consolidation, and § Declaration & Sorting Order
- Any other file relevant to the task type:
  - API work → `api-design.md`
  - UI work → `frontend.md` + `ui-design-system.md`
  - Database work → `database.md`
  - New feature → `project-structure.md` + `maintenance.md` § Pre-Implementation Checklist

**Starting a new project? Read in this sequence:**
1. `project-structure.md` — set up the folder structure
2. `naming.md` — establish naming conventions
3. `code-patterns.md` — learn the exact blueprints
4. `code-formatting.md` — configure linter and formatter
5. `git-workflow.md` — set up branches and commit format
6. `maintenance.md` — understand how to add features and keep code clean
7. Then read the feature-specific rules for whatever you're building

---

## Per-Edit Checklist

Run this on EVERY line you write or touch — not just the line you're fixing, but every line in the function/component you're editing.

### Naming

- Any single-letter variable, parameter, or callback argument?
  - **Banned** unless it's in the allowed set: `_` for unused params, `i`/`j` for loop indices, `x`/`y`/`z` for coordinates/math, `e` for event handler params.
  - Standard industry abbreviations (`id`, `db`, `url`, `api`) and stack-idiomatic short names (`ctx`, `err`, `req`/`res`) are allowed in their conventional context — see `naming.md` § Exceptions.
- Any name that's a truncated word or generic placeholder? (Apply the test: would someone unfamiliar with this codebase immediately know what it refers to?)
  - If no → use the full domain-specific word. See `naming.md` § Banned Abbreviations for the principle and exceptions.
- Loop variable named generically? (`item`, `element`, `entry`)
  - Name it by what the collection contains: `users.map((user) => ...)` not `users.map((item) => ...)`
- Creating or renaming a directory?
  - Run all 10 directory tests in `naming.md` § Directories — Universal Principle against the name.
  - The tests are: Stranger Test → Content Test → Compound Name Test → Action Scope Test → Sibling Independence Test → Verb Ban Test → Plural Test → Jargon Test → Lifecycle/Variant Test → Utility Organization Test.
  - Every test is a question you ask about the name — not a list of known bad names to match against.
- Adding or modifying an API URL path?
  - Apply the same 10 directory tests to every segment.
  - Additionally apply the URL-specific rules in `naming.md` § URL Naming — API vs Page Routes and `api-design.md § URL Structure`.

### Shorthand Operators (code-patterns.md § 2)

- Chained null/existence checks before accessing a property? → Use your language's safe-navigation operator (JS/TS: `x?.y?.z`, Ruby: `x&.y`, Kotlin/Swift: `x?.y`, C#: `x?.y`)
- Null/undefined check then assignment? → Use your language's default-value operator (JS/TS: `x ?? fallback`, Python: `x or fallback`, C#: `x ?? fallback`, Ruby: `x || fallback`)
- `let result; if (condition) { result = valueA; } else { result = valueB; }` → Replace with conditional expression (JS/TS: `const result = condition ? valueA : valueB;`, Python: `result = valueA if condition else valueB`)
- Any conditional that assigns or returns a value using if/else? → Use a conditional expression
- Nested existence-check chains reaching 3+ deep? → Use safe-navigation chaining

### Guard Clauses (code-patterns.md § 2)

- Is the function wrapped in a big if/else? → Invert the condition, return early, remove the else
- Is there an `else` after a `return`? → Remove the else block (the code after the if IS the else)
- Are there 3+ levels of nesting? → Extract guard clauses or helper functions

### Structure & Sorting Order (code-patterns.md § 1, § 5, § 6, § 14)

- Functions: guard clauses → data extraction → core logic → return?
- API handlers: authenticate → authorize → parse → validate → execute → side effects → respond?
- Components: external dependencies → refs → state → derived values → data fetching → side effects → handlers → early returns → render?
- File-level: imports → types → constants → exported functions → internal helpers?
- Interface/type properties: identifiers → primary fields → relationships → status/flags → metadata → optional?
- No magic numbers? → Extract to named constant in a dedicated constants module
- No await/async call inside a loop? → Parallelize with your language's batch concurrency idiom
- Catch block handles the error? → Log with structured logger, return user-safe message
- Any declaration in the wrong position? → Move it to the correct group per § 14

### Conciseness (code-patterns.md § 13)

- Is this file < 80 lines AND only imported by one other file? → Consider merging into the consumer
- Does the file name still match what the file does? → Rename if not
- Is there a wrapper/abstraction with only one call site? → Inline it
- Are there 2-3 small sibling files in this folder serving the same domain? → Merge into one
- Any generic filename like `helpers.ts`, `utils2.ts`, `misc.ts`? → Rename to describe the domain

---

## What NOT to Do

- **Don't skip the checklist** because "it's a small change" — small changes accumulate into inconsistent code
- **Don't add comments that narrate the obvious** — no `// get the user`, `// return the response`
- **Don't create a new file for every small function** — group by domain, check if it belongs in an existing file first
- **Don't use type escape hatches** (TS: `any`, Python: untyped `dict`/`Any`, Go: `interface{}`) without a justification comment
- **Don't leave debug logging** (`console.log`, `print()`, `fmt.Println` used for debugging) in committed code
- **Don't mix patterns** — if the codebase uses one approach, follow it (don't introduce a second way)
