const { generateModelResponse, hasModelAccess, normalizeModel } = require('./llm.service');

const FALLBACK_REPLY = 'I hit a response issue on my side. Please send your prompt again and I will try once more.';
const MISSING_MODEL_REPLY = 'Mate.AI needs a valid GROQ_API_KEY in BACKEND/.env before chat replies can be generated.';
const INVALID_KEY_REPLY = 'Mate.AI could not authenticate with the AI provider. Please check GROQ_API_KEY in Render and redeploy.';
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

function normalizeMessage(entry) {
    if (!entry) {
        return null;
    }

    const role = entry.role === 'model' ? 'assistant' : entry.role;
    const content = String(entry.content || '').trim();

    if (!content || !['user', 'assistant', 'system'].includes(role)) {
        return null;
    }

    return {
        role,
        content: content.slice(0, MAX_MESSAGE_CHARS),
    };
}

function buildConversation(history = []) {
    return history
        .slice(-MAX_HISTORY_MESSAGES)
        .map(normalizeMessage)
        .filter(Boolean);
}

function buildLocalFallbackReply(history = []) {
    const lastUserMessage = [...history]
        .reverse()
        .find((entry) => entry?.role === 'user' || entry?.role === 'assistant')
        ?.content;

    const prompt = String(lastUserMessage || '').trim();

    if (!prompt) {
        return FALLBACK_REPLY;
    }

    if (/^(hi|hello|hey)\b/i.test(prompt)) {
        return 'Hello. Send me your question and I will help.';
    }

    if (/\b(write|draft|email|message|reply|caption|bio)\b/i.test(prompt)) {
        return 'I can help draft that. If Groq is configured, I will generate the full reply. Right now I need a valid GROQ_API_KEY in BACKEND/.env.';
    }

    if (/\b(debug|fix|error|bug|issue|api|react|node|mongodb|express)\b/i.test(prompt)) {
        return 'I can help debug this, but the model is not available yet. Add GROQ_API_KEY in BACKEND/.env, restart the backend, and try the same prompt again.';
    }

    return MISSING_MODEL_REPLY;
}

function isProviderAuthError(error) {
    const statusCode = error?.status || error?.statusCode || error?.response?.status;

    return statusCode === 401 || statusCode === 403;
}

async function generateResponse(history = [], options = {}) {
    const conversation = buildConversation(history);

    if (conversation.length === 0) {
        return {
            reply: "I'm ready to help. Send a message and I'll jump in.",
            model: normalizeModel(options.model),
            usage: null,
        };
    }

    if (!hasModelAccess()) {
        return {
            reply: buildLocalFallbackReply(conversation),
            model: normalizeModel(options.model),
            usage: null,
        };
    }

    try {
        const result = await generateModelResponse({
            history: conversation,
            model: normalizeModel(options.model),
            mode: options.mode,
            tool: options.tool,
        });

        if (!result?.reply) {
            return {
                reply: FALLBACK_REPLY,
                model: normalizeModel(options.model),
                usage: null,
            };
        }

        return result;
    } catch (error) {
        console.error('AI generation failed:', error.message);

        if (isProviderAuthError(error)) {
            return {
                reply: INVALID_KEY_REPLY,
                model: normalizeModel(options.model),
                usage: null,
            };
        }

        return {
            reply: FALLBACK_REPLY,
            model: normalizeModel(options.model),
            usage: null,
        };
    }
}

module.exports = {
    generateResponse,
};
