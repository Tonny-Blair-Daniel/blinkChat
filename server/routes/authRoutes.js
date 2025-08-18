const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../emailService');
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

        res.status(201).json({ msg: 'User created. Please verify your email.', userId: newUser._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/verify', async (req, res) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
        return res.status(400).json({ msg: 'User ID and verification code are required' });
    }

    try {
        const user = await User.findById(userId);
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

module.exports = router;
/*

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../emailService');
const router = express.Router();

const pendingUsers = new Map(); // In-memory store for unverified users

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

        // Store in memory instead of database
        pendingUsers.set(email, {
            username,
            email,
            passwordHash,
            verificationCode,
            verificationCodeExpires
        });

        await sendVerificationEmail(email, verificationCode);

        res.status(201).json({ msg: 'Verification code sent. Please verify your email.', email });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/verify', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ msg: 'Email and verification code are required' });
    }

    const pendingUser = pendingUsers.get(email);

    if (!pendingUser) {
        return res.status(404).json({ msg: 'User data not found' });
    }
    if (pendingUser.verificationCode !== code || pendingUser.verificationCodeExpires < Date.now()) {
        pendingUsers.delete(email);
        return res.status(400).json({ msg: 'Invalid or expired verification code' });
    }

    try {
        const newUser = new User({
            username: pendingUser.username,
            email: pendingUser.email,
            passwordHash: pendingUser.passwordHash,
            isVerified: true,
            friends: []
        });
        await newUser.save();
        pendingUsers.delete(email);

        res.status(200).json({ msg: 'Email verified successfully' });
    } catch (err) {
        console.error('Verification error:', err);
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
                id: user._id.toString(),
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;*/