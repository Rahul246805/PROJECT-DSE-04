const nodemailer = require('nodemailer');

function hasSmtpConfig() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

async function createTransport() {
    if (hasSmtpConfig()) {
        return {
            transport: nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: String(process.env.SMTP_SECURE || 'false') === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            }),
            devMode: false,
        };
    }

    if (process.env.NODE_ENV === 'production') {
        const error = new Error('Email transport is not configured');
        error.statusCode = 503;
        throw error;
    }

    return {
        transport: nodemailer.createTransport({
            jsonTransport: true,
        }),
        devMode: true,
    };
}

function fromAddress() {
    return process.env.MAIL_FROM || process.env.SMTP_USER || 'Mate.ai <no-reply@mate.ai>';
}

async function sendPasswordResetEmail({ to, resetUrl, firstName }) {
    const { transport, devMode } = await createTransport();
    const info = await transport.sendMail({
        from: fromAddress(),
        to,
        subject: 'Reset your Mate.ai password',
        text: `Hi ${firstName},\n\nUse this link to reset your Mate.ai password:\n${resetUrl}\n\nThis link expires in 30 minutes.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>Reset your Mate.ai password</h2>
            <p>Hi ${firstName},</p>
            <p>Use the link below to reset your password. This link expires in 30 minutes.</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
          </div>
        `,
    });

    return {
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl?.(info) || '',
        devModeResetUrl: devMode ? resetUrl : '',
    };
}

async function sendContactNotification({ contactEmail, name, subject, message }) {
    const { transport, devMode } = await createTransport();
    const recipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER;

    if (!recipient) {
        if (process.env.NODE_ENV === 'production') {
            const error = new Error('Contact receiver email is not configured');
            error.statusCode = 503;
            throw error;
        }

        return { devMode: true };
    }

    const info = await transport.sendMail({
        from: fromAddress(),
        to: recipient,
        replyTo: contactEmail,
        subject: `[Mate.ai Contact] ${subject}`,
        text: `Name: ${name}\nEmail: ${contactEmail}\nSubject: ${subject}\n\n${message}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>New Mate.ai contact form submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${contactEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p>${message.replace(/\n/g, '<br />')}</p>
          </div>
        `,
    });

    return {
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl?.(info) || '',
        devMode,
    };
}

module.exports = {
    sendContactNotification,
    sendPasswordResetEmail,
};
