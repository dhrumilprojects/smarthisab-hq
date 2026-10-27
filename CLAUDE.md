# Smart Hisaab HQ

Internal web app for the Smart Hisaab team: analytics, ticketing and CRM.
The customer-facing mobile app lives in `../smart-hissab` (Expo + React Native + Firebase).

## Tech stack

- React + TypeScript + Vite
- Firebase (Firestore, Auth, Cloud Functions) for now. The database may change later (e.g. Postgres via our own API).
- TanStack Query for data fetching and caching
- Zod for validating data read from the database

## Commands

- `npm run dev`: start the dev server
- `npm run build`: type-check and build
- `npm run lint`: lint with oxlint

Firebase config comes from `.env` (see `.env.example`). `.env` is not committed.

## Data layer (must follow)

The UI must never depend on Firebase directly, so the database can be swapped later by changing only the data layer.

Flow: **pages/components → hooks (TanStack Query) → repo interface → Firebase implementation**

```
src/
  data/
    types.ts              # plain business types (Ticket, Customer, Payment)
    tickets.ts            # repo interface: the functions that exist
    firebase/
      ticketsFirebase.ts  # Firebase implementation
    index.ts              # picks which implementation is used
  auth/                   # login, logout, getCurrentUser, getRole
  hooks/                  # useTickets, useCustomer, ...
  pages/
```

Rules:

- Only files inside `src/data/firebase/` (and `src/auth/`) may import from `firebase`.
- Pages and components only use hooks. They never call Firestore or the repos directly.
- Never return Firebase types (`Timestamp`, `DocumentSnapshot`, `DocumentReference`) from the data layer. Convert them to plain objects, `Date`s and string IDs.
- Filters are plain objects (e.g. `{ status: 'open' }`). Never pass `where()` clauses or other Firestore query pieces from the UI.
- Pagination uses a simple string `cursor` or page number, not Firestore documents.
- Real-time updates are exposed as `subscribe(filter, callback) => unsubscribe`, never as raw `onSnapshot`.
- Types in `types.ts` describe the business (Ticket, Customer), not how Firestore stores the data.
- Writes that change customer data or need permission checks go through Cloud Functions, not straight from the browser.

## Keep it simple (no overengineering)

- Build only what is needed now. No abstractions, options or layers "for the future" beyond the data layer above.
- Create a variable only when it is actually needed (reused, or it makes the code clearly easier to read). Otherwise use the value directly.
- Use simple data structures (plain objects, arrays, strings, numbers). Move to more advanced structures (`Map`, `Set`, classes, custom structures) only when there is a real reason, such as performance or correctness.
- Prefer small, plain functions over clever patterns.
- Follow good design principles, while keeping the code simple and readable.
