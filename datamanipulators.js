/*eslint-disable*/
const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const Reply = require('./models/reply');
const Story = require('./models/story');
const Conversation = require('./models/conversation');
const Message = require('./models/message');
const bcrypt = require('bcryptjs');

User.schema.set('validateBeforeSave', false);

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then((con) => {
    console.log('DB connected');
  });

/*const axios = require('axios');

const authorizationCode = '8_PR9XT_rQEAAAAAAAABCWOswHbr0pjVIQy1jRt2COI';
const redirectUri = 'http://localhost:3001/';
const clientId = '4nnz43wrbn6e93v';
const clientSecret = '8bcsfni4n8lvar2';

const data = new URLSearchParams();
//data.append('code', authorizationCode);
//data.append('grant_type', 'authorization_code');
//data.append('redirect_uri', redirectUri);
data.append('client_id', clientId);
data.append('client_secret', clientSecret);

/*axios
  .post('https://api.dropbox.com/oauth2/token', data)
  .then((response) => {
    console.log('Access Token Response:', response.data);
    // Handle the response, which will include the access token
  })
  .catch((error) => {
    console.error('Error exchanging authorization code:', error);
    // Handle the error, e.g., if the code or credentials are invalid
  });*/

/*const refreshToken =
  'NkzMeD3U2AkAAAAAAAAAAc3uzB5tlgujPC-ZkJzgbmBPu6NAkK9iMUTD8Qq4dq41';

data.append('grant_type', 'refresh_token');
data.append('refresh_token', refreshToken);

axios
  .post('https://api.dropbox.com/oauth2/token', data)
  .then((response) => {
    console.log('Access Token Response:', response.data);
    // Handle the response, which will include the new access token
  })
  .catch((error) => {
    console.error('Error refreshing token:', error);
    // Handle the error, e.g., if the refresh token is invalid
  });*/

// Function to update the password by user ID

async function convertArchivedToBoolean() {
  try {
    // Update all Story documents
    await Story.updateMany({}, { $set: { archived: false } });

    // Update all Post documents
    await Post.updateMany({}, { $set: { archived: false } });

    // Update all Message documents
    await Message.updateMany({}, { $set: { archived: false } });

    console.log('Conversion to boolean successful.');
  } catch (error) {
    console.error('Error converting archived field:', error);
  }
}

convertArchivedToBoolean();
