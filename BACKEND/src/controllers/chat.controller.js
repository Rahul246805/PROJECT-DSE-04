const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('../services/ai.service');
const mongoose = require('mongoose');
const { AVAILABLE_MODELS, normalizeMode, normalizeModel, normalizeTool } = require('../services/llm.service');

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";
const MAX_CONVERSATION_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 12000;

function ensureDatabaseReady(res) {
    if (mongoose.connection.readyState === 1) return true;

    res.status(503).json({
        success: false,
        message: 'Database connection not ready'
    });
    return false;
}

function buildOwnedChatQuery(chatId, userId) {
    const ownershipFilter = {
        $or: [{ user: userId }, { userId }]
    };

    if (!chatId) return ownershipFilter;

    return { _id: chatId, ...ownershipFilter };
}

async function findOwnedChat(chatId, userId) {
    if (!chatId) {
        return null;
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return null;
    }

    return chatModel.findOne(buildOwnedChatQuery(chatId, userId));
}

function serializeChat(chat) {
    return {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
        userId: chat.userId || chat.user,
        preferredModel: chat.preferredModel || normalizeModel(),
        roleMode: normalizeMode(chat.roleMode),
        toolMode: normalizeTool(chat.toolMode),
    };
}

function normalizeUserMessage(value) {
    return String(value || '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

function extractModel(value) {
    return AVAILABLE_MODELS.includes(value) ? value : normalizeModel(value);
}

function extractMode(value) {
    return value ? normalizeMode(value) : null;
}

function extractTool(value) {
    return value ? normalizeTool(value) : null;
}

async function loadConversation(chatId) {
    return messageModel
        .find({ chat: chatId })
        .sort({ createdAt: 1 })
        .limit(MAX_CONVERSATION_MESSAGES)
        .lean();
}

/* CREATE CHAT */
async function createChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { title, preferredModel, roleMode, toolMode } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ success: false });
        }

        const chat = await chatModel.create({
            user: req.user._id,
            userId: req.user._id,
            title: title.trim(),
            preferredModel: extractModel(preferredModel),
            roleMode: normalizeMode(roleMode),
            toolMode: normalizeTool(toolMode),
        });

        res.json({ success: true, chat: serializeChat(chat) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

/* GET CHATS */
async function getChats(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chats = await chatModel
            .find(buildOwnedChatQuery(null, req.user._id))
            .sort({ lastActivity: -1 });

        res.json({ success: true, chats: chats.map(serializeChat) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

/* GET MESSAGES */
async function getMessages(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chat = await findOwnedChat(req.params.id, req.user._id);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const messages = await messageModel
            .find({ chat: req.params.id })
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

/* SEND MESSAGE (SAFE AI HANDLING) */
async function sendMessage(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const normalizedMessage = normalizeUserMessage(req.body?.message);
        const { chatId } = req.body;
        const requestedModel = extractModel(req.body?.model);
        const requestedMode = extractMode(req.body?.mode);
        const requestedTool = extractTool(req.body?.tool);

        if (!normalizedMessage || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID and message are required',
            });
        }

        const chat = await findOwnedChat(chatId, req.user._id);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: normalizedMessage,
            role: "user"
        });

        const conversation = await loadConversation(chatId);

        let result;

        try {
            result = await aiService.generateResponse(conversation, {
                model: requestedModel || chat.preferredModel,
                mode: requestedMode || chat.roleMode,
                tool: requestedTool || chat.toolMode,
            });
        } catch (err) {
            console.error("AI ERROR:", err);
            return res.status(500).json({
                success: false,
                message: FALLBACK_REPLY
            });
        }

        const reply = typeof result === 'string' ? result : result?.reply;

        if (!reply) {
            return res.status(500).json({
                success: false,
                message: FALLBACK_REPLY
            });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: reply,
            role: "model",
            model: result?.model || chat.preferredModel || '',
            usage: result?.usage || undefined,
        });

        chat.lastActivity = new Date();
        chat.preferredModel = result?.model || requestedModel || chat.preferredModel;
        chat.roleMode = requestedMode || chat.roleMode;
        chat.toolMode = requestedTool || chat.toolMode;
        await chat.save();

        res.json({
            success: true,
            reply,
            chat: serializeChat(chat),
            model: result?.model || chat.preferredModel,
            usage: result?.usage || null,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: FALLBACK_REPLY
        });
    }
}

/* UPDATE MESSAGE AND REGENERATE RESPONSE */
async function updateMessage(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { messageId } = req.params;
        const content = normalizeUserMessage(req.body?.content);
        const requestedModel = extractModel(req.body?.model);
        const requestedMode = extractMode(req.body?.mode);
        const requestedTool = extractTool(req.body?.tool);

        if (!messageId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        const targetMessage = await messageModel.findById(messageId);

        if (!targetMessage || targetMessage.role !== 'user') {
            return res.status(404).json({
                success: false,
                message: 'Prompt not found'
            });
        }

        const chat = await findOwnedChat(targetMessage.chat, req.user._id);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        targetMessage.content = content;
        await targetMessage.save();

        await messageModel.deleteMany({
            chat: chat._id,
            createdAt: { $gt: targetMessage.createdAt }
        });

        const conversation = await loadConversation(chat._id);

        const result = await aiService.generateResponse(conversation, {
            model: requestedModel || chat.preferredModel,
            mode: requestedMode || chat.roleMode,
            tool: requestedTool || chat.toolMode,
        });
        const reply = typeof result === 'string' ? result : result?.reply;

        if (!reply?.trim()) {
            return res.status(500).json({
                success: false,
                message: FALLBACK_REPLY
            });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chat._id,
            content: reply.trim(),
            role: "model",
            model: result?.model || chat.preferredModel || '',
            usage: result?.usage || undefined,
        });

        chat.lastActivity = new Date();
        chat.preferredModel = result?.model || requestedModel || chat.preferredModel;
        chat.roleMode = requestedMode || chat.roleMode;
        chat.toolMode = requestedTool || chat.toolMode;
        await chat.save();

        return res.json({
            success: true,
            reply: reply.trim(),
            chat: serializeChat(chat),
            model: result?.model || chat.preferredModel,
            usage: result?.usage || null,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: FALLBACK_REPLY
        });
    }
}

/* DELETE CHAT */
async function deleteChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chat = await findOwnedChat(req.params.id, req.user._id);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await messageModel.deleteMany({ chat: req.params.id });
        await chatModel.deleteOne({ _id: chat._id });

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

module.exports = {
    createChat,
    getChats,
    getMessages,
    sendMessage,
    updateMessage,
    deleteChat
};
