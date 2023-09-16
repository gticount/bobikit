const { query } = require('express');

const APIFeatures = require('../utils/apiFeatures');

const Story = require('../models/story');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const handler = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const popOption = [
  {
    path: 'user',
    select: ['name', 'username', 'profile', 'photo', 'active'],
  },
];

exports.getAllStory = handler.getPostsOrStory(Story, 'study');

exports.verify = catchAsync(async (req, res, next) => {
  if (req.body.pass) return next();
  const story = await Story.findOne({
    _id: req.params.postId,
    user: req.user._id,
  });
  if (!story) return next(new AppError('cannot perform this action'));
  next();
});

exports.updateLike = handler.handleLike(Story);

exports.getParticularStory = handler.getOne(Story, popOption);

exports.postNewStory = handler.postGeneral(Story, 'stories');

exports.updateStory = handler.updateOne(Story);

exports.deleteStory = catchAsync(async (req, res, next) => {
  const doc = await Story.findByIdAndUpdate(
    req.params.storyId,
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
