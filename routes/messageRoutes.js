const express = require('express');

const messageController = require(`${__dirname}/../controllers/messageController`);
const userController = require(`${__dirname}/../controllers/userController`);
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/like/:id').post(messageController.updateLike);

router
  .route('/')
  .get(messageController.getAllConversation)
  .post(messageController.createConversation);

router
  .route('/:conversationId/:messageId?')
  .get(messageController.verify, messageController.getParticularConversation)
  .post(messageController.verify, messageController.sendMessage)
  .patch(messageController.verify, messageController.updateMessage)
  .delete(messageController.deleteConversation);

module.exports = router;
