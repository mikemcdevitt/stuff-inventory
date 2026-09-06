require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stuff-inventory';

if (!process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
  console.error('JWT_SECRET and GOOGLE_CLIENT_ID must be set in server/.env — see .env.example');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
