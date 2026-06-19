# Mate.AI Backend

Express API for Mate.AI with MongoDB persistence, local JWT auth, guest sessions, and Groq-powered chat replies.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens
- Groq SDK
- Socket.IO support

Clerk integration files are retained for optional provider support, but production uses local JWT auth unless `CLERK_SECRET_KEY` is intentionally configured.

## Environment

Create `BACKEND/.env` from `BACKEND/.env.example`.

```bash
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_TOKENS=700
FRONTEND_URL=http://127.0.0.1:5173
PUBLIC_APP_URL=http://127.0.0.1:5173
```

Optional SMTP/contact variables are documented in `.env.example`.

## Local Development

```bash
cd BACKEND
npm install
npm start
```

## Main API Routes

- `GET /health`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/guest`
- `GET /api/auth/me`
- `GET /api/chat`
- `POST /api/chat`
- `GET /api/chat/messages/:id`
- `POST /api/chat/message`
- `PUT /api/chat/message/:messageId`
- `DELETE /api/chat/:id`

## Render Deployment

The repository-level `render.yaml` deploys this backend as an API service:

- Build command: `npm install --prefix BACKEND`
- Start command: `npm start --prefix BACKEND`
- Health check path: `/health`

Set `FRONTEND_URL` and `PUBLIC_APP_URL` to the deployed Vercel URL so CORS and password-reset links point to the frontend. Do not set `SERVE_FRONTEND` for the two-service deployment.
