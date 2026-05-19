# Flashback — Frontend

Next.js (App Router, JavaScript, Plain CSS) client for the Flashback time-capsule app.

Companion backend repo: `flashback-backend` (Express + MongoDB + ws).

## Stack

- Next.js 15 with the App Router
- React 19, plain CSS modules-free CSS
- React Context for auth + WebSocket state
- UploadThing for file uploads (avatar + capsule artifact)
- Jest + React Testing Library

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

The backend must be running at the URL you set in `NEXT_PUBLIC_API_URL`.

## Environment variables

Create `.env.local` in this folder. Use `.env.example` as a template.

| Variable                | Required | Notes                                                                       |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`   | yes      | Backend API base URL, includes `/api`. Public — bundled into the client.    |
| `NEXT_PUBLIC_WS_URL`    | yes      | Backend WebSocket URL (`ws://` locally, `wss://` in production).            |
| `UPLOADTHING_TOKEN`     | yes      | From your UploadThing dashboard. Used by the `/api/uploadthing` route.      |
| `UPLOADTHING_SECRET`    | yes      | From your UploadThing dashboard.                                            |
| `UPLOADTHING_APP_ID`    | yes      | From your UploadThing dashboard.                                            |
| `JWT_SECRET`            | yes      | **Must be identical to the backend's `JWT_SECRET`** — the uploadthing route verifies the user's JWT before signing upload URLs. |

### How to change env vars

1. Open `frontend/.env.local` in your editor.
2. Edit values, save.
3. Restart the dev server (`Ctrl+C` then `npm run dev`).
   - `NEXT_PUBLIC_*` vars are baked into the client bundle at build time, so a full restart is required.

On Vercel: don't commit `.env.local`. Add the same variables under **Project → Settings → Environment Variables** (for Production, Preview, and Development).

## Scripts

```bash
npm run dev      # next dev
npm run build    # next build
npm start        # next start
npm test         # Jest (React Testing Library)
```

## Pages

```
/                       landing
/login                  email + password
/register               username, email, password
/capsules               explore (search, tag dropdown, lock filter, sort)
/capsules/new           create capsule
/capsules/[id]          read capsule + live comments + viewer count
/capsules/[id]/edit     edit title/date/tags (only while sealed, only owner)
/my-capsules            own archive
/profile                edit username, bio, avatar
```

## Deploy (Vercel)

1. Push this folder to its own GitHub repo.
2. Import the repo on Vercel — framework auto-detected as Next.js.
3. Add all environment variables from the table above (with the **production** backend URL).
4. Deploy. Vercel will run `npm install && npm run build` and host the result.

## Tests

```bash
npm test
```

React Testing Library test for `CapsuleCard` ensuring locked capsules don't leak content.
