const path = require('path');
const express = require('express');

const morgan = require('morgan');

const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const hpp = require('hpp');

const cookieParser = require('cookie-parser');

const compression = require('compression');
const axios = require('axios');

const userRouter = require(`${__dirname}/routes/userRoutes`);
const postRouter = require(`${__dirname}/routes/postRoutes`);
const messageRouter = require(`${__dirname}/routes/messageRoutes`);
const storyRouter = require(`${__dirname}/routes/storyRoutes`);
const commentRouter = require(`${__dirname}/routes/commentRoutes`);

const cors = require('cors');

const app = express();

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//serving static files
app.use(express.static(path.join(__dirname, 'public')));

//development blocking
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests from same api
const limiter = rateLimit({
  max: 50000,
  windowMs: 2 * 60 * 1000,
  message: 'Too many requests, please try again in an hour',
});

app.use('/api', limiter);
app.use(cors());

//body parser, reading data from body into req.body
app.use(express.json({ limit: '40KB' }));
//app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against Nosql query injection
app.use(mongoSanitize());

// data sanitization for xss
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

//app.use('/api/v1/posts', postRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/stories', storyRouter);
app.use('/api/v1/conversations', messageRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/commentOrReply', commentRouter);
//app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`));
});

module.exports = app;
