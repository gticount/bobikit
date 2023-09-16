const { model } = require('mongoose');
const util = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const User = require('../models/user');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const Comment = require('../models/comment');
const Reply = require('../models/reply');
const Story = require('../models/story');

const getStoryGroups = async (todel, frindi, did, truthvalue) => {
  const matchConditions = truthvalue
    ? [{ archived: false }]
    : [{ archived: true }];
  const secondmatch = truthvalue
    ? [{ user: did }, { user: { $in: frindi } }, { 'user.profile': true }]
    : [{ user: did }];
  const restru = await todel.aggregate([
    {
      $match: {
        $and: matchConditions,
        $or: secondmatch,
      },
    },
    {
      $group: {
        _id: '$user', // Group by the user field
        stories: { $push: '$$ROOT' }, // Store the original documents in an array
      },
    },
    {
      $lookup: {
        from: 'users', // Assuming 'users' is the name of the user collection
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $addFields: {
        sortValue: {
          $cond: {
            if: { $eq: ['$user._id', did] },
            then: 0, // Sort the requesting user's stories first
            else: 1, // Sort other users' stories second
          },
        },
      },
    },
    {
      $sort: { sortValue: 1 }, // Sort by the custom field
    },
    {
      $project: {
        _id: 0, // Exclude _id field if needed
        user: {
          _id: '$user._id',
          name: '$user.name',
          username: '$user.username',
          photo: '$user.photo',
          largePhoto: '$user.largePhoto',
          smallPhoto: '$user.smallPhoto',
          conversations: '$user.conversations',
          profile: '$user.profile',
          active: '$user.active',
          // Add other user fields as needed
        },
        stories: 1, // Include the array of story documents
      },
    },
  ]);

  return restru;
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that Id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const id = `${Model.modelName.toLowerCase()}Id`;
    const doc = await Model.findByIdAndUpdate(req.params[id], req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that Id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc: newDoc,
      },
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    const id = `${Model.modelName.toLowerCase()}Id`;

    if (id === 'conversationId') {
      let query = Message.find({ conversation: req.params[id] });
      const doc = await query;
      if (!doc) {
        return next(new AppError('No document found with that Id', 404));
      }
      return res.status(200).json({
        status: 'success',
        results: doc.length,
        requestedAt: req.reqTime,
        data: {
          doc,
        },
      });
    }

    let query = Model.findById(req.params[id]);
    if (popOption) {
      popOption.forEach((el) => {
        query = query.populate(el).exec();
      });
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that Id', 404));
    }
    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedAt: req.reqTime,
      data: {
        doc,
      },
    });
  });

exports.getPostsOrStory = (Model, godel) =>
  catchAsync(async (req, res, next) => {
    const { friends } = req.user;
    let doc;
    const userId = req.user._id;
    if (Model.modelName === 'Post') {
      doc = await Model.find({
        likes: { $nin: [userId] }, // Exclude posts liked by the user
        archived: { $in: [false] },
      })
        .populate({
          path: 'user',
          select: [
            'name',
            'username',
            'photo',
            'smallPhoto',
            'largePhoto',
            'profile',
            'friends',
          ],
        })
        .sort({ createdAt: -1 })
        .skip((req.query.page - 1) * req.query.limit)
        .limit(req.query.limit);

      doc = await doc.filter((doci) => {
        if (doci.user.profile) return true;
        if (
          req.user.friends.includes(doci.user._id) &&
          !req.user.mute.includes(doci.user._id)
        )
          return true;
        return false;
      });
    } else {
      if (godel === 'foosball') {
        let target;
        if (req.params.userID) {
          target = req.params.userID;
          const user = await User.find({ username: target }).select(
            'id friends',
          );
          doc = await getStoryGroups(Model, user.friends, user[0]._id, false);
        } else {
          target = req.user._id;
          doc = await getStoryGroups(Model, friends, req.user._id, false);
        }
      } else doc = await getStoryGroups(Model, friends, req.user._id, true);

      const nonmutedStories = [];
      const seenStories = [];
      const mutedStories = [];

      doc.map((story, indexi) => {
        const storyprops = {
          stories: story.stories,
          user: story.user,
          index: 0,
          seen: false,
          muted: false,
        };
        let findingindex = 0;
        const noofstories = story.stories.length * 1;

        //console.log(story.stories[0].seen, req.user._id.toString());

        if (noofstories === 1) {
          if (
            story.stories[0].seen.findIndex(
              (userids) => userids.toString() === req.user._id.toString(),
            ) !== -1
          )
            findingindex = -1;
        } else {
          findingindex = story.stories.findIndex((storyItem) =>
            storyItem.seen.findIndex(
              (userid) =>
                (userid.toString() !== req.user._id.toString()) !== -1,
            ),
          );
        }

        // findingindex will contain the index of the last match or -1 if there are no matches

        storyprops.muted = req.user.mute.includes(story.user._id);
        if (indexi === 0) {
          if (findingindex === -1) {
            storyprops.seen = true;
          } else {
            storyprops.index = findingindex;
          }
          nonmutedStories.push(storyprops);
        } else if (!storyprops.muted) {
          if (findingindex === -1) {
            storyprops.seen = true;
            seenStories.push(storyprops);
          } else {
            storyprops.index = findingindex;
            nonmutedStories.push(storyprops);
          }
        } else {
          if (findingindex === -1) {
            storyprops.seen = true;
            mutedStories.push(storyprops);
          } else {
            storyprops.index = findingindex;
            mutedStories.push(storyprops);
          }
        }

        return 0;
      });

      doc = [...nonmutedStories, ...seenStories, ...mutedStories];
    }

    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedAt: req.reqTime,
      data: {
        doc,
      },
    });
  });

exports.postGeneral = (Model, fieldname) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    if (fieldname === 'conversations') {
      const user2 = await User.findById(req.body.users[1]);
      user2[fieldname].push(doc._id.toString());
      await user2.save({ validateBeforeSave: false });
    }
    const user = await User.findById(req.user._id);
    user[fieldname].push(doc._id.toString());
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      status: 'success',
      results: 1,
      requestedAt: req.reqTime,
      data: {
        doc: doc,
      },
    });
  });

exports.handleLike = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (Model.modelName === 'Message') {
      doc.likes = req.body.like;
    } else if (doc.likes.includes(req.user._id)) {
      doc.likes = doc.likes.filter(
        (like) => like.toString() !== req.user._id.toString(),
      );
    } else {
      doc.likes.push(req.user._id);
    }
    await doc.save({ runValidators: false });
  });

exports.postComment = (Model, Model2, fieldname) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    const result = await Model.findById(doc._id).populate({
      path: 'user',
      select: ['largePhoto', 'smallPhoto', 'photo', 'name', 'username'],
    });
    const doc2 = await Model2.findById(req.params.id);
    doc2[fieldname].push(doc._id.toString());
    await doc2.save({ validateBeforeSave: false });
    res.status(200).json({
      status: 'success',
      results: 1,
      requestedAt: req.reqTime,
      data: {
        doc: result,
      },
    });
  });
