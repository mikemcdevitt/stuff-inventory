const path = require('path');
const express = require('express');
const cors = require('cors');

const locationsRouter = require('./routes/locations');
const itemsRouter = require('./routes/items');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/locations', locationsRouter);
app.use('/api/items', itemsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
