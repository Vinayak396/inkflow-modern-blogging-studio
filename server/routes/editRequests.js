const express = require('express');
const router = express.Router();
const EditRequest = require('../models/EditRequest');
const auth = require('../middleware/auth');

// Get edit requests for current user's posts (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const requests = await EditRequest.find({ authorId: req.user.id }).sort({ date: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Get edit requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if current user has a pending/approved request for a post (auth required)
router.get('/status/:postId', auth, async (req, res) => {
  try {
    const request = await EditRequest.findOne({
      postId: req.params.postId,
      requesterId: req.user.id,
      status: { $in: ['pending', 'approved'] },
    });
    res.json({ status: request ? request.status : null });
  } catch (err) {
    console.error('Get edit request status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create edit request (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { postId, postTitle, authorId, message } = req.body;
    const request = await EditRequest.create({
      postId,
      postTitle,
      requesterId: req.user.id,
      requesterName: req.user.name,
      authorId,
      message,
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('Create edit request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject edit request (auth required, must be post author)
router.put('/:id', auth, async (req, res) => {
  try {
    const request = await EditRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Edit request not found' });
    }

    if (request.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    request.status = req.body.status;
    await request.save();
    res.json(request);
  } catch (err) {
    console.error('Update edit request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
