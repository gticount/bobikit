const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//const Email = require('../utils/email');
//const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
  ),
  secure: true,
  httpOnly: true,
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  else cookieOptions.secure = false;
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

//only for rendering pages and there will be no errors

exports.protect = catchAsync(async (req, res, next) => {
  //getting the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401),
    );
  }

  //validating the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //checking if user still exits

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does no longer exist', 401),
    );
  }

  //check if user changed password after the token was issued
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('The password was changed pls login again', 401));
  }
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrict =
  (...roles) =>
  (req, res, next) => {
    // roles {'admin', 'lead-guide'}
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  //const url = `${req.protocol}://${req.get('host')}/me`;
  //await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password, email, accessToken } = req.body;

  //checking if the email and password exists
  if (!username || !password) {
    if (email && accessToken) {
      const user = await User.findOne({ email }).select('+accessToken');

      if (
        !user ||
        !(await user.correctPassword(accessToken, user.accessToken))
      ) {
        return next(new AppError('Incorrect email or password', 401));
      }

      createSendToken(user, 200, res);
    } else return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ username }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res) => {
  const token = 'loggedout';
  res.status(200).json({
    status: 'success',
    token,
    data: {
      token: token,
    },
  });
});

exports.forgotPassword = async (req, res, next) => {
  //get user based on email
  const user = await User.findOne({ username: req.body.username });

  if (!user) {
    return next(
      new AppError('Your email is not registered...kindly sign up', 404),
    );
  }

  //generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    /*     await sendEmail({
      email: user.email,
      subject: 'Your password reset token valid for 15 min',
      message,
    }); */
    const url = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    //await new Email(user, url).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was some problem pls try again later', 500),
    );
  }

  //next();

  //send it to users email
};

exports.resetPassword = async (req, res, next) => {
  // get the user based on the token
  const token = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ passwordResetToken: token });
  if (!user) return next(new AppError('The link is invalid', 400));

  //checking if the token is expired

  const changedTime = parseInt(user.passwordResetExpires.getTime(), 10);

  if (Date.now() > changedTime) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('The link is expired', 400));
  }

  //encrypting password

  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  await user.save();

  //creating token
  createSendToken(user, 200, res);

  //if the token has not expired then set the password
};

exports.updatePassword = async (req, res, next) => {
  //get user from collection
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new AppError('Pls login again', 401));

  //check if posted current password is correct

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Incorrect old password', 401));
  }

  if (req.body.currentPassword === req.body.newPassword)
    return next(new AppError('Pls type a new password', 401));

  //if it is then update the password and send the jwt
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  await user.save();

  createSendToken(user, 201, res);
};
