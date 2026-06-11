# MeepMeet

Board-game meetup app: members ("meeps") host events, plan seating across rounds/tables,
track game collections + wants, log play sessions, rate games, and get recommendations.

## Stack
- **Next.js 16** (App Router) · **React 19** · **TypeScript 5** · **Tailwind 4**
- **Auth:** Clerk (`@clerk/nextjs`); webhooks via `svix` → `src/app/api/webhooks/clerk/route.ts`
- **DB:** PostgreSQL via **Prisma 5** (`DATABASE_URL`). **Clerk user ID is the `User` primary key.**
- **Files:** Vercel Blob (`@vercel/blob`) — avatars (`/api/user/avatar`)
- **Email:** Resend (`src/lib/email.ts`)
- **Board game data:** BoardGameGeek via `bgg-xml-api-client` + `fast-xml-parser` (`src/lib/bgg.ts`)
- **Drag & drop:** `@dnd-kit/*` — the `TablePlanner` seating UI

## ⚠️ Critical gotcha: Clerk ↔ DB user sync (read before touching any API route)
The Clerk webhook creates the real `User` (Clerk ID as PK, real email). Historically an API
helper also created **placeholder** users (`clerk-{id}@temp.local`) before the webhook fired
→ duplicate users + foreign-key violations (`Event_hostId_fkey`, `UserGame_userId_fkey`,
`EventAttendee_userId_fkey`, etc.).

**Rule:** never use the raw Clerk `auth()` `userId` directly as a foreign key. Always go
through `src/lib/user-helper.ts`:
- `getDatabaseUserId(clerkUserId, clerkUserData?)` — ensures the DB user exists, returns its id
- `getOrCreateDatabaseUser(clerkUserId, clerkUserData?)` — same, returns the record

Pattern in routes: rename `auth()` result to `clerkUserId`, call `getDatabaseUserId(...)`,
use the returned id for all DB writes. Cleanup/consolidation scripts live in `scripts/`
(`migrate-duplicate-users.ts`, `cleanup-duplicate-users.sql`, `heal-placeholder-users.ts`).
Background: `FOREIGN_KEY_FIX_SUMMARY.md`, `DUPLICATE_USER_ISSUE.md`, `MIGRATION_GUIDE.md`.

## Layout
- `src/app/` — pages: `page.tsx` (home), `events/`, `games/`, `meeps/` (member profiles),
  `faq/`, `admin/`, `sign-in/`, `sign-up/`
- `src/app/api/` — REST routes: `events/[id]/...` (rsvp, poll, rounds→tables→players, guests,
  requests), `games/[id]/...` (rate, want, ownership), `user/...` (current, profile, avatar),
  `meeps/[id]/...`, `bgg/...` (search, game), `recommend`, `interests`, `admin/users`,
  `webhooks/clerk`
- `src/components/` — `EventCard`, `GameCard`, `MeepCard`, `GameAdvisor`, `TablePlanner`
- `src/hooks/` — `useUserRole`, `useClickOutside`
- `src/lib/` — `prisma` (client), `user-helper` (see gotcha), `user-service`, `roles`,
  `bgg`, `email`, `cache`, `types`
- `prisma/` — `schema.prisma`, `migrations/`, `seed.ts`

## Data model (Prisma)
Core: `User` (role enum: VISITOR | MEMBER | GAME_MASTER), `Game`, `Event`.
- Collections: `UserGame` (owns), `UserGameWant` (wishlist), `GameRating`, `GameRequest`
- Events: `EventAttendee` (rsvp yes/no/maybe), `EventDatePoll`+`EventDateVote` (date voting),
  `EventRound` → `EventTable` → `TablePlayer` (seating; `TablePlayer.userId` nullable for
  guests via `playerName`), `EventGuest`
- Play tracking: `PlaySession` → `SessionPlayer`, optional `winnerId`
- `UserRecommendation` (with `dismissed` flag)

Roles are enforced via `src/lib/roles.ts` + `useUserRole`. Many join tables use composite PKs
and `onDelete: Cascade`; some FKs `SetNull` (e.g. `EventTable.gameId`, `TablePlayer.userId`).

## Commands
- `npm run dev` — local dev (localhost:3000)
- `npm run build` — `prisma migrate deploy && next build`
- `postinstall` runs `prisma generate`
- Seed: `npx tsx prisma/seed.ts` (configured as Prisma seed)
- One-off scripts: `npx tsx scripts/<name>.ts`

## Conventions
- App Router server components by default; route handlers under `api/`.
- Secrets in `.env` (Clerk keys, `DATABASE_URL`, Resend, Blob token) — never commit.
- Deployed on Vercel.
