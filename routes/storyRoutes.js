const express = require('express');

const storyController = require(`${__dirname}/../controllers/storyController`);
const userController = require(`${__dirname}/../controllers/userController`);
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(storyController.getAllStory)
  .post(storyController.postNewStory);

router.route('/like/:id').post(storyController.updateLike);

router
  .route('/:storyId')
  .get(storyController.getParticularStory)
  .patch(storyController.verify, storyController.updateStory)
  .delete(storyController.verify, storyController.deleteStory);

module.exports = router;
