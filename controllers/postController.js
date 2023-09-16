const { query } = require('express');

const APIFeatures = require('../utils/apiFeatures');

const Post = require('../models/post');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Comment = require('../models/comment');
const Reply = require('../models/reply');

const handler = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

exports.getAllPost = handler.getPostsOrStory(Post, 'study');

exports.getParticularPost = catchAsync(async (req, res, next) => {
  const doc = await Post.findById(req.params.postId)
    .populate({
      path: 'user',
      select: ['name', 'username', 'profile', 'photo', 'active'],
    })
    .populate({
      path: 'comments',
      select: ['user', 'createdAt', 'likes', 'content', 'post', 'replies'],
      populate: [
        {
          path: 'user',
          select: ['name', 'username', 'photo', 'active'],
        },
        {
          path: 'replies',
          select: ['user', 'comment', 'createdAt', 'likes', 'content'],
          populate: {
            path: 'user',
            select: ['name', 'username', 'photo', 'active'],
          },
        },
      ],
    });

  if (!doc) next(new AppError('post not found', 404));
  res.status(200).json({
    status: 'success',
    results: 1, // Assuming you're fetching a single user
    requestedAt: req.reqTime,
    data: {
      doc: doc,
    },
  });
});

exports.verify = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({
    _id: req.params.postId,
    user: req.user._id,
  });
  if (!post) return next(new AppError('cannot perform this action'));
  next();
});

exports.postComment = handler.postComment(Comment, Post, 'comments');
exports.postReply = handler.postComment(Reply, Comment, 'replies');

exports.updateLike = handler.handleLike(Post);

exports.postNewPost = handler.postGeneral(Post, 'posts');

exports.updatePost = handler.updateOne(Post);

exports.deletePost = catchAsync(async (req, res, next) => {
  const doc = await Post.findByIdAndUpdate(
    req.params.postId,
    { archived: true },
    { new: true },
  );
  if (!doc) {
    return next(new AppError('No document found with that Id', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
