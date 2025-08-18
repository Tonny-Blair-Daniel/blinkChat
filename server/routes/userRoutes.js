const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/validate/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('_id');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json({ msg: 'User valid' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/others/:userId', async (req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId).select('friends');
        const others = await User.find({
            _id: { $ne: req.params.userId, $nin: currentUser.friends }
        }).select('username _id');
        res.json(others);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/friends/:userId/add', async (req, res) => {
    try {
        const me = await User.findById(req.params.userId);
        const friend = await User.findById(req.body.friendId);
        if (!friend) return res.status(404).json({ msg: 'User not found' });
        if (!me.friends.includes(friend._id)) {
            me.friends.push(friend._id);
            await me.save();
        }
        res.json({ msg: 'Friend added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/friends/:userId/remove/:friendId', async (req, res) => {
    try {
        const me = await User.findById(req.params.userId);
        me.friends = me.friends.filter(f => f.toString() !== req.params.friendId);
        await me.save();
        res.json({ msg: 'Friend removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/friends/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('friends', 'username _id');
        res.json(user.friends);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;