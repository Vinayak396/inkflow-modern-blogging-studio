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

// Preferred active Groq models in priority order
const PREFERRED_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
];

let cachedActiveModels = null;
let lastModelFetch = 0;

// Dynamically fetch currently active models supported by the user's Groq account
async function getAvailableGroqModels(apiKey) {
  const now = Date.now();
  if (cachedActiveModels && now - lastModelFetch < 3600000) {
    return cachedActiveModels;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const activeIds = (data.data || []).map((m) => m.id);
      cachedActiveModels = activeIds;
      lastModelFetch = now;
      return activeIds;
    }
  } catch (err) {
    console.error('Failed to query Groq models endpoint:', err.message);
  }
  return null;
}

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
    return res.status(503).json({ error: 'AI Polish is not configured. Please add GROQ_API_KEY to your server environment variables.' });
  }

  const apiKey = process.env.GROQ_API_KEY.trim();
  const activeIds = await getAvailableGroqModels(apiKey);

  let candidateModels = [];

  if (process.env.GROQ_MODEL) {
    candidateModels.push(process.env.GROQ_MODEL.trim());
  }

  if (activeIds && activeIds.length > 0) {
    // 1. Check which of our preferred models are active on Groq
    const foundPreferred = PREFERRED_MODELS.filter((m) => activeIds.includes(m));
    candidateModels.push(...foundPreferred);

    // 2. Fallback to any general text/chat model if none of preferred matched
    if (candidateModels.length === 0) {
      const generalModels = activeIds.filter(
        (id) =>
          !id.includes('whisper') &&
          !id.includes('orpheus') &&
          !id.includes('vision') &&
          !id.includes('guard') &&
          !id.includes('embed')
      );
      candidateModels.push(...generalModels);
    }
  }

  // Fallback defaults if models endpoint could not be reached
  if (candidateModels.length === 0) {
    candidateModels = [...PREFERRED_MODELS];
  }

  let lastError = null;
  let lastStatus = 500;

  for (const model of candidateModels) {
    try {
      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${mode === 'enhance' ? 'Enhance' : 'Polish'} the following text:\n\n${text}` },
        ],
        temperature: mode === 'enhance' ? 0.6 : 0.3,
        max_tokens: 2048,
      };

      if (model.includes('gpt-oss')) {
        payload.reasoning_effort = 'low';
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      // Rate limit exhausted
      if (response.status === 429) {
        return res.status(503).json({ error: 'AI rate limit reached. Please wait a minute and try again.' });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error(`Groq API error with model ${model}:`, response.status, err);
        lastStatus = response.status;
        lastError = err?.error?.message || `AI service returned error (${response.status}).`;

        // Invalid API Key
        if (response.status === 401) {
          return res.status(500).json({ error: 'Invalid Groq API key on server. Please verify GROQ_API_KEY.' });
        }

        // Try next fallback model if model was decommissioned or not found
        continue;
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

      return res.json({ polished: result });
    } catch (err) {
      console.error(`Error connecting to Groq with model ${model}:`, err);
      lastError = err.message;
    }
  }

  return res.status(lastStatus === 503 ? 503 : 500).json({
    error: lastError || 'AI service error. Please try again.',
  });
});

module.exports = router;
