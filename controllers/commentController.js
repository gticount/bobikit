const { query } = require('express');

const APIFeatures = require('../utils/apiFeatures');

const Comment = require('../models/comment');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Reply = require('../models/reply');

const handler = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

exports.updateLikeofComment = handler.handleLike(Comment);

exports.updateLikeofReply = handler.handleLike(Reply);
exports.deleteComment = handler.deleteOne(Comment);
exports.deleteReply = handler.deleteOne(Reply);
