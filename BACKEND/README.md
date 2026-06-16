# Mate.AI Backend

Groq-powered chatbot backend for Mate.AI using:

- Node.js + Express
- MongoDB
- Clerk authentication
- Groq SDK
- Llama 3.3 70B

## Folder structure

```text
src/
  configs/
    db.js
  controllers/
    auth.controller.js
    chat.controller.js
    contact.controller.js
  middlewares/
    auth.middleware.js
    error.middleware.js
  models/
    chat.model.js
    contact.model.js
    message.model.js
    user.model.js
  routes/
    auth.routes.js
    chat.routes.js
    contact.routes.js
  services/
    ai.service.js
    clerk-user.service.js
    llm.service.js
    mail.service.js
  sockets/
    socket.server.js
  app.js
```

## Environment setup

Create `BACKEND/.env` from `BACKEND/.env.example`.

```bash
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://127.0.0.1:5173
PUBLIC_APP_URL=http://127.0.0.1:3000
```

## AI architecture

1. `chat.controller.js` loads the recent conversation from MongoDB.
2. `ai.service.js` trims and normalizes chat history.
3. `llm.service.js` sends the request to Groq with:
   - model: `llama-3.3-70b-versatile`
   - temperature: `0.2`
   - retry handling
   - timeout handling
   - a strong Mate.AI system prompt
4. The assistant reply is stored back in MongoDB.

## Main chatbot route

Authenticated route:

`POST /api/chat/message`

Request body:

```json
{
  "chatId": "682e0example1234567890abc",
  "message": "Help me debug my React API error"
}
```

Example response:

```json
{
  "success": true,
  "reply": "Start by checking the exact failing request, the network response, and the component that consumes it.",
  "chat": {
    "_id": "682e0example1234567890abc",
    "title": "React API issue",
    "lastActivity": "2026-05-22T10:20:30.000Z"
  }
}
```

## Frontend request example

```js
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    chatId,
    message: 'Write a concise status update for my team',
  }),
});

const data = await response.json();
console.log(data.reply);
```

## Notes

- The backend uses Groq only.
- If `GROQ_API_KEY` is missing, the backend returns a clean configuration message instead of a broken legacy fallback.
- Error responses are centralized through `error.middleware.js`.
