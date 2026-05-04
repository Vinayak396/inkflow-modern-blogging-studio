const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

subscriptionSchema.index({ authorName: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
