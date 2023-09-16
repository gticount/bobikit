const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const validator = require('validator');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please type your name'],
    trim: true,
    maxlength: [70, 'Maximum length crossed'],
    minlength: [3, 'Minimum length needed'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, 'E-mail is required'],
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  phoneNumber: {
    type: Number,
    unique: true,
    sparse: true, // Add this line to allow null values without enforcing uniqueness
  },

  TwoFA: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    unique: true,
  },
  profile: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },
  photo: {
    type: String,
    required: [false],
    default: 'default.jpg',
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please type the password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please again type the password'],
    minlength: 8,
    validate: {
      validator: function (el) {
        console.log('aagya mc');
        return el === this.password;
      },
      message: 'Passowrds are not the same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  status: {
    type: String,
    trim: true,
    maxlength: [200, 'Maximum length crossed'],
    minlength: [1, 'Minimum length needed'],
  },
  stories: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Story',
    },
  ],
  posts: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
    },
  ],
  conversations: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Conversation',
    },
  ],
  accessToken: {
    type: String,
  },
  recentSearches: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  mute: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  online: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },
  socketId: {
    type: String,
  },
  lastActive: {
    type: Date,
    default: Date.now(),
  },
  smallPhoto: {
    type: String,
  },
  largePhoto: {
    type: String,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 2000;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('accessToken') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 2000;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 15);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('accessToken')) return next();
  this.accessToken = await bcrypt.hash(this.accessToken, 15);
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    if (changedTime > JWTTimestamp) return true;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
