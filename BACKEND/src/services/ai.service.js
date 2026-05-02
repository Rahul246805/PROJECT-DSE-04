const Groq = require("groq-sdk");

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const REALTIME_MODEL = process.env.GROQ_REALTIME_MODEL || "groq/compound-mini";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_PRIMARY_ATTEMPTS = 2;

const COUNTRY_CAPITALS = new Map([
  ["india", "New Delhi"],
  ["united states", "Washington, D.C."],
  ["usa", "Washington, D.C."],
  ["united kingdom", "London"],
  ["uk", "London"],
  ["france", "Paris"],
  ["germany", "Berlin"],
  ["italy", "Rome"],
  ["japan", "Tokyo"],
  ["china", "Beijing"],
  ["canada", "Ottawa"],
  ["australia", "Canberra"],
  ["brazil", "Brasilia"],
  ["russia", "Moscow"],
]);

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Calcutta",
  }).format(new Date());
}

function getLatestUserMessage(history) {
  return [...history].reverse().find((entry) => entry.role === "user")?.content?.trim() || "";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function shouldUseRealtimeModel(history) {
  const latestUserMessage = normalizeText(getLatestUserMessage(history));

  if (!latestUserMessage) {
    return false;
  }

  return [
    "search the web for:",
    "latest",
    "current",
    "today",
    "news",
    "update",
    "updated",
    "report",
    "weather",
    "price",
    "stock",
    "score",
    "2026",
  ].some((keyword) => latestUserMessage.includes(keyword));
}

function buildGroqMessages(history) {
  const basePrompt = {
    role: "system",
    content: [
      "You are Mate.ai, a highly accurate and reliable AI assistant.",
      `Current date: ${getCurrentDateLabel()}.`,
      "",
      "PRIMARY GOAL",
      "Always understand the user's input clearly and return a correct, helpful, and complete response.",
      "",
      "INPUT HANDLING",
      "- Read the user message carefully.",
      "- If the message is unclear, ask a short clarification question.",
      "- Never ignore user input.",
      "- Never return empty or null responses.",
      "",
      "RESPONSE RULES",
      "- Always return a meaningful response.",
      "- Keep answers clear and structured.",
      "- Use simple language unless technical detail is required.",
      "- If coding is requested, provide complete working code.",
      "- Avoid partial or broken snippets.",
      "- If explanation is requested, explain step-by-step.",
      "- When the user asks for latest, current, updated, 2026, today, or report-style information, prefer live web-backed answers when the active model supports web search.",
      "- When answering time-sensitive questions, mention the exact date when useful.",
      "",
      "ERROR HANDLING",
      "- If live AI generation fails, still provide the best helpful fallback answer possible.",
      "- Never crash or return undefined/null.",
      "",
      "FORMAT RULES",
      "- For normal queries, use a short paragraph.",
      "- For coding, use formatted code blocks.",
      "- For steps, use numbered lists.",
      "- For debugging, use problem + solution + fixed code.",
      "",
      "CHAT BEHAVIOR",
      "- Be responsive and conversational.",
      "- Do not repeat the same answer.",
      "- Do not hallucinate. If unsure, say you don't know.",
      "",
      "BRANDING",
      "- Your name is always Mate.ai.",
      "- Never mention Codex or any other name.",
      "",
      "STRICT RULE",
      "- Every user prompt must get a response.",
      "- No empty replies. No failures.",
    ].join("\n"),
  };

  const conversation = history.map((entry) => ({
    role: entry.role === "model" ? "assistant" : entry.role,
    content: entry.content,
  }));

  return [basePrompt, ...conversation];
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error("AI request timed out");
        timeoutError.statusCode = 504;
        reject(timeoutError);
      }, timeoutMs);
    }),
  ]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableError(error) {
  const statusCode = error?.status || error?.statusCode || error?.response?.status;
  const message = normalizeText(error?.message);

  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  return (
    message.includes("timeout") ||
    message.includes("temporarily unavailable") ||
    message.includes("rate limit") ||
    message.includes("network") ||
    message.includes("fetch failed")
  );
}

async function requestGroqCompletion({ model, messages, enableCitations }) {
  const groq = getGroqClient();

  if (!groq) {
    const error = new Error("Groq API key is not configured");
    error.statusCode = 503;
    throw error;
  }

  return withTimeout(
    groq.chat.completions.create({
      model,
      messages,
      ...(enableCitations ? { citation_options: "enabled" } : {}),
      temperature: 0.7,
      max_tokens: 1024,
    }),
    REQUEST_TIMEOUT_MS
  );
}

function maybeSolveArithmetic(question) {
  const candidate = normalizeText(question)
    .replace(/^what is /, "")
    .replace(/^calculate /, "")
    .replace(/\?$/, "")
    .trim();

  if (!/^[\d\s+\-*/().%]+$/.test(candidate) || candidate.length === 0) {
    return "";
  }

  try {
    const result = Function(`"use strict"; return (${candidate})`)();

    if (typeof result === "number" && Number.isFinite(result)) {
      return `The answer is ${result}.`;
    }
  } catch {
    return "";
  }

  return "";
}

function buildServiceRecoveryReply(history, error) {
  const latestUserMessage = getLatestUserMessage(history);
  const normalizedMessage = normalizeText(latestUserMessage);

  if (!normalizedMessage) {
    return "I’m ready to help. Please send your question again.";
  }

  if (["hi", "hello", "hey", "hii"].includes(normalizedMessage)) {
    return "Hello! I’m Mate.ai. How can I help you today?";
  }

  if (normalizedMessage.includes("capital of")) {
    const countryMatch = normalizedMessage.match(/capital of ([a-z.\s]+)/i);
    const country = normalizeText(countryMatch?.[1] || "").replace(/[?.!,]+$/g, "");
    const capital = COUNTRY_CAPITALS.get(country);

    if (capital) {
      return `The capital of ${country.replace(/\b\w/g, (letter) => letter.toUpperCase())} is ${capital}.`;
    }
  }

  const arithmeticReply = maybeSolveArithmetic(latestUserMessage);

  if (arithmeticReply) {
    return arithmeticReply;
  }

  if (normalizedMessage.includes("who are you")) {
    return "I’m Mate.ai, your AI workspace assistant for planning, writing, debugging, and product support.";
  }

  if (normalizedMessage.includes("what can you do")) {
    return "I can help with writing, coding, debugging, product research, explanations, and workspace-style AI chat support.";
  }

  if (normalizedMessage.includes("mate.ai")) {
    return "Mate.ai is an AI chat workspace designed for planning, writing, debugging, and saved conversations with secure login flows.";
  }

  const errorHint = isRetriableError(error)
    ? "I’m having trouble reaching the live AI service right now"
    : "The live AI response is temporarily unavailable";

  return `${errorHint}, but I can still help. Please try your question again in a shorter form, or ask a direct factual question and I’ll do my best to answer it here.`;
}

async function requestWithRetry({ model, messages, enableCitations }) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_PRIMARY_ATTEMPTS; attempt += 1) {
    try {
      return await requestGroqCompletion({ model, messages, enableCitations });
    } catch (error) {
      lastError = error;

      if (!isRetriableError(error) || attempt === MAX_PRIMARY_ATTEMPTS) {
        throw error;
      }

      await sleep(500 * attempt);
    }
  }

  throw lastError;
}

async function generateResponse(history) {
  const messages = buildGroqMessages(history);
  const useRealtimeModel = shouldUseRealtimeModel(history);
  const primaryModel = useRealtimeModel ? REALTIME_MODEL : DEFAULT_MODEL;

  try {
    let completion;

    try {
      completion = await requestWithRetry({
        model: primaryModel,
        messages,
        enableCitations: useRealtimeModel,
      });
    } catch (primaryError) {
      if (!useRealtimeModel || primaryModel === DEFAULT_MODEL) {
        throw primaryError;
      }

      console.error(
        `Groq realtime model failed (${primaryModel}). Falling back to default model:`,
        primaryError.message
      );

      completion = await requestWithRetry({
        model: DEFAULT_MODEL,
        messages,
        enableCitations: false,
      });
    }

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty AI reply");
    }

    return reply;
  } catch (error) {
    console.error("Groq Error:", error.message);
    return buildServiceRecoveryReply(history, error) || FALLBACK_REPLY;
  }
}

module.exports = {
  generateResponse,
};
