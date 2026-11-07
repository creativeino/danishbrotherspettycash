# Petty Cash Role-Based Access Control (RBAC) & Username Authentication

* **Author:** EGM Ideation Swarm
* **Date:** 2026-11-07
* **Status:** PROPOSED RFC

## Overview

This feature introduces user identity and Role-Based Access Control (RBAC) into the DaniBro Petty Cash management system. It establishes two operational roles: **Admin** (`Danish`, `Owner`) and **Operator** (`Wahab`, `Subhan`). Authentication is streamlined via username login with secure server-side session management. The system preserves complete transparency by keeping petty cash balance summaries and financial reports accessible to all users, while enforcing strict record mutation and deletion controls.

## Analysis

Evaluating the concept across the six Goldfish lenses (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`) revealed the following considerations:

1. **Server-Side Authorization Boundary (Security)**:
   - Client-side hiding of edit/delete buttons provides usability but zero security. The authoritative boundary must exist inside the Next.js API route handlers (`/api/transactions/[id]`).
   - `DELETE` endpoints must verify that `role === "ADMIN"`. Operator requests receive an HTTP 403 Forbidden.
   - `PUT` (edit) endpoints must verify ownership: if `role === "OPERATOR"`, the transaction's `createdBy` field must match `session.username`. Admins bypass ownership checks and can edit any transaction.

2. **Session Integrity**:
   - The current setup relies on unsalted `localStorage` values. This must be upgraded to a signed/HTTP-only session cookie storing `{ username, role, displayName }` to prevent operators from elevating permissions via DevTools.

3. **Data Model & Legacy Migration**:
   - The `Transaction` schema requires `createdBy` (username), `createdByName` (display label), and `createdRole` (`ADMIN` or `OPERATOR`).
   - Existing legacy records lacking `createdBy` should default to `danish` (Admin) during database push/migration to prevent orphaned records.

4. **User Experience & Auditability**:
   - The top header will render an active profile badge indicating the current user and role (e.g., `Danish (Admin)` or `Wahab (Operator)`).
   - In transaction tables, each row displays a subtle `Created by: [Name]` tag.
   - For Operators, the trash icon is hidden globally, and the edit pencil icon appears only on rows authored by that operator.

5. **Shared Ledger Transparency**:
   - Total petty cash balance, remaining drawer cash, category totals, and date-range filters remain identical across all roles as requested.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Username-based authentication for predefined users (`danish`, `admin`, `wahab`, `subhan`).
  - Role definition: `ADMIN` (full rights: create, edit all, delete all) and `OPERATOR` (create, edit self-created only, no delete).
  - Row-level ownership tracking on all transactions (`createdBy`).
  - Server-side route handler enforcement for `PUT` and `DELETE` requests.
  - UI adaptations: conditional rendering of edit/delete icons and creator attribution badges.
  - Shared ledger and petty cash balance metrics across all user sessions.

* **Out-of-Scope Non-Goals:**
  - Self-service public user registration / signup flows.
  - Granular workflow approvals (no pending/approved states; entries take effect immediately upon creation).
  - Multi-tenant organizational partitioning.
  - Separate reporting dashboards per user (reports remain unified).

## Alternatives Weighed

* **Alternative 1: Complex Multi-Step Approval Workflows**:
  - *Rejected*: Adding approval queues or verification stages adds unnecessary cognitive overhead and operational delay for daily petty cash logging.
* **Alternative 2: Full Email + Password + MFA Authentication**:
  - *Rejected*: Over-engineered for a small trusted internal team of four on-site operators. Simple username credentials offer the required speed and ergonomics.
* **Alternative 3: Client-Side Only Button Disabling**:
  - *Rejected*: Insecure. Anyone inspecting network requests could easily send a `DELETE` payload to the API.

## Key Decisions & Staging for Next Steps

* **User Directory**:
  - Admins: `danish`, `admin`
  - Operators: `wahab`, `subhan`
* **Next Steps**:
  - Update `prisma/schema.prisma` with `createdBy` fields and run `npx prisma db push`.
  - Create `/api/auth/login`, `/api/auth/session`, and `/api/auth/logout` endpoints.
  - Protect `PUT` and `DELETE` handlers in `src/app/api/transactions/[id]/route.ts`.
  - Integrate role-based UI indicators and ownership check in the frontend transaction list.
