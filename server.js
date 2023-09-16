const mongoose = require('mongoose');
const axios = require('axios');

mongoose.set('debug', true);
const http = require('http');

process.on('uncaughtException', (err) => {
  console.log('Uncaught exception shutting down 🔥🔥');
  console.log(err.name, err.message);
  process.exit(1);
});

const dotenv = require('dotenv');

const app = require(`${__dirname}/app`);

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const User = require('./models/user');
//const { Server } = require('mongodb');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then((con) => {
    console.log('DB connected');
  });

mongoose.set('debug', false);

const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
  socket.emit('me', socket.id);

  socket.on('identifyUser', async ({ userId }) => {
    socket.userIdForOnline = userId;
    await User.findByIdAndUpdate(
      userId,
      { lastActive: Date.now(), socketId: socket.id, online: true },
      {
        new: true,
        runValidators: true,
      },
    );
  });

  socket.on('disconnect', async () => {
    await User.findByIdAndUpdate(
      socket.userIdForOnline,
      { lastActive: Date.now(), socketId: '', online: false },
      {
        new: true,
        runValidators: true,
      },
    );
    socket.broadcast.emit('callEnded');
  });

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      username: data.username,
    });
  });

  socket.on('messageSend', (data) => {
    io.to(data.userToMessage).emit('messageReceived', {
      from: data.from,
      message: data.message,
      time: Date.now(),
      user: data.user,
      conversation: data.conversation,
    });
  });

  socket.on('delivered', (data) => {
    io.to(data.userToMessage).emit('updatedelivered', {
      from: data.from,
      message: data.message,
    });
  });

  socket.on('Reacted', (data) => {
    io.to(data.userToMessage).emit('okReact', {
      from: data.from,
      react: data.react,
      messageid: data.messageid,
      user: data.user,
    });
  });

  socket.on('Seen', (data) => {
    io.to(data.userToNotify).emit('seen', {
      from: data.from,
    });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });
});

server.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

const clientId = '4nnz43wrbn6e93v';
const clientSecret = '8bcsfni4n8lvar2';

const data = new URLSearchParams();
data.append('client_id', clientId);
data.append('client_secret', clientSecret);

const refreshToken =
  'NkzMeD3U2AkAAAAAAAAAAc3uzB5tlgujPC-ZkJzgbmBPu6NAkK9iMUTD8Qq4dq41';

data.append('grant_type', 'refresh_token');
data.append('refresh_token', refreshToken);

const refreshDropboxToken = () => {
  axios
    .post('https://api.dropbox.com/oauth2/token', data)
    .then((response) => {
      process.env.DROPBOX_TOKEN = response.data.access_token;
      console.log('Dropbox token refreshed at:', new Date().toLocaleString());
    })
    .catch((error) => {
      console.error('Error refreshing token:', error);
    });
};

// Initial token refresh
refreshDropboxToken();

// Schedule token refresh every 10 minutes
const tokenRefreshInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
setInterval(refreshDropboxToken, tokenRefreshInterval);
