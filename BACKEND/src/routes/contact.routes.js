const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContactForm } = require('../controllers/contact.controller');

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many messages sent. Please wait and try again.'
    }
});

router.post('/', contactLimiter, submitContactForm);

module.exports = router;
