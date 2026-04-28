const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

function getTokenFromRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return req.cookies?.token;
}

async function authUser(req, res, next) {

    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id)

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;

        next()

    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }

}

module.exports = {
    authUser
}
