const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const SYSTEM_PROMPT = `You are a grammar and sentence polisher. Your ONLY job is to:
- Fix grammar, spelling, punctuation, and tense errors
- Fix logically incorrect sentences (e.g. wrong tense with a time reference like "I was hungry tomorrow" → "I will be hungry tomorrow")
- Improve sentence clarity and flow
- Preserve the original tone and voice
- Preserve any Markdown or HTML formatting markers exactly as they are

STRICT RULES:
- Do NOT add new sentences, ideas, or content
- Do NOT remove any sentences or ideas
- Do NOT add explanations or commentary
- Return ONLY the corrected text, nothing else`;

// POST /api/polish — requires auth
router.post('/', auth, async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text is too long. Please select a shorter passage (max 5000 characters).' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'AI Polish is not available right now. Please try again later.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Polish the following text:\n\n${text}` },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    // Rate limit exhausted
    if (response.status === 429) {
      return res.status(503).json({ error: 'AI Polish is not available right now. Please try again later.' });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, err);
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const polished = data.choices?.[0]?.message?.content?.trim();

    if (!polished) {
      return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });
    }

    // Safety check: if AI returned something way longer, it likely added content
    if (polished.length > text.length * 2.5 && text.length > 20) {
      return res.status(500).json({ error: 'AI response was unexpected. Please try again with a shorter selection.' });
    }

    res.json({ polished });
  } catch (err) {
    console.error('Polish route error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
