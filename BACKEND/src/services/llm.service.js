const Groq = require('groq-sdk');

const AVAILABLE_MODELS = [
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'gemma2-9b-it',
];
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TEMPERATURE = 0.2;
const MAX_TOKENS = Number.parseInt(process.env.GROQ_MAX_TOKENS || '700', 10);
const REQUEST_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = [
    'You are Mate.AI, a futuristic AI assistant.',
    'You are concise, calm, helpful, and accurate.',
    'You help with coding, debugging, writing, explanations, planning, product questions, and general assistance.',
    'Prefer clean direct answers over long filler.',
    'If the user asks for code help, be practical and solution-oriented.',
    'If you are unsure, say what is uncertain briefly instead of inventing facts.',
    'Avoid repetitive phrasing and avoid repeating the user unnecessarily.',
    'Use short paragraphs or compact bullets when helpful.',
    'Answer the user directly instead of describing what you would do.',
    'Never mention training data, knowledge cutoff, or missing current information.',
    'Never say:',
    '- "As of my last knowledge cutoff"',
    '- "I may not have current information"',
    '- "According to my training data"',
    'Keep answers human, natural, and useful.',
].join('\n');

function hasModelAccess() {
    return Boolean(process.env.GROQ_API_KEY);
}

function getGroqClient() {
    if (!hasModelAccess()) {
        return null;
    }

    return new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error('Groq request timed out');
                error.statusCode = 504;
                reject(error);
            }, timeoutMs);
        }),
    ]);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableError(error) {
    const statusCode = error?.status || error?.statusCode || error?.response?.status;
    const message = String(error?.message || '').toLowerCase();

    return [408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode)
        || message.includes('timeout')
        || message.includes('temporarily unavailable')
        || message.includes('rate limit')
        || message.includes('network')
        || message.includes('fetch failed');
}

function dedupeMessages(history = []) {
    const next = [];
    let previousSignature = '';

    for (const entry of history) {
        const content = String(entry.content || '').trim();
        const role = entry.role === 'model' ? 'assistant' : entry.role;
        const signature = `${role}:${content}`;

        if (!content || signature === previousSignature) {
            continue;
        }

        next.push({ role, content });
        previousSignature = signature;
    }

    return next;
}

function buildMessages({ history = [] }) {
    return [
        {
            role: 'system',
            content: SYSTEM_PROMPT,
        },
        ...dedupeMessages(history),
    ];
}

function normalizeModel(model) {
    if (AVAILABLE_MODELS.includes(model)) {
        return model;
    }

    if (AVAILABLE_MODELS.includes(DEFAULT_MODEL)) {
        return DEFAULT_MODEL;
    }

    return AVAILABLE_MODELS[0];
}

async function requestGroqCompletion(model, messages) {
    const groq = getGroqClient();

    if (!groq) {
        const error = new Error('Groq API key is not configured');
        error.statusCode = 503;
        throw error;
    }

    return withTimeout(
        groq.chat.completions.create({
            model,
            messages,
            temperature: TEMPERATURE,
            max_tokens: Number.isFinite(MAX_TOKENS) ? MAX_TOKENS : 700,
            top_p: 1,
        }),
        REQUEST_TIMEOUT_MS
    );
}

async function generateModelResponse({ history = [], model }) {
    const messages = buildMessages({ history });
    const resolvedModel = normalizeModel(model);
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            const completion = await requestGroqCompletion(resolvedModel, messages);
            const reply = completion.choices?.[0]?.message?.content?.trim();

            if (!reply) {
                throw new Error('Groq returned an empty response');
            }

            return {
                reply,
                model: completion.model || resolvedModel,
                usage: completion.usage || null,
            };
        } catch (error) {
            lastError = error;

            if (!isRetriableError(error) || attempt === MAX_ATTEMPTS) {
                break;
            }

            await sleep(400 * attempt);
        }
    }

    throw lastError || new Error('Groq request failed');
}

module.exports = {
    AVAILABLE_MODELS,
    generateModelResponse,
    hasModelAccess,
    normalizeModel,
};
