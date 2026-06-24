const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },   // optional — Google users have no password
  googleId: { type: String },                    // Google sub ID for OAuth users
  avatar: { type: String },                      // profile picture URL from Google
  verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
