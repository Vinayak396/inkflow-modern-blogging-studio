const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const PROMPTS = {
  polish: `You are a grammar and sentence polisher. Your ONLY job is to:
- Fix grammar, spelling, punctuation, and tense errors
- Fix logically incorrect sentences (e.g. wrong tense with a time reference like "I was hungry tomorrow" → "I will be hungry tomorrow")
- Improve sentence clarity and flow
- Preserve the original tone and voice
- Preserve any Markdown or HTML formatting markers exactly as they are

STRICT RULES:
- Do NOT add new sentences, ideas, or content
- Do NOT remove any sentences or ideas
- Do NOT add explanations or commentary
- Return ONLY the corrected text, nothing else`,

  enhance: `You are an expert writing enhancer. Your job is to:
- Replace weak, plain, or overused words with more precise, vivid, and sophisticated vocabulary
- Restructure sentences for better rhythm, flow, and impact
- Make the writing more engaging, elegant, and compelling
- Strengthen the overall expression while keeping the original meaning and intent intact
- Preserve the author's voice and tone
- Preserve any Markdown or HTML formatting markers exactly as they are

STRICT RULES:
- Do NOT add new sentences, ideas, or content
- Do NOT remove any sentences or ideas
- Do NOT add explanations or commentary
- Return ONLY the enhanced text, nothing else`,
};

// POST /api/polish — requires auth
// Body: { text: string, mode: "polish" | "enhance" }
router.post('/', auth, async (req, res) => {
  const { text, mode = 'polish' } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text is too long. Please select a shorter passage (max 5000 characters).' });
  }

  const systemPrompt = PROMPTS[mode] || PROMPTS.polish;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${mode === 'enhance' ? 'Enhance' : 'Polish'} the following text:\n\n${text}` },
        ],
        temperature: mode === 'enhance' ? 0.6 : 0.3,
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
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });
    }

    // Safety check: if AI returned something way longer, it likely added content
    if (result.length > text.length * 2.5 && text.length > 20) {
      return res.status(500).json({ error: 'AI response was unexpected. Please try again with a shorter selection.' });
    }

    res.json({ polished: result });
  } catch (err) {
    console.error('Polish route error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
