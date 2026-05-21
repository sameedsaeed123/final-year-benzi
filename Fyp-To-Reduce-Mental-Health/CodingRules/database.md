# Database Patterns

Coding patterns for database design and usage. IF your project has a database, apply these patterns. Applies to SQL (PostgreSQL, MySQL) and NoSQL (MongoDB, DynamoDB) alike.

> All numeric values in this file are `[DEFAULT]` — adjust per project.

---

## Schema Design

- **One entity per file** — User model in user file, Record model in record file
- **Timestamps always** — every table/collection gets `createdAt` and `updatedAt`
- **Soft delete** where appropriate — use `deletedAt: Date | null` (preferred: nullable timestamp is unambiguous and supports audit). Reserve `isActive` for business status (active/suspended entity), NOT for deletion.
- **Consistent ID naming** — `id` or `_id` (pick one per project, never mix)
- **References over embedding** for relational data (unless read performance demands embedding)

---

## Naming (Database Level)

**Principle:** Pick one naming convention per database technology and be consistent. Document the convention in the project README.

[REFERENCE] Common database naming conventions:

- **SQL tables**: snake_case plural (`users`, `list_items`, `config_options`)
- **SQL columns**: snake_case (`first_name`, `created_at`, `is_active`)
- **NoSQL collections**: PascalCase singular or camelCase plural (match ORM convention)
- **NoSQL fields**: camelCase (`firstName`, `createdAt`, `isActive`)
- **Foreign keys**: `{entity}_id` in SQL (`user_id`, `category_id`)
- **Junction tables**: `{entity1}_{entity2}` alphabetically (`roles_users`)

---

## Indexing

**Principle:** Index based on query patterns — every frequently-queried field or filter condition should have an appropriate index.

[REFERENCE] Common indexing patterns:

**Index fields used in frequent WHERE/filter clauses.** Prioritize by query frequency and table size. Rarely-used ad-hoc filters and small tables don't need indexes — over-indexing hurts write performance.

- Index foreign keys automatically
- Compound indexes for common multi-field queries (key sequence matters)
- Unique indexes for fields that must be unique (email, username, slug)
- Text indexes for search fields
- Avoid over-indexing (each index slows writes)

---

## Query Rules

- **Select only needed fields** for API responses — avoid `SELECT *` in production queries. `SELECT *` is acceptable for admin tools, migrations, and small tables during prototyping.
- **Paginate list queries** — never return unbounded results
- **Validate IDs** before querying (reject invalid format with 400, don't hit DB)
- **Use lean/plain objects** for API read responses (not full ORM instances)
- **Parallel queries** where possible — use your language's concurrency primitives (e.g. `Promise.all` in JS, `asyncio.gather` in Python, `errgroup` in Go) for independent reads
- **Avoid N+1** — use joins/populate/include, not loops with individual queries
- **Centralize relation patterns** — define reusable populate/include/join configurations in a shared module rather than repeating join logic in every handler

---

## Transactions

**Use transactions for any operation that writes to 2+ tables/collections.**

When to use:
- Creating an entity + its related records
- Multi-record atomic update (increment + decrement)
- Cascade operations (delete parent + children)
- Status changes that affect multiple records

Rules:
- Always rollback on failure (transactions handle this)
- Keep transactions short (don't do HTTP calls inside)
- Pass the transaction/session to all operations within it

---

## Migrations

- **Version-controlled** — migration files in source control
- **Reversible** — every migration has an up AND down
- **Atomic** — one logical change per migration file
- **Named descriptively** — `add_phone_to_users`, `create_records_table`
- **Never edit** a migration that's been applied (create a new one)

---

## Security

- **Never expose passwords** — exclude from all queries/responses
- **Never expose tokens** (reset tokens, API keys) in responses
- **Hash sensitive data** — passwords with a slow hash (bcrypt, argon2, or equivalent); tokens with a cryptographic hash before storage
- **Encrypt at rest** for PII where required by compliance
- **Parameterized queries** always — NEVER concatenate user input into queries (SQL injection)
- **Limit query depth** for GraphQL / nested populate (prevent resource exhaustion)

---

## Connection Singleton (Serverless / HMR-Safe)

In serverless environments or dev servers with hot module reloading, naive connection code creates duplicate connections on every request or reload. Use a singleton pattern:

```
// lib/db (or equivalent — adapt to your language/ORM)
function connectDB():
  → Check global/module-level cache for existing connection
  → If cached and connected → return cached
  → If no URI configured → throw immediately (don't silently fail)
  → Connect with explicit timeouts (per your driver's options)
  → Store promise/future in global cache (so concurrent calls share one connection attempt)
  → Return connection
```

- Cache the **connection promise** (not just the client) to prevent race conditions during startup
- In frameworks with HMR (hot module reloading), store the connection on a global/module-level variable so reloads don't create new pools
- Configure your ORM/driver to fail fast when disconnected (rather than silently queuing commands)
- Log connection events (connected, disconnected, error) at INFO level

---

## Performance

- **Connection pooling** — reuse DB connections, don't create per-request (see Connection Singleton above)
- **Query timeouts** — set max execution time to prevent runaway queries
- **Caching** for expensive reads (TTL-based, invalidate on write)
- **Denormalize** for read-heavy paths where joins are too expensive (maintain via triggers/hooks)
- **Batch operations** — bulk insert/update instead of individual queries in loops

---

## Backups & Safety

- **Automated backups** — daily minimum. Frequency for critical data depends on RPO requirements and cost constraints (managed DB services handle this well).
- **Point-in-time recovery** capability
- **Test restores** periodically (a backup you've never tested isn't a backup)
- **Separate environments** — never point staging/dev at production DB
- **Seed data** scripts for development (realistic but not real user data)
