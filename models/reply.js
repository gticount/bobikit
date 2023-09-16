const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Posts cannot be anonymous'],
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    required: [true, 'Posts cannot be anonymous'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  content: {
    type: String,
    required: true,
  },
});

const Reply = mongoose.model('Reply', postSchema);

module.exports = Reply;
