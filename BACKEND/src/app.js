// src/app.js

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require("./routes/chat.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();

/* ================= CORS FIX ================= */

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://project-dse-04.onrender.com', // 🔥 IMPORTANT
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true
}));

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

/* ================= FRONTEND SERVING ================= */

const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));

// 🔥 React routing fix (IMPORTANT)
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

/* ================= EXPORT ================= */

module.exports = app;