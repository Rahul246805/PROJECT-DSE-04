const contactModel = require('../models/contact.model');
const { sendContactNotification } = require('../services/mail.service');

async function submitContactForm(req, res) {
    try {
        const name = req.body?.name?.trim();
        const email = req.body?.email?.trim().toLowerCase();
        const subject = req.body?.subject?.trim();
        const message = req.body?.message?.trim();

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All contact form fields are required'
            });
        }

        if (message.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Message must be at least 20 characters long'
            });
        }

        await contactModel.create({
            name,
            email,
            subject,
            message,
        });

        const delivery = await sendContactNotification({
            contactEmail: email,
            name,
            subject,
            message,
        });

        return res.status(201).json({
            success: true,
            message: 'Thanks for reaching out. Your message has been sent.',
            ...(delivery.previewUrl ? { previewUrl: delivery.previewUrl } : {}),
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Unable to send your message right now'
        });
    }
}

module.exports = {
    submitContactForm,
};
