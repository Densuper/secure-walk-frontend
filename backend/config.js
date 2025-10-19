require('dotenv').config();

const { JWT_SECRET, SEED_DEMO_DATA } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Please configure a secure secret.');
}

const shouldSeedDemoData = String(SEED_DEMO_DATA).toLowerCase() === 'true';

module.exports = {
  JWT_SECRET,
  shouldSeedDemoData,
};
