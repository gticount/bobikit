const faker = require('faker');
const sampleUsers = require('../dev-data/user');

// Function to generate a random message
function generateRandomMessage(sender, receiver) {
  const sortedIds = [sender._id.$oid, receiver._id.$oid].sort();
  const uniqueId = `${sortedIds[0]}_${sortedIds[1]}`;

  return {
    sender: sender._id.$oid,
    receiver: receiver._id.$oid,
    createdAt: faker.date.recent(),
    type: 'text', // You can customize the message type as needed (e.g., 'text', 'media')
    content: faker.lorem.sentence(),
    likes: faker.datatype.number({ min: 0, max: 100 }),
    uniqueId: uniqueId,
  };
}

// Generate random messages between users
const messagesPerUser = 50; // Each user will have at least 50 messages with two other users
const allMessages = [];

sampleUsers.name.forEach((sender) => {
  // Select two random users to message
  const availableReceivers = sampleUsers.name.filter((user) => user !== sender);
  for (let i = 0; i < messagesPerUser; i++) {
    const receiver1 =
      availableReceivers[Math.floor(Math.random() * availableReceivers.length)];
    const receiver2 = availableReceivers.find((user) => user !== receiver1);

    // Generate messages between the sender and the two receivers
    const message1 = generateRandomMessage(sender, receiver1);
    const message2 = generateRandomMessage(sender, receiver2);
    allMessages.push(message1, message2);
  }
});

// Output the generated messages in JSON format
const jsonData = JSON.stringify(allMessages, null, 2);
console.log(jsonData);
