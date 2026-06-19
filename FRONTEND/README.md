# Mate.AI Frontend

React + Vite frontend for the Mate.AI chatbot workspace.

## Stack

- React + Vite
- React Router
- Redux Toolkit
- Framer Motion
- Local JWT auth against the backend API

Clerk and Firebase provider code is still present as optional fallback support, but production uses local email/password auth and guest login by leaving their environment variables unset.

## Environment

Create `FRONTEND/.env` from `FRONTEND/.env.example`.

```bash
VITE_API_URL=http://127.0.0.1:3000/api
VITE_LINKEDIN_URL=https://www.linkedin.com/in/your-profile
VITE_CONTACT_EMAIL=hello@mateai.dev
```

For Vercel, set:

```bash
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

Do not set `VITE_CLERK_PUBLISHABLE_KEY` or `VITE_FIREBASE_*` for the local-JWT production flow.

## Local Development

```bash
cd FRONTEND
npm install
npm run dev
```

The main routes are:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password/:token`
- `/app`

Authenticated users are redirected to `/app`. Unauthenticated users trying to access the chatbot are redirected to `/login`.

## Vercel Deployment

Create the Vercel project with root directory `FRONTEND`.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` rewrites all routes to `index.html` so React Router pages survive browser refreshes.
