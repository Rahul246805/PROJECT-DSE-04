const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const REALTIME_MODEL = process.env.GROQ_REALTIME_MODEL || "groq/compound-mini";

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Calcutta",
  }).format(new Date());
}

function shouldUseRealtimeModel(history) {
  const latestUserMessage = [...history]
    .reverse()
    .find((entry) => entry.role === "user")
    ?.content?.toLowerCase();

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
      `- If something fails or no data is available, reply exactly with: ${FALLBACK_REPLY}`,
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

async function requestGroqCompletion({ model, messages, enableCitations }) {
  return groq.chat.completions.create({
    model,
    messages,
    ...(enableCitations ? { citation_options: "enabled" } : {}),
    temperature: 0.7,
    max_tokens: 1024,
  });
}

async function generateResponse(history) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error(FALLBACK_REPLY);
    error.statusCode = 500;
    throw error;
  }

  const messages = buildGroqMessages(history);
  const useRealtimeModel = shouldUseRealtimeModel(history);
  const primaryModel = useRealtimeModel ? REALTIME_MODEL : DEFAULT_MODEL;

  try {
    let completion;

    try {
      completion = await requestGroqCompletion({
        model: primaryModel,
        messages,
        enableCitations: useRealtimeModel,
      });
    } catch (primaryError) {
      if (!useRealtimeModel) {
        throw primaryError;
      }

      console.error(
        `Groq realtime model failed (${primaryModel}). Falling back to default model:`,
        primaryError.message
      );

      completion = await requestGroqCompletion({
        model: DEFAULT_MODEL,
        messages,
        enableCitations: false,
      });
    }

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      const error = new Error(FALLBACK_REPLY);
      error.statusCode = 502;
      throw error;
    }

    return reply;
  } catch (error) {
    console.error("Groq Error:", error.message);

    if (error.statusCode) {
      throw error;
    }

    const serviceError = new Error(FALLBACK_REPLY);
    serviceError.statusCode = 502;
    throw serviceError;
  }
}

module.exports = {
  generateResponse,
};
