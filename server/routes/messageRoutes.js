const express = require('express');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const unreadCounts = {};

        const unreadMessages = await Message.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(userId),
                    readBy: { $nin: [new mongoose.Types.ObjectId(userId)] }
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            }
        ]);

        unreadMessages.forEach(item => {
            unreadCounts[item._id] = item.count;
        });

        res.json(unreadCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/:myId/:theirId', async (req, res) => {
    try {
        const { myId, theirId } = req.params;
        const msgs = await Message.find({
            $or: [
                { sender: myId, receiver: theirId },
                { sender: theirId, receiver: myId }
            ]
        }).sort('timestamp');
        res.json(msgs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/markAsRead', async (req, res) => {
    try {
        const { readerId, chatPartnerId } = req.body;

        await Message.updateMany(
            {
                sender: chatPartnerId,
                receiver: readerId,
                readBy: { $nin: [readerId] }
            },
            {
                $addToSet: { readBy: readerId },
                $set: { deleteAfter: null } // Clear deleteAfter when marked as read
            }
        );
        res.status(200).json({ msg: 'Messages marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;