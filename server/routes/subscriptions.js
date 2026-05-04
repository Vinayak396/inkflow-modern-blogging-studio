const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// Get subscription count for an author
router.get('/:authorName', async (req, res) => {
  try {
    const count = await Subscription.countDocuments({ authorName: req.params.authorName });
    res.json({ count });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if current user is subscribed (auth required)
router.get('/:authorName/status', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      authorName: req.params.authorName,
      userId: req.user.id,
    });
    res.json({ subscribed: !!sub });
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle subscribe (auth required)
router.post('/:authorName', auth, async (req, res) => {
  try {
    const existing = await Subscription.findOne({
      authorName: req.params.authorName,
      userId: req.user.id,
    });

    if (existing) {
      await Subscription.findByIdAndDelete(existing._id);
      return res.json({ subscribed: false });
    }

    await Subscription.create({
      authorName: req.params.authorName,
      userId: req.user.id,
    });
    res.json({ subscribed: true });
  } catch (err) {
    console.error('Toggle subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
