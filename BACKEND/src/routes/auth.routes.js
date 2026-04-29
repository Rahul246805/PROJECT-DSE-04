const express = require('express');
const rateLimit = require('express-rate-limit');
const authControllers = require("../controllers/auth.controller")
const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    }
});

router.post("/register", authLimiter, authControllers.registerUser)
router.post("/login", authLimiter, authControllers.loginUser)
router.post("/forgot-password", authLimiter, authControllers.forgotPassword)
router.post("/reset-password/:token", authLimiter, authControllers.resetPassword)
router.post("/guest", authControllers.loginGuestUser)
router.post("/logout", authControllers.logoutUser)
router.get("/me", require("../middlewares/auth.middleware").authUser, authControllers.getCurrentUser)

module.exports = router;
