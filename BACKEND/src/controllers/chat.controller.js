const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('../services/ai.service');
const mongoose = require('mongoose');

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";

function ensureDatabaseReady(res) {
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    res.status(503).json({
        success: false,
        message: 'Database connection is not ready. Please try again in a moment.'
    });

    return false;
}

function buildOwnedChatQuery(chatId, userId) {
    const ownershipFilter = {
        $or: [{ user: userId }, { userId }]
    };

    if (!chatId) {
        return ownershipFilter;
    }

    return {
        _id: chatId,
        ...ownershipFilter
    };
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

async function createChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { title } = req.body;
        const trimmedTitle = title?.trim();

        if (!trimmedTitle) {
            return res.status(400).json({
                success: false,
                message: 'Chat title is required'
            });
        }

        const chat = await chatModel.create({
            user: req.user._id,
            userId: req.user._id,
            title: trimmedTitle
        });

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            chat: serializeChat(chat)
        });
    } catch (error) {
        console.error('createChat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create chat'
        });
    }
}

async function getChats(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chats = await chatModel
            .find(buildOwnedChatQuery(null, req.user._id))
            .sort({ lastActivity: -1 });

        res.status(200).json({
            success: true,
            message: 'Chats retrieved successfully',
            chats: chats.map(serializeChat)
        });
    } catch (error) {
        console.error('getChats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load chats'
        });
    }
}

async function getMessages(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chat = await chatModel.findOne(buildOwnedChatQuery(req.params.id, req.user._id));

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const messages = await messageModel.find({ chat: req.params.id }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            messages
        });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load messages'
        });
    }
}

async function sendMessage(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { message, chatId, userId } = req.body;
        const trimmedMessage = message?.trim();
        const authenticatedUserId = String(req.user._id);

        if (!trimmedMessage || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'message and chatId are required'
            });
        }

        if (userId && String(userId) !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'userId does not match the authenticated user'
            });
        }

        const chat = await chatModel.findOne(buildOwnedChatQuery(chatId, req.user._id));

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (!chat.userId && chat.user) {
            chat.userId = chat.user;
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: trimmedMessage,
            role: 'user'
        });

        const conversation = await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: 1 })
            .limit(12);

        const reply = await aiService.generateResponse(conversation);

        if (!reply || !reply.trim()) {
            return res.status(502).json({
                success: false,
                message: FALLBACK_REPLY
            });
        }

        await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: reply,
            role: 'model'
        });

        chat.lastActivity = new Date();
        await chat.save();

        res.status(200).json({
            success: true,
            reply,
            chat: serializeChat(chat)
        });
    } catch (error) {
        console.error('sendMessage error:', error);
        const statusCode = error.statusCode || 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || FALLBACK_REPLY
        });
    }
}

async function updateMessage(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const trimmedMessage = req.body.content?.trim();

        if (!trimmedMessage) {
            return res.status(400).json({
                success: false,
                message: 'Updated message content is required'
            });
        }

        const originalMessage = await messageModel.findById(req.params.id);

        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (originalMessage.role !== 'user') {
            return res.status(400).json({
                success: false,
                message: 'Only user messages can be edited'
            });
        }

        const chat = await chatModel.findOne(
            buildOwnedChatQuery(originalMessage.chat, req.user._id)
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const orderedMessages = await messageModel
            .find({ chat: chat._id })
            .sort({ createdAt: 1, _id: 1 });

        const messageIndex = orderedMessages.findIndex(
            (message) => String(message._id) === String(originalMessage._id)
        );

        if (messageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Message not found in this chat'
            });
        }

        const messagesToRemove = orderedMessages
            .slice(messageIndex + 1)
            .map((message) => message._id);

        const refreshedConversation = orderedMessages
            .slice(0, messageIndex + 1)
            .map((message) => {
                if (String(message._id) === String(originalMessage._id)) {
                    return {
                        ...message.toObject(),
                        content: trimmedMessage
                    };
                }

                return message;
            });

        const reply = await aiService.generateResponse(refreshedConversation);

        if (!reply || !reply.trim()) {
            return res.status(502).json({
                success: false,
                message: FALLBACK_REPLY
            });
        }

        originalMessage.content = trimmedMessage;
        await originalMessage.save();

        if (messagesToRemove.length > 0) {
            await messageModel.deleteMany({
                _id: { $in: messagesToRemove }
            });
        }

        const aiMessage = await messageModel.create({
            user: req.user._id,
            chat: chat._id,
            content: reply,
            role: 'model'
        });

        if (messageIndex === 0) {
            chat.title = trimmedMessage.length > 48
                ? `${trimmedMessage.slice(0, 48)}...`
                : trimmedMessage;
        }

        chat.lastActivity = new Date();
        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            updatedMessage: originalMessage,
            reply,
            aiMessage,
            removedMessageIds: messagesToRemove.map((id) => String(id)),
            chat: serializeChat(chat)
        });
    } catch (error) {
        console.error('updateMessage error:', error);
        const statusCode = error.statusCode || 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || FALLBACK_REPLY
        });
    }
}

async function deleteChat(req, res) {
    try {
        if (!ensureDatabaseReady(res)) return;

        const chat = await chatModel.findOne(buildOwnedChatQuery(req.params.id, req.user._id));

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await messageModel.deleteMany({ chat: req.params.id });
        await chatModel.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('deleteChat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete chat'
        });
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
