const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false }
});
module.exports = mongoose.model('User', userSchema);