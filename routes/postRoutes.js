const express = require('express');

const postController = require(`${__dirname}/../controllers/postController`);
const userController = require(`${__dirname}/../controllers/userController`);
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(postController.getAllPost)
  .post(postController.postNewPost);

router.route('/comments/:id').post(postController.postComment);
router.route('/replies/:id').post(postController.postReply);

router.route('/like/:id').post(postController.updateLike);

router.route('/:postId').get(postController.getParticularPost);

router
  .route('/:postId')
  .patch(postController.verify, postController.updatePost)
  .delete(postController.verify, postController.deletePost);

module.exports = router;
