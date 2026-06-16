const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller");

const router = express.Router();

const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many chat requests. Please slow down and try again in a moment.',
    },
});

/* POST /api/chat/ */
router.post('/', authMiddleware.authUser, chatController.createChat);

/* GET /api/chat/ */
router.get('/', authMiddleware.authUser, chatController.getChats);

/* GET /api/chat/messages/:id */
router.get('/messages/:id', authMiddleware.authUser, chatController.getMessages);

/* POST /api/chat/message */
router.post('/message', chatLimiter, authMiddleware.authUser, chatController.sendMessage);

/* PUT /api/chat/message/:messageId */
router.put('/message/:messageId', chatLimiter, authMiddleware.authUser, chatController.updateMessage);

/* DELETE /api/chat/:id */
router.delete('/:id', authMiddleware.authUser, chatController.deleteChat);

module.exports = router;
