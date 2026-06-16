const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { syncLocalUserFromClerk } = require('../services/clerk-user.service');

function extractBearerToken(req) {
    const headerValue = req.headers?.authorization || '';

    if (!headerValue.toLowerCase().startsWith('bearer ')) {
        return '';
    }

    return headerValue.slice(7).trim();
}

function extractJwtToken(req) {
    return extractBearerToken(req) || req.cookies?.token || '';
}

async function authenticateWithJwt(req, res, next) {
    const token = extractJwtToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        req.user = user;
        req.auth = {
            strategy: 'jwt',
            userId: String(user._id),
            tokenType: 'local',
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
}

async function authUser(req, res, next) {
    if (!process.env.CLERK_SECRET_KEY) {
        return authenticateWithJwt(req, res, next);
    }

    try {
        const auth = getAuth(req);

        if (auth?.isAuthenticated && auth.userId) {
            const synced = await syncLocalUserFromClerk(auth.userId);

            if (!synced?.localUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Unable to load authenticated user',
                });
            }

            req.auth = auth;
            req.user = synced.localUser;
            req.clerkUser = synced.clerkUser;

            return next();
        }
    } catch (error) {
        console.error('Clerk auth error:', error);
    }

    return authenticateWithJwt(req, res, next);
}

module.exports = {
    authUser,
};
