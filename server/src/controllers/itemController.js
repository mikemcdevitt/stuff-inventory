const Item = require('../models/Item');

exports.list = async (req, res) => {
  const { location, category, q } = req.query;
  const filter = {};
  if (location) filter.location = location;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const items = await Item.find(filter).populate('location').sort('name');
  res.json(items);
};

exports.create = async (req, res) => {
  const item = await Item.create(req.body);
  res.status(201).json(item);
};

exports.get = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('location');
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
};

exports.update = async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('location');
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
};

exports.remove = async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.status(204).end();
};

exports.addAttachment = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  item.attachments.push({
    kind: req.body.kind || 'other',
    url: req.file.location || `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
  });
  await item.save();
  await item.populate('location');
  res.status(201).json(item);
};

exports.removeAttachment = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.attachments.id(req.params.attachmentId)?.deleteOne();
  await item.save();
  await item.populate('location');
  res.json(item);
};
