function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: 'API route not found',
    });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = error?.statusCode || 500;
    const message = error?.message || 'Internal server error';

    console.error('Unhandled API error:', error);

    return res.status(statusCode).json({
        success: false,
        message,
    });
}

module.exports = {
    errorHandler,
    notFoundHandler,
};
