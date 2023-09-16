const faker = require('faker');
const sampleUsers = require('../dev-data/user');

// Sample user data array (array of user objects) - Assuming you have a sample array of users

// Function to generate a random story object and convert the user field
function generateRandomStory(user) {
  if (Math.random() < 0.5) {
    return null; // Return null to indicate no story for this user
  }

  // Convert the user field from object with $oid to a plain string value
  const userId = user._id.$oid;

  return {
    user: userId,
    location: {
      type: 'Point',
      coordinates: [faker.address.longitude(), faker.address.latitude()],
      address: faker.address.streetAddress(),
      description: faker.lorem.sentence(),
    },
    createdAt: faker.date.recent(),
    caption: faker.lorem.sentence(),
    likes: faker.random.number({ min: 0, max: 100 }),
    content: faker.lorem.paragraph(),
  };
}

// Generate random stories for each user and filter out null stories
const allStories = sampleUsers.name
  .map(generateRandomStory)
  .filter((story) => story !== null);

// Convert the array of story objects to JSON string
const jsonData = JSON.stringify(allStories, null, 2);

console.log(jsonData);
