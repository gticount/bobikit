const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Posts cannot be anonymous'],
  },
  location: {
    //GeoJson
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  caption: {
    type: String,
    default: '',
  },
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment',
    },
  ],
  contentAudio: [
    {
      type: String,
    },
  ],
  cover: {
    type: String,
  },
  content: [
    {
      type: String,
    },
  ],
  archived: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
