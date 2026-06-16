const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { clerkMiddleware } = require('@clerk/express');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();
app.set('trust proxy', 1);

if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
} else {
    console.warn('Clerk middleware not enabled because CLERK_SECRET_KEY is missing.');
}

/* ================= CORS ================= */

const normalizeOrigin = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    return value.trim().replace(/\/$/, '');
};

const allowedOrigins = new Set(
    [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,
        process.env.PUBLIC_APP_URL,
        process.env.RENDER_EXTERNAL_URL,
    ]
        .map(normalizeOrigin)
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ================= API ROUTES ================= */

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Mate.ai API is healthy',
    });
});

app.use('/api/{*any}', notFoundHandler);
app.use(errorHandler);

/* ================= FRONTEND SERVING ================= */

const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));

// Express 5 requires named wildcards for SPA fallbacks.
app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

module.exports = app;
