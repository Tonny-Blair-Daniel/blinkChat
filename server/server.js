require('dotenv').config({ debug: true });

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'DELETE']
    }
});

const onlineUsers = {};

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB error:", err));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

/*
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'privacy.html'));
});
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'terms.html'));
});
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'contact.html'));
});
*/

// Cleanup expired unverified users
setInterval(async () => {
    try {
        const now = new Date();
        const deletedUsers = await User.deleteMany({
            isVerified: false,
            verificationCodeExpires: { $lte: now }
        });
        //console.log(`Cleaned up ${deletedUsers.deletedCount} unverified users`);
    } catch (err) {
        //console.error('Error cleaning up unverified users:', err);
    }
}, 60 * 1000); // Run every minute

// Cleanup expired messages
setInterval(async () => {
    try {
        const now = new Date();
        const messagesToDelete = await Message.find({
            deleteAfter: { $ne: null, $lte: now }
        });
        //console.log(`Found ${messagesToDelete.length} messages to delete`);
        for (const msg of messagesToDelete) {
            const receiverId = msg.receiver.toString();
            const senderId = msg.sender.toString();
            await Message.deleteOne({ _id: msg._id });
            //console.log(`Deleted message ${msg._id} from ${senderId} to ${receiverId}`);
            const receiverSocketId = onlineUsers[receiverId];
            const senderSocketId = onlineUsers[senderId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageDeleted', {
                    messageId: msg._id.toString(),
                    senderId: senderId
                });
                //console.log(`Notified receiver ${receiverId} (socket ${receiverSocketId}) of deleted message ${msg._id}`);
            }
            if (senderSocketId && senderSocketId !== receiverSocketId) {
                io.to(senderSocketId).emit('messageDeleted', {
                    messageId: msg._id.toString(),
                    senderId: senderId
                });
                //console.log(`Notified sender ${senderId} (socket ${senderSocketId}) of deleted message ${msg._id}`);
            }
            io.emit('updateUnreadCounts');
        }
    } catch (err) {
        console.error('Error deleting expired messages:', err);
    }
}, 10 * 1000); // Run every 10 seconds

io.on('connection', (socket) => {
    //console.log(`🟢 New socket connection: ${socket.id}`);

    socket.on('setUserId', async (userId) => {
        if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
            socket.emit('error', { msg: 'Invalid user ID' });
            return;
        }
        try {
            const user = await User.findById(userId);
            if (!user || !user.isVerified) {
                socket.emit('error', { msg: 'Invalid or unverified user' });
                return;
            }
            onlineUsers[userId] = socket.id;
            //console.log(`User ${userId} is online with socket ID ${socket.id}`);
            io.emit('userOnlineStatus', onlineUsers);

            const now = new Date();
            const deleteAfterTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes
            await Message.updateMany(
                {
                    receiver: userId,
                    readBy: { $nin: [userId] },
                    deleteAfter: null
                },
                { $set: { deleteAfter: deleteAfterTime } }
            );
            //console.log(`Set deleteAfter for unread messages of user ${userId}`);
        } catch (err) {
            console.error(`Error setting up user ${userId}:`, err);
            socket.emit('error', { msg: 'Failed to set user online status' });
        }
    });

    socket.on('joinRoom', ({ senderId, receiverId }) => {
        if (!senderId || !receiverId || !/^[0-9a-fA-F]{24}$/.test(senderId) || !/^[0-9a-fA-F]{24}$/.test(receiverId)) {
            socket.emit('error', { msg: 'Invalid room parameters' });
            return;
        }
        const roomId = [senderId.toString(), receiverId.toString()].sort().join('_');
        socket.join(roomId);
        //console.log(`Socket ${socket.id} (user ${senderId}) joined room: ${roomId}`);
    });

    socket.on('sendMessage', async ({ sender, receiver, content }) => {
        if (!sender || !receiver || !content || !/^[0-9a-fA-F]{24}$/.test(sender) || !/^[0-9a-fA-F]{24}$/.test(receiver)) {
            socket.emit('error', { msg: 'Invalid message data' });
            return;
        }
        try {
            const timestamp = new Date();
            const deleteAfterTime = new Date(timestamp.getTime() + 2 * 60 * 1000);
            const newMsg = new Message({
                sender,
                receiver,
                content,
                timestamp,
                readBy: [],
                deleteAfter: onlineUsers[receiver] ? deleteAfterTime : null
            });
            await newMsg.save();

            const senderIdStr = newMsg.sender.toString();
            const receiverIdStr = newMsg.receiver.toString();
            const roomId = [senderIdStr, receiverIdStr].sort().join('_');

            io.to(roomId).emit('receiveMessage', {
                sender: senderIdStr,
                receiver: receiverIdStr,
                content: newMsg.content,
                timestamp: newMsg.timestamp.toISOString(),
                _id: newMsg._id.toString()
            });
            //console.log(`Message emitted to room ${roomId} from ${senderIdStr} to ${receiverIdStr}`);

            const receiverSocketId = onlineUsers[receiverIdStr];
            if (receiverSocketId && receiverSocketId !== socket.id) {
                io.to(receiverSocketId).emit('updateUnreadCounts');
                //console.log(`Emitted updateUnreadCounts to ${receiverIdStr} (socket ${receiverSocketId})`);
            }
        } catch (err) {
            console.error('Error saving message:', err);
            socket.emit('error', { msg: 'Failed to send message' });
        }
    });

    socket.on('disconnect', () => {
        let disconnectedUserId = null;
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                disconnectedUserId = userId;
                delete onlineUsers[userId];
                break;
            }
        }
        if (disconnectedUserId) {
            //console.log(`User ${disconnectedUserId} (socket ID ${socket.id}) disconnected`);
            io.emit('userOnlineStatus', onlineUsers);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));