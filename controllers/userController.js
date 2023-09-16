const { query } = require('express');

const multer = require('multer');

const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');

const handler = require('./handlerFactory');
const Post = require('../models/post');
const Story = require('../models/story');
const AppError = require('../utils/appError');

const imageUtils = require('../utils/imageUtils');

const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  fileFilter: imageUtils.multerFilter,
});

/////////////////////////////////////////////////////get me /////////////////////////////////////////////
exports.getMe = catchAsync(async (req, res, next) => {
  const userdata = await User.findById(req.user._id).select(
    'name username photo status friends socketId phoneNumber email profile smallPhoto largePhoto conversations mute',
  );
  if (!userdata) return next(new AppError('User not found', 404));

  const followersCount = await User.countDocuments({
    friends: req.user._id,
  });
  const followingCount = userdata.friends.length;

  const user = {
    ...userdata._doc,
    followers: followersCount,
    following: followingCount,
  };

  res.status(200).json({
    status: 'success',
    results: 1, // Assuming you're fetching a single user
    requestedAt: req.reqTime,
    data: {
      user,
    },
  });
});

exports.userAuthenticator = catchAsync(async (req, res, next) => {
  if (req.params.userId === req.user._id || req.user.role === 'admin') {
    req.owner = true;
    return next();
  }
  const friend = await User.findById(req.params.userId)
    .select('friends profile')
    .exec();
  if (friend.friends.includes(req.user._id) || friend.profile === 'public') {
    req.owner = false;
    req.friends = true;
  }
  next();
});

////////////////////////////////////////////////find suggestions ///////////////////////////////////////////
exports.findFriendSuggestions = catchAsync(async (req, res, next) => {
  // Step 1: Retrieve the user's friends
  const user = await User.findById(req.user._id).select('friends');
  const userFriends = user.friends;

  // Step 2: Retrieve the friends of the user's friends
  const friendsOfFriends = await User.find(
    { _id: { $in: userFriends } },
    'friends',
  );

  // Combine all friends of friends into a single array
  const allFriendsOfFriends = friendsOfFriends
    .map((friend) => friend.friends)
    .flat();

  // Step 3: Filter out the user's friends and the user
  const uniqueSuggestions = allFriendsOfFriends.filter(
    (friendId) =>
      !userFriends.includes(friendId.toString()) &&
      friendId.toString() !== req.user._id.toString(),
  );

  // Step 4: Retrieve and return the friend suggestions (excluding the user)
  const suggestions = await User.find(
    { _id: { $in: uniqueSuggestions, $ne: req.user._id } },
    'name username photo friends smallPhoto largePhoto',
  );

  // Step 5: Calculate the number of mutual friends for each suggestion
  let suggestionsWithMutualFriends = suggestions.map((suggestion) => {
    const mutualFriends = suggestion.friends.filter((friendId) =>
      userFriends.includes(friendId.toString()),
    );
    return {
      ...suggestion._doc,
      mutualFriendsCount: mutualFriends.length,
    };
  });

  if (suggestionsWithMutualFriends.length === 0) {
    const users = await User.find({ _id: { $nin: req.user._id } }).select(
      'smallPhoto largePhoto photo friends username name',
    );
    suggestionsWithMutualFriends = users.map((suggestion) => {
      return { ...suggestion._doc, mutualFriendsCount: 0 };
    });
  }

  res.status(200).json({
    status: 'success',
    results: suggestionsWithMutualFriends.length,
    requestedAt: req.reqTime,
    data: {
      suggestions: suggestionsWithMutualFriends,
    },
  });
});

//////////////////////////////////////////////////////////////////////////////find my posts ///////////////////////////////////////////////
exports.findMyPosts = catchAsync(async (req, res, next) => {
  let target;
  let posts;
  if (req.params.userID) {
    target = req.params.userID;
    const user = await User.find({ username: target }).select('id');
    posts = await Post.find({ user: user[0]._id }).sort({ createdAt: -1 });
  } else {
    target = req.user._id;
    posts = await Post.find({ user: target }).sort({ createdAt: -1 });
  }
  if (!posts) next(new AppError('Have no posts', 404));
  res.status(200).json({
    status: 'success',
    results: posts.length,
    requestedAt: req.reqTime,
    data: {
      posts,
    },
  });
});
//////////////////////////////////////////////////////////////////////////////find my stories //////////////////////////////////
exports.findMyStories = handler.getPostsOrStory(Story, 'foosball');

/////////////////////////////////////////////////////get a user //////////////////////////////////////////////////
exports.getUser = catchAsync(async (req, res, next) => {
  const my = req.user.friends;
  const id = await User.findOne({ username: req.params.userId });
  const userdata = await User.findById(id._id).select(
    'name username photo status friends profile largePhoto smallPhoto conversations mute',
  );
  if (!userdata) return next(new AppError('User not found', 404));

  const followersCount = await User.countDocuments({
    friends: id._id,
  });
  const followingCount = userdata.friends.length;

  const followedBy = userdata.friends.includes(req.user);
  const followStatus = my.includes(id._id);

  const user = {
    ...userdata._doc,
    followers: followersCount,
    following: followingCount,
    followedBy: followedBy,
    followStatus: followStatus,
  };

  res.status(200).json({
    status: 'success',
    results: 1, // Assuming you're fetching a single user
    requestedAt: req.reqTime,
    data: {
      user,
    },
  });
});

exports.search = catchAsync(async (req, res, next) => {
  const { searchString } = req.params;

  const users = await User.find({
    $or: [
      { username: { $regex: searchString, $options: 'i' } },
      { name: { $regex: searchString, $options: 'i' } },
    ],
  }).select('name username photo');

  res.status(200).json({
    status: 'success',
    results: users.length,
    requestedAt: req.reqTime,
    data: {
      doc: users,
    },
  });
});

exports.recentSearch = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('recentSearches')
    .populate({
      path: 'recentSearches',
      select: ['name', 'username', 'photo'],
    });

  res.status(200).json({
    status: 'success',
    results: 1,
    requestedAt: req.reqTime,
    data: {
      doc: user,
    },
  });
});

exports.updateRecentSearch = catchAsync(async (req, res, next) => {
  try {
    const userIdToAdd = req.params.userId;

    // Find the user by user ID
    const user = await User.findById(req.user._id.toString());

    // Check if the user is found
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Add userIdToAdd to the beginning of the recentSearches array
    user.recentSearches.unshift(userIdToAdd);

    // Save the updated user document
    const updatedUser = await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        doc: updatedUser,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    results: 1,
    requestedAt: req.reqTime,
  });
});

exports.getFollowing = catchAsync(async (req, res, next) => {
  const following = await User.findById(req.params.id)
    .select('friends')
    .populate({
      path: 'friends',
      select: ['name', 'username', 'smallPhoto', 'largePhoto', 'friends'],
    });

  if (!following) {
    return next(new AppError('not found ', 404));
  }

  // Add a boolean field 'isFriend' to each friend indicating if they are friends of the user
  const friendsWithIsFriendField = following.friends.map((friend) => ({
    ...friend._doc,
    isFriend: req.user.friends.includes(friend._id),
  }));

  res.status(200).json({
    status: 'success',
    results: friendsWithIsFriendField.length,
    requestedAt: req.reqTime,
    data: {
      doc: friendsWithIsFriendField,
    },
  });
});

exports.getFollowers = catchAsync(async (req, res, next) => {
  const followers = await User.aggregate([
    {
      $match: {
        friends: req.user._id, // Match users where req.user._id is in the friends array
      },
    },
    {
      $project: {
        _id: 1, // Include the _id field
        name: 1, // Include the name field
        username: 1,
        smallPhoto: 1,
        largePhoto: 1,
        friends: 1,
      },
    },
  ]);

  if (!followers) {
    return next(new AppError('not found ', 404));
  }

  // Add a boolean field 'isFriend' to each friend indicating if they are friends of the user
  const friendsWithIsFriendField = followers.map((friend) => {
    friend.isFriend = req.user.friends.includes(friend._id);
    return friend;
  });

  res.status(200).json({
    status: 'success',
    results: friendsWithIsFriendField.length,
    requestedAt: req.reqTime,
    data: {
      doc: friendsWithIsFriendField,
    },
  });
});

exports.updateFollow = catchAsync(async (req, res, next) => {
  const useri = await User.findById(req.user._id);
  const { friends } = useri;
  let friendi = friends;
  if (req.body.follow === true) {
    if (!friends.includes(req.body.user)) friendi.push(req.body.user);
  } else if (friends.includes(req.body.user)) {
    friendi = friends.filter(
      (item) => item.toString() !== req.body.user.toString(),
    );
  }
  const body = { friends: friendi };

  const user = await User.findByIdAndUpdate(req.user._id, body, { new: true });

  res.status(200).json({
    status: 'success',
    results: 1,
    requestedAt: req.reqTime,
    data: {
      doc: user,
    },
  });
});

exports.uploadUserMedia = upload.array('image', 10);
exports.uploadUserAudio = upload.array('audio', 10);
exports.uploadSingleImage = upload.single('image');
exports.uploadSingleAudio = upload.single('audio');

exports.getSeen = catchAsync(async (req, res, next) => {
  const result = [];

  if (Array.isArray(req.body.users) && req.body.users.length > 0) {
    // Iterate through each row of the 2-dimensional array
    for (const userRow of req.body.users) {
      // Find users by their IDs in the current row
      const usersForRow = await User.find({ _id: { $in: userRow } });

      result.push(usersForRow);
    }
  }

  // 'result' now contains the 2-dimensional array of users
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.postNewUser = handler.createOne(User);

exports.deleteUser = handler.deleteOne(User);
