const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Story can be posted only by users'],
  },
  location: {
    //GeoJson
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  caption: {
    type: String,
    default: '',
  },
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  content: {
    type: String,
  },
  contentAudio: {
    type: String,
  },
  seen: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  archived: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },
});

// Create a Mongoose middleware to automatically update the archived field before finding
storySchema.pre(/^find/, async function (next) {
  // Calculate the time difference in hours for each found document
  const currentTime = new Date();

  for (const doc of this.find()) {
    const diffInMilliseconds = currentTime - doc.createdAt;
    const hoursPassed = diffInMilliseconds / (1000 * 60 * 60); // Milliseconds to hours

    // Update the archived field for each document
    doc.archived = hoursPassed >= 24;

    // Save the document with the updated archived field
    await doc.save();
  }
  next();
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
