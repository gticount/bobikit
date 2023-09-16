const faker = require('faker');

const sampleUsers = require('../dev-data/user');

// Function to generate a random post object
function generateRandomPost(user) {
  return {
    user: user._id,
    location: {
      type: 'Point',
      coordinates: [faker.address.longitude(), faker.address.latitude()],
      address: faker.address.streetAddress(),
      description: faker.lorem.sentence(),
    },
    createdAt: faker.date.recent(),
    caption: faker.lorem.sentence(),
    likes: faker.random.number({ min: 0, max: 100 }),
    comments: [],
    content: faker.lorem.paragraph(),
  };
}

// Generate random posts for each user
const postsPerUser = 2; // Each user will have at least 2 posts
const allPosts = [];

sampleUsers.name.forEach((user) => {
  for (let i = 0; i < postsPerUser; i++) {
    allPosts.push(generateRandomPost(user));
  }
});

// Convert the array of post objects to JSON string
const jsonData = JSON.stringify(allPosts, null, 2);

console.log(jsonData);
