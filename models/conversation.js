const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message',
  },
});

const Conversation = mongoose.model('Conversation', messageSchema);

module.exports = Conversation;
