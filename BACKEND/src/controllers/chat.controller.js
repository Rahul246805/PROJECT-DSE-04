const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('../services/ai.service');
const mongoose = require('mongoose');

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";

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

function serializeChat(chat) {
    return {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
        userId: chat.userId || chat.user
    };
}

/* CREATE CHAT */
async function createChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { title } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ success: false });
        }

        const chat = await chatModel.create({
            user: req.user._id,
            userId: req.user._id,
            title: title.trim()
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

        res.json({ success: true, chats });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

/* GET MESSAGES */
async function getMessages(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

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

        const { message, chatId } = req.body;

        if (!message?.trim() || !chatId) {
            return res.status(400).json({ success: false });
        }

        const chat = await chatModel.findOne(
            buildOwnedChatQuery(chatId, req.user._id)
        );

        if (!chat) {
            return res.status(404).json({ success: false });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: message.trim(),
            role: "user"
        });

        const conversation = await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: 1 })
            .limit(10);

        let reply;

        try {
            reply = await Promise.race([
                aiService.generateResponse(conversation),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("AI timeout")), 10000)
                )
            ]);
        } catch (err) {
            console.error("AI ERROR:", err);
            return res.status(500).json({ success: false });
        }

        if (!reply) {
            return res.status(500).json({ success: false });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: reply,
            role: "model"
        });

        chat.lastActivity = new Date();
        await chat.save();

        res.json({ success: true, reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

/* DELETE CHAT */
async function deleteChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        await messageModel.deleteMany({ chat: req.params.id });
        await chatModel.deleteOne({ _id: req.params.id });

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
    deleteChat
};