const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
    });
}

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET);
}

async function registerUser(req, res) {
    try {
        const { fullName: { firstName, lastName }, email, password } = req.body;

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
            user: {
                email: user.email,
                _id: user._id,
                fullName: user.fullName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
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
            user: {
                email: user.email,
                _id: user._id,
                fullName: user.fullName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
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
            user: {
                email: guestUser.email,
                _id: guestUser._id,
                fullName: guestUser.fullName,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to create guest session',
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

module.exports = {
    registerUser,
    loginUser,
    loginGuestUser,
    logoutUser
};
