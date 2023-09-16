const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Posts cannot be anonymous'],
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
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
  replies: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Reply',
    },
  ],
});

const Comment = mongoose.model('Comment', postSchema);

module.exports = Comment;
