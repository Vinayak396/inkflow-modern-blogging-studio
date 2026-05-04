const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const EditRequest = require('../models/EditRequest');
const auth = require('../middleware/auth');

// Get all posts (supports ?author= and ?tag= query params)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.author) {
      filter.author = req.query.author;
    }
    if (req.query.authorId) {
      filter.authorId = req.query.authorId;
    }
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    const posts = await Post.find(filter)
      .populate('authorId', 'name')
      .sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('authorId', 'name');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, author, socials } = req.body;
    const post = await Post.create({
      title,
      content,
      tags,
      author,
      authorId: req.user.id,
      socials,
    });
    res.status(201).json(post);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post (auth required, must be owner OR have approved edit request)
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isOwner = post.authorId.toString() === req.user.id;
    if (!isOwner) {
      const approvedRequest = await EditRequest.findOne({
        postId: post._id,
        requesterId: req.user.id,
        status: 'approved',
      });
      if (!approvedRequest) {
        return res.status(403).json({ error: 'Not authorized to edit this post' });
      }
    }

    const { title, content, tags, author, socials } = req.body;
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, tags, author, socials },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post + cleanup (auth required, must be owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Promise.all([
      Post.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ postId: req.params.id }),
      Like.deleteMany({ postId: req.params.id }),
      EditRequest.deleteMany({ postId: req.params.id }),
    ]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
