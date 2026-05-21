# Naming Conventions

## The Golden Rule

**Prefer full, descriptive words over abbreviations.** Standard industry abbreviations are fine (`id`, `url`, `api`, `dto`, `i18n`, `db`, `http`, `config`). If a custom name feels too long, rethink the abstraction rather than shortening the name.

---

## Casing Conventions

> **The principle:** Use your language ecosystem's standard naming convention and be 100% consistent. The rules below are the defaults for JS/TS/C-family languages. Other ecosystems follow their own standard (e.g., Python: `snake_case` for variables/functions, Go: `mixedCaps` without underscores, Ruby: `snake_case`). Whatever convention your language uses — apply it uniformly.

## Variable & Function Names

- **camelCase** for variables and functions `[DEFAULT — JS/TS/C-family]`
- **Verb-first** for functions that perform actions: `getUser`, `buildFilter`, `handleSubmit`, `validateEmail`
- **Boolean prefixes**: `is`, `has`, `can`, `should` — e.g. `isActive`, `hasPermission`, `canEdit`

---

## Types, Interfaces, Classes, Components

- **PascalCase** always: `UserCard`, `DataService`, `MainLayout` `[DEFAULT — JS/TS/C-family]`
- **No `I` prefix** on interfaces (prefer `User` over `IUser`). Exception: legacy codebases or ORMs that require it — in that case, be consistent across the whole project.

---

## Constants

- **SCREAMING_SNAKE_CASE**: `MAX_RETRIES`, `API_BASE_URL`, `SESSION_TIMEOUT_MS` `[DEFAULT — most languages]`
- Group related constants in a single file with section comments

---

## Files & Directories

- **Libraries/utilities**: camelCase — `userScope.ts`, `formatUtils.py`, `authHelpers.rb` `[DEFAULT — adapt casing to ecosystem]`
- **Components**: PascalCase — `UserCard.tsx`, `SearchForm.vue`, `MainLayout.svelte`
- **API routes/controllers**: camelCase by default (`authController.ts`). Use kebab-case only if the framework mandates it (e.g. file-based routing frameworks).
- **Models/entities**: PascalCase singular — `User.ts`, `Record.py`, `Event.rb`

---

## Directories — Universal Principle

**This rule applies to every project, every language, every framework.**

A directory name is a **noun** that describes what lives inside it. This section is written as a series of tests. Apply each test to every directory name you create or review. The tests work on any name — they are not a list of known bad names to match against.

### Casing by directory type

| Directory type | Convention |
|----------------|-----------|
| Feature / resource / domain | lowercase, kebab-case if multi-word |
| Utility / library | follow ecosystem convention (camelCase, snake_case, etc.) |
| Component folder | lowercase noun |
| Model / entity | singular noun, case per language |
| Framework route group | framework-mandated |

Framework conventions always take precedence over the defaults above — but within that constraint, all tests below still apply.

---

### Test 1 — The Stranger Test (applies to every directory, every language)

> *"Would a developer who has never seen this codebase know what lives in this folder — without opening it?"*

- **Yes** → name passes
- **No** → rename it

This is the root test. Every test below is a refinement of this one for specific failure modes.

---

### Test 2 — Content Test: Does the name describe data, or something else?

A directory name must describe the **data or resource** it contains — not an analogy, a metaphor, a UI concept, or how a user feels when they use it.

Ask: *"Is this name describing what the data IS — or describing something else?"*

- Describing **what the data is** → name passes
- Describing **an analogy, metaphor, user interaction, or UI concept** → rename to describe the data

> *Illustration (not exhaustive):* A folder named after a physical object (desk, shelf, board) when it contains domain records is using a metaphor. A folder named after a UI component (dropdown, modal, card) leaks presentation into structure. A folder named after a vague feeling or concept (live, main, general) tells you nothing about the data.

---

### Test 3 — Compound Name Test: Is at least one word domain-anchored?

When a directory name has two or more words, ask: *"Does at least one word name a specific domain concept that anchors the meaning — without requiring project knowledge?"*

- **Yes** → name passes
- **No — both words are generic** → rename; prepend or replace with a domain-specific word

> *Illustration:* Two generic words combined are still two generic words. The compound must be no vaguer than each word alone.

---

### Test 4 — Action Scope Test (page/UI routes only)

When a route performs an action (its directory name is a verb or verb phrase), ask: *"Does this action target one specific named resource?"*

- **No — the action is resource-agnostic** (applies to multiple resources, or has no specific target) → the route may live at the current level
- **Yes — the action targets one specific resource** → the route must be a sub-route of that resource's directory; it must not be floated to a parent level

**How to determine the resource:** look at what domain entities the page reads and mutates. The primary entity is the resource the page belongs to.

> *Illustration:* An action that only ever creates one specific type of record belongs under that record's route. An action that applies to the whole application (like global settings) has no single resource and may stay at a higher level.

---

### Test 5 — Sibling Independence Test

When adding a route that has siblings, ask: *"Is this name formed by taking a sibling's name and adding a qualifier (a suffix, adjective, or view-type word)?"*

- **No — the name stands on its own** → name passes
- **Yes — the name derives from a sibling's name** → the new route is a view or sub-feature of the sibling; make it a sub-route, not a sibling

This applies equally to files in the same directory.

> *Illustration:* A name that is a sibling's name plus a view-type qualifier (list, table, grid, board, panel, modal, card) is not independent — it is a variation. Variations live inside their parent, not beside it.

---

### Test 6 — Verb Ban Test (API routes only)

For every API path segment, ask: *"Is this word a verb, or does the handler perform the action this word names?"*

- **The word is purely a noun naming a resource** → passes
- **The word is a verb, or the handler performs that action** → banned; rename using a noun

**Homonym sub-test:** Some words are both valid nouns and common verbs (examples: order, archive, draft, schedule, rate, stream). For these, apply the intent test: does the handler perform the action the word names? If yes — even if the word can also be a noun — it is acting as a verb and is banned. Use the gerund form (`-ing`) or a different noun when the word is ambiguous.

> *Illustration:* HTTP methods carry the verb. The path segment carries only the resource name. If removing the HTTP method leaves a sentence fragment that still implies action, the segment is acting as a verb.

---

### Test 7 — Plural Test (API routes only)

For every API resource path segment, ask: *"Can more than one of this exist — even theoretically or historically?"*

- **Yes** → the segment must be **plural**
- **No — there is structurally only one per parent context** → singular is acceptable (singleton sub-resource)

A singleton sub-resource is one where no ID segment is needed because there is only ever one instance per parent. Apply this test mechanically — do not rely on whether the word "feels" singular or plural.

> *Illustration:* Even if only one instance is currently active, the question is whether more than one can exist in principle. If yes, use plural.

---

### Test 8 — Jargon Test

For every directory name that uses a technical term, ask: *"Would a domain expert — a person who knows the business problem but not the implementing technology — understand what this folder contains?"*

- **Yes** → name passes
- **No — the term is developer-only shorthand** → replace with the domain vocabulary term

**Exception:** If the technical term is the established vocabulary of the product itself (the product team uses it, not just the engineering team), the term is correct.

> *Illustration:* Developer terms borrowed from infrastructure, networking, or frameworks often fail this test when used as domain folder names. The domain vocabulary for the same concept is always preferred.

---

### Test 9 — Lifecycle and Variant Test

For every directory name, ask: *"Does any part of this name describe the file's or folder's status, version, or relationship to another folder rather than its contents?"*

- **No** → name passes
- **Yes** → banned; use version control for lifecycle, not naming

Patterns that always fail this test: version suffixes, copy/duplicate indicators, status words (old, new, backup, temp, draft, wip), numeric disambiguation, and letter suffixes implying a variant.

---

### Test 10 — Utility Organization Test

For every accepted utility folder (`lib`, `utils`, `helpers`, `services`, `hooks`, or language-equivalent), ask: *"Do the files inside cover more than two unrelated domains?"*

- **No** → structure is acceptable
- **Yes** → the folder is a grab-bag; split it into domain-named sub-folders

Accepting a utility folder name does not grant permission for unorganized contents. A grab-bag with an accepted name is still a grab-bag.

---

### Banned Filename Suffixes and Patterns

**The principle:** A filename must describe what the file IS, not its status, version, or relationship to another file. If a suffix reveals status/lifecycle rather than purpose, it is banned.

**Banned categories:**
- **Copy/duplicate indicators** — signals an unreviewed duplicate; use version control instead
- **Version indicators** — versions live in git, not filenames
- **Status indicators** (old, backup, draft, temp, wip) — dead code or incomplete work belongs on a branch, not committed
- **Numeric disambiguation** — if two files need a number to tell them apart, their names don't describe their purpose

**The test:** Would this suffix disappear if the file were the only version of itself? If yes, the suffix is lifecycle metadata and does not belong in the name.

Apply this test to every word and character in the name — not just known suffixes. Any part of a name that answers "when was this made?" or "how does this relate to another file?" rather than "what does this contain?" is lifecycle metadata.

When lifecycle metadata is removed, use version control for history, feature branches for work in progress, feature flags for experimental code, and deletion for dead code (git history preserves it).

### Every File Must Have a Clear Owner

A file is legitimate only if **all three** of the following are true:

1. **It is imported or executed somewhere** — it has at least one caller, route, or entry point that reaches it
2. **Its name describes its single responsibility** — someone reading the filename alone should know what it does
3. **Its location is correct per the project structure rules** — it lives where its type (component, util, model, route) says it should

A file that fails any of these three conditions is a candidate for deletion and must be removed in the next cleanup cycle.

---

## URL Naming — API vs Page Routes

This section covers both API endpoints and page/UI route URLs. The rules differ because their purposes differ: API URLs are machine-readable resource addresses; page URLs are human-readable navigation paths.

Apply the directory tests in § Directories — Universal Principle to every URL segment. The additional rules below are specific to URLs.

### API endpoint URLs

> Full rules in `api-design.md`. This is the naming summary.

**Rules — apply to every segment of every API path:**

1. Every path segment must be a noun. HTTP methods carry the verb — the path never does.
2. Collection resource segments must be plural. Apply Test 7 (Plural Test) to every segment.
3. Multi-word segments use kebab-case.
4. Nested resources express relationships: `/{resource}/{id}/{sub-resource}`.
5. A word that is both a noun and a verb must pass Test 6 (Homonym Sub-test) — if the handler performs the action the word names, the segment is banned.
6. Exception for operation sub-paths: see `api-design.md § URL Structure` for the narrow case.

### Page / UI route URLs

Page routes are navigational — they describe where the user is. Verbs are allowed only when the page has no standalone resource identity.

**Rules — apply to every segment of every page URL:**

1. Resource pages use nouns. Apply Test 1 (Stranger Test) and Test 2 (Content Test).
2. Action pages (forms, wizards, flows) may use verbs — but only when the action has no single specific resource. Apply Test 4 (Action Scope Test): if the action targets one named resource, the segment must be a sub-route of that resource.
3. Never use camelCase or PascalCase in any URL segment, regardless of framework.
4. Multi-word segments use kebab-case.
5. Apply Test 5 (Sibling Independence Test) across all siblings at each level.

---

## Banned Abbreviations

**The principle:** There is no fixed list of banned names. Apply the test below to every name you write. The test catches all cases without enumeration.

### The Test

Ask: *"Would someone unfamiliar with this codebase immediately know what this name refers to?"*

- If **yes** → name is fine
- If **no** → use the full word

This test applies equally to variables, functions, parameters, filenames, and directory names. It is not limited to "abbreviations" in the traditional sense — any name that requires inside knowledge to interpret fails, regardless of whether it is technically a shortened word.

### Rules

- **Never truncate a word** to save characters. If the full word is long, the abstraction may need rethinking — but never shorten the name.
- **Never use generic placeholders** as final names. A name is generic if it describes the data's type or shape rather than the domain concept it represents. Name the concept.
- **Name the domain concept, not the data type.** If replacing the name with its data type (array, object, string, number) does not change its meaning, the name is describing the type — rename it to describe the concept.

### Exceptions (Stack-Idiomatic Abbreviations)

Some abbreviations are universally understood within a specific ecosystem. These are allowed **only** in their idiomatic context:

- `ctx` — Go context, middleware context parameters
- `err` — Go error returns, error-first callback patterns
- `req` / `res` — framework-provided handler parameters (Express, Hono, etc.) where the signature is conventional
- `db` — database client instance (universally understood)
- `id` — identifier (universally understood)
- `t` — i18n translation function (universally understood in internationalization contexts)
- `url` / `api` — standard acronyms (not abbreviations)

**If your stack has an idiomatic abbreviation that every developer in that ecosystem recognizes instantly, it is allowed in that specific context only.** Do not invent new abbreviations or extend these beyond their idiomatic use.

---

## Single-Letter Variables — Complete Rule

**Single-letter names are banned in business logic** (see Allowed Exceptions below and § Stack-Idiomatic Abbreviations for multi-letter short names like `id`, `db`, `ctx`). The ban applies uniformly to:

| Location | Banned | Required |
|----------|--------|----------|
| Callback parameters | `.map((u) => ...)` | `.map((user) => ...)` |
| `for…of` loop variables | `for (const m of memberships)` | `for (const membership of memberships)` |
| **Function parameters** | `function dateInTz(y, mo, d, h, mi, s, tz)` | `function dateInTz(year, month, day, hour, minute, second, tz)` |
| **Variable declarations** | `const s = await SystemSettings.findOne(...)` | `const settings = await SystemSettings.findOne(...)` |
| **Destructuring** | `const { d, m, s } = data` | `const { date, month, status } = data` |

```
BANNED — callbacks:
  users.map((u) => ...)
  items.forEach((i) => ...)

BANNED — for…of:
  for (const m of memberships)

BANNED — function parameters:
  function dateParts(d: Date, tz: string) { ... }
  function dateInTz(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string) { ... }

BANNED — variable declarations:
  const s = await SystemSettings.findOne(...)
  const d = new Date()

REQUIRED:
  users.map((user) => ...)
  for (const membership of memberships)
  function dateParts(date: Date, tz: string) { ... }
  function dateInTz(year: number, month: number, day: number, hour: number, minute: number, second: number, tz: string) { ... }
  const settings = await SystemSettings.findOne(...)
```

### Allowed Exceptions

The following single-letter names are **explicitly allowed**:

| Name | Allowed context |
|------|----------------|
| `_` | Any unused parameter or variable |
| `i`, `j` | Numeric indices in `for` loops or shimmer/skeleton placeholder arrays |
| `x`, `y`, `z` | Coordinate or pure math parameters |
| `e` | Event handler parameter where the framework convention uses it (DOM events, etc.) |

**Everything not in the exceptions table above is banned.** Don't look for a list of banned letters — if it's a single character and not in the exceptions, it's wrong. The principle catches all cases without enumeration.

### What the Audit Must Check

Scan for single-letter names in **every position where a name is declared** — not just one specific syntax. If a name is being given to a value, it must be descriptive:

- Callback / closure parameters (any higher-order function, not just specific ones)
- Loop variables (`for...of`, `for...in`, traditional `for`)
- Function parameters (named functions, arrow functions, methods)
- Variable declarations (`const`, `let`, `var`, or language equivalent)
- Destructuring assignments

---

## Destructuring

```
BANNED:
  const { d, m, s } = data;

REQUIRED:
  const { category, membership, status } = data;
```

---

## Database Fields vs API Response Fields

> Full database naming rules in `database.md`. This is the naming summary.

**Principle:** Pick one convention per layer and be consistent. Never expose raw internal field names in API responses.

[REFERENCE] Common implementation (typical defaults; not exhaustive or mandatory):

- Internal DB fields: follow the database's convention (snake_case for SQL, camelCase for NoSQL — adapt to your stack)
- API response fields: use one consistent casing convention across all endpoints `[DEFAULT: camelCase]`
- Always use `id` (not `_id` or other internal identifiers) in API responses — map at the boundary, never expose raw DB field names
