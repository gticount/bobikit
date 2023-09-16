const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message should have sender'],
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message should have receiver'],
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message should have receiver'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  type: {
    type: String,
    enum: ['text', 'media'],
  },
  content: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
  },
  likes: {
    type: String,
    default: 0,
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
