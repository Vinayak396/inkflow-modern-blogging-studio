const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const auth = require('../middleware/auth');

// Get likes for a post
router.get('/:postId', async (req, res) => {
  try {
    const likes = await Like.find({ postId: req.params.postId });
    res.json({
      count: likes.length,
      users: likes.map((l) => l.userId.toString()),
    });
  } catch (err) {
    console.error('Get likes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle like (auth required)
router.post('/:postId', auth, async (req, res) => {
  try {
    const existing = await Like.findOne({
      postId: req.params.postId,
      userId: req.user.id,
    });

    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      const count = await Like.countDocuments({ postId: req.params.postId });
      return res.json({ count, liked: false });
    }

    await Like.create({ postId: req.params.postId, userId: req.user.id });
    const count = await Like.countDocuments({ postId: req.params.postId });
    res.json({ count, liked: true });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
