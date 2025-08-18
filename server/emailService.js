const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log('[DEBUG] EMAIL_USER:', process.env.EMAIL_USER);
console.log('[DEBUG] EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Loaded' : '❌ MISSING');


async function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'blinkChat Verification Code',
        text: `Your verification code for blinkChat is: ${code}\nThis code is valid for 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (err) {
        console.error('Error sending verification email:', err);
        throw new Error('Failed to send verification email');
    }
}

module.exports = { sendVerificationEmail };