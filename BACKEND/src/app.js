const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require("./routes/chat.routes");
const contactRoutes = require("./routes/contact.routes");


const app = express();
const staticIndexFile = path.join(__dirname, '../public/index.html');
const staticDir = staticIndexFile ? path.dirname(staticIndexFile) : null;
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

/* using middlewares */
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (fs.existsSync(staticIndexFile)) {
    app.use(express.static(staticDir));
}



/* Using Routes */
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Mate.ai API is healthy',
    });
});

app.get("/", (req, res) => {
    if (fs.existsSync(staticIndexFile)) {
        return res.sendFile(staticIndexFile);
    }

    return res.status(200).json({
        success: true,
        message: 'Mate.ai backend is running',
    });
});

app.get("/{*path}", (req, res) => {
    if (fs.existsSync(staticIndexFile)) {
        return res.sendFile(staticIndexFile);
    }

    return res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

module.exports = app;
