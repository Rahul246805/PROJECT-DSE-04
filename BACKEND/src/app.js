const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require("./routes/chat.routes");


const app = express();
const staticIndexFile = path.join(__dirname, '../../FRONTEND/dist/index.html');
const staticDir = staticIndexFile ? path.dirname(staticIndexFile) : null;

/* using middlewares */
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

if (fs.existsSync(staticIndexFile)) {
    app.use(express.static(staticDir));
}



/* Using Routes */
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes);
app.use('/api/chat', chatRoutes);


app.get("/", (req, res) => {
    if (fs.existsSync(staticIndexFile)) {
        return res.sendFile(staticIndexFile);
    }

    return res.status(200).json({
        success: true,
        message: 'Mate.ai backend is running',
    });
});

app.get("*name", (req, res) => {
    if (fs.existsSync(staticIndexFile)) {
        return res.sendFile(staticIndexFile);
    }

    return res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

module.exports = app;
