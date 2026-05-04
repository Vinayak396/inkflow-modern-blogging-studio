const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  author: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  socials: {
    twitter: { type: String },
    github: { type: String },
    website: { type: String },
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema);
