const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../emailService');
const router = express.Router();

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ msg: 'All fields are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ msg: 'Username or email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const newUser = new User({
            username,
            email,
            passwordHash,
            verificationCode,
            verificationCodeExpires,
            isVerified: false
        });
        await newUser.save();

        await sendVerificationEmail(email, verificationCode);

        res.status(201).json({ msg: 'User created. Please verify your email.', userId: newUser._id, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/verify', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ msg: 'Email and verification code are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ msg: 'User already verified' });
        }
        if (user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        res.status(200).json({ msg: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ msg: 'Please verify your email before logging in' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        res.status(200).json({
            msg: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const resetCode = generateVerificationCode();
        const resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpires = resetPasswordCodeExpires;
        await user.save();

        await sendPasswordResetEmail(email, resetCode);

        res.status(200).json({ msg: 'Password reset code sent', email });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/reset-password/verify', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ msg: 'Email and reset code are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.resetPasswordCode !== code || user.resetPasswordCodeExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired reset code' });
        }

        res.status(200).json({ msg: 'Reset code verified successfully' });
    } catch (err) {
        console.error('Reset code verification error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/reset-password/confirm', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ msg: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!user.resetPasswordCode || user.resetPasswordCodeExpires < Date.now()) {
            return res.status(400).json({ msg: 'No valid reset code found' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.passwordHash = passwordHash;
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpires = null;
        await user.save();

        res.status(200).json({ msg: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password confirmation error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;