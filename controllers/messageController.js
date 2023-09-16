{
  /*eslint-disable*/
}
const { query } = require('express');

const APIFeatures = require('../utils/apiFeatures');

const Conversation = require('../models/conversation');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Message = require('../models/message');

const handler = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

exports.getAllConversation = catchAsync(async (req, res, next) => {
  const conversations = await User.findById(req.user._id)
    .select('conversations')
    .populate({
      path: 'conversations',
      select: ['createdAt', 'users', 'lastMessage'],
      populate: [
        {
          path: 'users',
          select: ['username', 'name', 'photo', 'smallPhoto', 'largePhoto'],
          match: { _id: { $ne: req.user._id } }, // Exclude current user
        },
        {
          path: 'lastMessage',
        },
      ],
    });

  // Remove req.user from the users array in each conversation
  conversations.conversations.forEach((conversation) => {
    conversation.users = conversation.users.filter(
      (user) => !user.equals(req.user),
    );
  });

  res.status(200).json({
    status: 'success',
    results: conversations.length, // Assuming you're fetching a single user
    requestedAt: req.reqTime,
    data: {
      doc: conversations.conversations,
    },
  });
});

exports.verify = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(
    req.params.conversationId,
  ).populate({
    path: 'users',
    select: [
      'username',
      'name',
      'photo',
      'active',
      'online',
      'socketId',
      'lastActive',
    ],
  });

  if (!conversation) {
    return next(new AppError('U are not authorized', 404));
  }
  const index = conversation.users.findIndex(
    (user) => user._id.toString() === req.user._id.toString(),
  );

  if (index !== -1) {
    conversation.users.splice(index, 1);
    req.dataofConvo = conversation;
    next();
  } else {
    next(new AppError('U are not authorized', 404));
  }
});

exports.getParticularConversation = catchAsync(async (req, res, next) => {
  const filter = { archived: { $in: [false] } };
  if (req.params.conversationId)
    filter.conversation = req.params.conversationId;
  const features = new APIFeatures(Message.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //const doc = await features.query.explain();
  const doc = await features.query;
  if (!doc) next(new AppError('No content found', 404));

  const sortedDoc = await Promise.all(
    doc.map(async (message) => {
      return {
        _id: message._id,
        conversation: message.conversation,
        sender: message.sender,
        receiver: message.receiver,
        createdAt: new Date(message.createdAt).getTime(),
        type: message.type,
        content: message.content,
        likes: message.likes,
        delivered: message.delivered,
        seen: message.seen,
      };
    }),
  );

  sortedDoc.sort((a, b) => a.createdAt - b.createdAt);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    requestedAt: req.reqTime,
    data: {
      doc: sortedDoc,
      conversation: req.dataofConvo,
    },
  });
});

exports.sendMessage = catchAsync(async (req, res, next) => {
  const newDoc = await Message.create(req.body);
  const updatedData = {
    lastMessage: newDoc._id.toString(),
  };
  const updatedConversation = await Conversation.findByIdAndUpdate(
    req.params.conversationId,
    updatedData,
    { new: true },
  );
  res.status(201).json({
    status: 'success',
    data: {
      doc: newDoc,
    },
  });
});

exports.updateMessage = catchAsync(async (req, res, next) => {
  const updatedDocument = await Message.findByIdAndUpdate(
    req.params.messageId,
    req.body,
    { new: true },
  );
  res.status(200).json({
    status: 'success',
    results: 1,
    requestedAt: req.reqTime,
    data: {
      doc: updatedDocument,
    },
  });
});

exports.updateLike = handler.handleLike(Message);

exports.deleteConversation = handler.deleteOne(Conversation);

exports.createConversation = handler.postGeneral(Conversation, 'conversations');
