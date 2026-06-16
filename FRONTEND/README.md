# Mate.AI Frontend

Modern authentication and Groq-powered chat for the Mate.AI workspace.

## Stack

- React + Vite
- React Router
- Tailwind CSS
- Framer Motion
- Clerk Authentication

## Folder structure

```text
src/
  components/
    auth/
      AuthLoadingScreen.jsx
      AuthShell.jsx
      ClerkAuthCard.jsx
    chat/
      ...
  lib/
    auth.jsx
    clerk.js
    theme.js
    validation.js
  pages/
    Login.jsx
    Register.jsx
    ForgotPassword.jsx
    ResetPassword.jsx
    Home.jsx
    Portfolio.jsx
```

## Environment variables

Create `FRONTEND/.env` from `FRONTEND/.env.example`.

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_URL=http://127.0.0.1:3000/api
VITE_LINKEDIN_URL=https://www.linkedin.com/in/your-profile
```

## Clerk dashboard setup

1. Create a Clerk application.
2. In Clerk, enable these sign-in methods:
   - Google
   - GitHub
   - Phone number
   - Email address + password
3. Add your local dev URLs:
   - `http://127.0.0.1:5173`
   - `http://localhost:5173`
4. Add your production URL when deployed.

## Local development

```bash
cd FRONTEND
npm install
npm run dev
```

The auth routes are:

- `/login`
- `/register`
- `/forgot-password`
- `/app`

Authenticated users are redirected to `/app`. Unauthenticated users trying to access the chatbot are redirected to `/login`.

## Frontend request example for chat replies

```js
import { apiClient } from './src/components/chat/aiClient.js';

const { data } = await apiClient.post('/chat/message', {
  chatId: 'your-chat-id',
  message: 'Help me write a concise project update',
});

console.log(data.reply);
```
