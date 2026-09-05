const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['manual', 'photo', 'receipt', 'other'], default: 'other' },
    url: { type: String, required: true },
    originalName: { type: String },
  },
  { _id: true, timestamps: true }
);

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['appliance', 'bike', 'instrument', 'electronics', 'tool', 'furniture', 'other'],
      default: 'other',
    },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    brand: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    purchasedFrom: { type: String, trim: true },
    warrantyExpiration: { type: Date },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

itemSchema.index({ name: 'text', brand: 'text', modelNumber: 'text', serialNumber: 'text' });

module.exports = mongoose.model('Item', itemSchema);
