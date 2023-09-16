const express = require('express');

const userController = require(`${__dirname}/../controllers/userController`);

const authController = require('../controllers/authController');

const messageRouter = require(`${__dirname}/../routes/messageRoutes`);
const postRouter = require(`${__dirname}/../routes/postRoutes`);
const storyRouter = require(`${__dirname}/../routes/storyRoutes`);
const imageUtils = require('../utils/imageUtils');
const postController = require('../controllers/postController');
const storyController = require('../controllers/storyController');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/*router.use('/:userId/posts/', postRouter);
router.use('/:userId/conversations/', messageRouter);
router.use('/:userId/stories/', storyRouter);*/

router.use(authController.protect);

router.route('/follow').post(userController.updateFollow);
router.route('/findSeen').post(userController.getSeen);

router.route('/findFollowing/:id').get(userController.getFollowing);
router.route('/findFollowers/:id').get(userController.getFollowers);

router.route('/recentSearch').get(userController.recentSearch);

router.route('/search/:searchString').get(userController.search);
router
  .route('/updatRecentSearch/:userId')
  .get(userController.updateRecentSearch);

router.route('/me').get(userController.getMe).patch(userController.updateUser);
router.route('/mute').post(userController.updateUser);

router.route('/findsuggestions').get(userController.findFriendSuggestions);
router.route('/findPosts/:userID?').get(userController.findMyPosts);
router.route('/findStories/:userID?').get(userController.findMyStories);

router.route('/:userId').get(userController.getUser);

router
  .route('/createUploadPostImages/:postId')
  .post(
    userController.uploadUserMedia,
    imageUtils.resizePhotos,
    postController.updatePost,
  );

router
  .route('/createProfileUpload')
  .post(
    userController.uploadSingleImage,
    imageUtils.resizePhotos,
    userController.updateUser,
  );

router
  .route('/createUploadPostAudios/:postId')
  .post(
    userController.uploadUserAudio,
    imageUtils.trimAudio,
    postController.updatePost,
  );

router
  .route('/createUploadStoryImage/:storyId')
  .post(
    userController.uploadSingleImage,
    imageUtils.resizePhotos,
    storyController.updateStory,
  );

router
  .route('/createUploadStoryAudio/:storyId')
  .post(
    userController.uploadSingleAudio,
    imageUtils.trimAudio,
    storyController.updateStory,
  );

router
  .route('/createUploadMessageImage/:messageId')
  .post(
    userController.uploadSingleImage,
    imageUtils.resizePhotos,
    messageController.updateMessage,
  );

router
  .route('/:userId')
  .delete(authController.restrict('admin'), userController.deleteUser);

router
  .route('/')
  .post(authController.restrict('admin'), userController.postNewUser);

module.exports = router;
