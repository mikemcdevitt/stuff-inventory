const Location = require('../models/Location');

exports.list = async (req, res) => {
  const locations = await Location.find().sort('name');
  res.json(locations);
};

exports.create = async (req, res) => {
  const location = await Location.create(req.body);
  res.status(201).json(location);
};

exports.get = async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  res.json(location);
};

exports.update = async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!location) return res.status(404).json({ error: 'Location not found' });
  res.json(location);
};

exports.remove = async (req, res) => {
  const location = await Location.findByIdAndDelete(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  res.status(204).end();
};
