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

export async function polishText(apiKey, text) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Polish the following text:\n\n${text}` },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const polished = data.choices[0].message.content.trim();

  // Safety check: if AI returned something way longer, it likely added content
  if (polished.length > text.length * 2.5 && text.length > 20) {
    throw new Error("The AI appears to have added new content. Please try again with a shorter selection.");
  }

  return polished;
}
