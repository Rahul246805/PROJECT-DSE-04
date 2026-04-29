const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/mail.service');

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_WINDOW_MS = 1000 * 60 * 30;

function getBaseAppUrl(req) {
    return (
        process.env.FRONTEND_URL ||
        process.env.PUBLIC_APP_URL ||
        `${req.protocol}://${req.get('host')}`
    );
}

function normalizeEmail(email) {
    return email?.trim().toLowerCase();
}

function getSafeUser(user) {
    return {
        email: user.email,
        _id: user._id,
        fullName: user.fullName
    };
}

function validateRegistrationPayload(payload) {
    const firstName = payload?.fullName?.firstName?.trim();
    const lastName = payload?.fullName?.lastName?.trim();
    const email = normalizeEmail(payload?.email);
    const password = payload?.password;

    if (!firstName || !lastName || !email || !password) {
        return 'All fields are required';
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return 'Password must include upper, lower, and numeric characters';
    }

    return '';
}

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE,
    });
}

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function registerUser(req, res) {
    try {
        const validationMessage = validateRegistrationPayload(req.body);

        if (validationMessage) {
            return res.status(400).json({ success: false, message: validationMessage });
        }

        const firstName = req.body.fullName.firstName.trim();
        const lastName = req.body.fullName.lastName.trim();
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        const isUserAlreadyExists = await userModel.findOne({ email });

        if (isUserAlreadyExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            fullName: {
                firstName,
                lastName
            },
            email,
            password: hashPassword
        });

        const token = createToken(user._id);
        setAuthCookie(res, token);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: getSafeUser(user)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
}

async function loginUser(req, res) {
    try {
        const email = normalizeEmail(req.body?.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await userModel.findOne({ email });

        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = createToken(user._id);
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token,
            user: getSafeUser(user)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
}

async function loginGuestUser(req, res) {
    try {
        const guestId = crypto.randomBytes(6).toString('hex');
        const guestEmail = `guest-${guestId}@mate.ai`;

        const guestUser = await userModel.create({
            email: guestEmail,
            fullName: {
                firstName: 'Mate',
                lastName: 'Guest',
            },
            password: '',
        });

        const token = createToken(guestUser._id);
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'Guest session created successfully',
            token,
            user: getSafeUser(guestUser),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to create guest session',
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists for that email, a reset link has been sent.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedResetToken;
        user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_WINDOW_MS);
        await user.save();

        const resetUrl = `${getBaseAppUrl(req).replace(/\/$/, '')}/reset-password/${resetToken}`;
        const delivery = await sendPasswordResetEmail({
            to: user.email,
            resetUrl,
            firstName: user.fullName?.firstName || 'there',
        });

        return res.status(200).json({
            success: true,
            message: 'If an account exists for that email, a reset link has been sent.',
            ...(delivery.previewUrl ? { previewUrl: delivery.previewUrl } : {}),
            ...(delivery.devModeResetUrl ? { resetUrl: delivery.devModeResetUrl } : {}),
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Unable to send reset link'
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and password are required'
            });
        }

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and include upper, lower, and numeric characters'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await userModel.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Reset link is invalid or has expired'
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to reset password'
        });
    }
}

async function logoutUser(req, res) {
    try {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
}

async function getCurrentUser(req, res) {
    try {
        return res.status(200).json({
            success: true,
            user: getSafeUser(req.user)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to load current user'
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    loginGuestUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    logoutUser
};
