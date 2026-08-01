const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Calls the backend /api/polish endpoint which proxies to Groq server-side.
 * @param {string} text - The text to process
 * @param {"polish"|"enhance"} mode - "polish" fixes grammar; "enhance" improves vocabulary & style
 */
export async function polishText(text, mode = "polish") {
  const token = localStorage.getItem("inkflow-token");

  const response = await fetch(`${API_URL}/polish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, mode }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }

  return data.polished;
}
