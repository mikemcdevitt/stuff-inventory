require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('./app');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stuff-inventory';

if (!process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
  throw new Error('JWT_SECRET and GOOGLE_CLIENT_ID must be set — see .env.example');
}

// Cached across warm Lambda invocations so we don't reconnect to MongoDB on every request.
let connectionPromise = null;
function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI).catch((err) => {
      connectionPromise = null; // let the next invocation retry instead of caching a failure
      throw err;
    });
  }
  return connectionPromise;
}

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  // Let mongoose's connection stay open in the background between invocations
  // instead of Lambda waiting for it to close (which would happen every time).
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return serverlessHandler(event, context);
};
