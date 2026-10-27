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

- Use Tailwind classes only. No CSS files, CSS modules, inline styles or other CSS libraries.
- Theme changes go in `src/index.css` with `@theme` (no `tailwind.config.js`).

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
  hooks/
  pages/
```

- Only `src/data/firebase/` and `src/auth/` import `firebase`.
- Pages use hooks only, never repos or Firestore.
- Return plain objects, `Date`s and string IDs. Never Firebase types.
- Filters are plain objects (`{ status: 'open' }`). Pagination uses a string `cursor`.
- Real-time updates use `subscribe(filter, callback) => unsubscribe`.
- Sensitive writes go through Cloud Functions.

## Keep it simple

- Build only what's needed now.
- Create a variable only when it's needed.
- Use plain objects and arrays. Use `Map`, `Set` or classes only for a real reason.
- Follow good design principles, but keep the code simple and readable.
