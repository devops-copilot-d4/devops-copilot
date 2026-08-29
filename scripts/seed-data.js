// Run with: node scripts/seed-data.js
// Populates sample User/Service/Requirement data for local demo/testing.
// Requires backend/.env to be configured with a valid MONGO_URI.

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

const User = require('../backend/models/User');
const Service = require('../backend/models/Service');
const Requirement = require('../backend/models/Requirement');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected for seeding...');

  const user = await User.findOneAndUpdate(
    { githubId: 'demo-user' },
    { githubId: 'demo-user', username: 'demo-user', email: 'demo@example.com' },
    { upsert: true, new: true }
  );

  const service = await Service.findOneAndUpdate(
    { name: 'demo-checkout-service' },
    {
      name: 'demo-checkout-service',
      repoUrl: 'https://github.com/example/demo-checkout-service',
      owner: user._id,
      namespace: 'default',
      deploymentName: 'demo-checkout-service',
      status: 'running',
    },
    { upsert: true, new: true }
  );

  await Requirement.findOneAndUpdate(
    { text: 'Checkout should feel fast and reliable', service: service._id },
    { text: 'Checkout should feel fast and reliable', service: service._id, createdBy: user._id },
    { upsert: true }
  );

  console.log('Seed data created.');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

