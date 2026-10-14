<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Specific Rules & Learned Guidelines

### Next.js 16 Rules
1. **No Dynamic Date/Math in Client State Initialization**:
   - In Client Components (`"use client"`), never initialize `useState` directly with dynamic run-time evaluations like `new Date()` or `Math.random()`. Next.js 16 evaluates Client Components during static prerender and throws build errors.
   - Always initialize with empty strings or default constants, and populate dynamic dates inside `useEffect` or wrap in `<Suspense>`.
2. **Dynamic Route Params Resolution**:
   - In Next.js 16, route parameters (`params`) in route handlers and page components must be handled as a `Promise` (e.g. `const { id } = await params;`).

### Database & ORM Guidelines
1. **Prisma Postgres**:
   - The application is connected to Prisma Postgres (`postgresql` provider) via the connection string in `.env`.
   - Maintain Prisma client v5 (`@prisma/client@^5`, `prisma@^5`) and run `npx prisma db push` whenever schema changes occur.
