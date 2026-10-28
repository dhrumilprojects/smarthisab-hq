# Smart Hisaab HQ

Internal web app for the Smart Hisaab team: analytics, ticketing and CRM.
The mobile app lives in `../smart-hissab` (Expo + React Native + Firebase).

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Firebase (for now) · TanStack Query · Zod

## Commands

- `npm run dev`: dev server
- `npm run build`: type-check and build
- `npm run lint`: lint

Firebase config lives in `.env` (see `.env.example`).

## Styling

- Use Tailwind classes only. No CSS files, CSS modules or other CSS libraries.
- Inline `style` only for values computed at runtime (e.g. chart bar heights).
- Theme changes go in `src/index.css` with `@theme` (no `tailwind.config.js`).

## Auth

- Google sign-in only. HQ shares the Firebase project with the mobile app, so sign-ups can't be disabled project-wide.
- Access is a whitelist: a Firestore doc at `hq_users/{lowercase email}` with `{ role: 'admin' | 'support' | 'sales' }`.
- Accounts not on the whitelist are signed out right away. HQ Firestore rules live in `firebase/hq.rules` and composite indexes in `firebase/firestore.indexes.json`. Any new collection or multi-field query HQ uses needs an entry there.

## Data layer

The database may change later, so the UI must never depend on Firebase.

**Flow:** pages → hooks (TanStack Query) → repo → Firebase

```
src/
  data/
    types.ts          # business types (Ticket, Customer)
    tickets.ts        # repo interface
    firebase/         # Firebase implementations
    index.ts          # picks the implementation
  auth/               # login, logout, current user + role
  components/
    ui/               # shared, data-free: Button, Badge, Avatar, Input, Table, Pagination, ConfirmDialog
    layout/           # page shells: AppLayout, Sidebar
  features/
    users/            # UsersPage, UsersTable, useUsers
    tickets/          # one folder per feature: its pages, components and hooks
```

- Only `src/data/firebase/` and `src/auth/` import `firebase`.
- Pages use hooks only, never repos or Firestore.
- Return plain objects, `Date`s and string IDs. Never Firebase types.
- Filters are plain objects (`{ status: 'open' }`). Pagination uses a string `cursor`.
- Real-time updates use `subscribe(filter, callback) => unsubscribe`.
- Sensitive writes go through Cloud Functions.

## Components

Build small to big: a few solid `ui/` pieces, then feature components made from them.

- `components/ui/` never imports hooks, repos or business types. Data comes in as props, actions go out as callbacks.
- Keep props few and simple. Pass content as `children` instead of adding a prop per variation.
- Styles live inside the component. For differences, add a small variant prop (`variant="danger"`), don't override classes from outside.
- Every data view handles loading, error, empty and data.
- Copy-paste is fine once. Move to `ui/` when a second feature needs it.
- Code used by one feature stays in its `features/` folder.

## Commits

One-line messages with a prefix:

- `feat:` new feature
- `enhancement:` improvement to something that exists
- `fix:` bug fix

## Keep it simple

- Build only what's needed now.
- Create a variable only when it's needed.
- Use plain objects and arrays. Use `Map`, `Set` or classes only for a real reason.
- Follow good design principles, but keep the code simple and readable.
