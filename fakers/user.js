const faker = require('faker');

// Function to generate a random 10-digit phone number
function generateRandomPhoneNumber() {
  const phoneNumber = faker.phone.phoneNumber();
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

// Generate a common password for all users
const commonPassword = faker.internet.password(8);

// Function to generate a random user object with the common password
function generateRandomUser() {
  return {
    name: faker.name.findName(),
    email: faker.internet.email(),
    phoneNumber: generateRandomPhoneNumber(),
    TwoFA: faker.random.boolean(),
    username: faker.internet.userName(),
    profile: faker.random.arrayElement(['public', 'private']),
    photo: 'default.jpg',
    role: faker.random.arrayElement(['user', 'admin']),
    password: commonPassword,
    passwordConfirm: commonPassword,
    passwordChangedAt: faker.date.past(),
    passwordResetToken: null,
    passwordResetExpires: null,
    active: true,
    friends: [],
    status: faker.lorem.sentence(),
    stories: null,
    posts: [],
    messages: [],
  };
}

// Generate random user data
const numberOfUsers = 20; // Change this to the desired number of users

const randomUsers = Array.from({ length: numberOfUsers }).map(
  generateRandomUser,
);

// Convert the array of user objects to JSON string
const jsonData = JSON.stringify(randomUsers, null, 2);

console.log(jsonData);
