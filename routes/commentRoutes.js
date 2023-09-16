const express = require('express');

const commentController = require(`${__dirname}/../controllers/commentController`);
const userController = require(`${__dirname}/../controllers/userController`);
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/comment/like/:id').post(commentController.updateLikeofComment);
router.route('/reply/like/:id').post(commentController.updateLikeofReply);

router.route('/comment/:id').delete(commentController.deleteComment);
router.route('/reply/:id').delete(commentController.deleteReply);

module.exports = router;
