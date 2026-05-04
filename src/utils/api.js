const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("inkflow-token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function buildQuery(params) {
  if (!params) return "";
  const query = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return query ? `?${query}` : "";
}

const api = {
  // Auth
  signup: (name, email, password) =>
    fetch(`${API_URL}/auth/signup`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ name, email, password }) }).then(r => r.json()),

  verifyOtp: (userId, otp) =>
    fetch(`${API_URL}/auth/verify-otp`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ userId, otp }) }).then(r => r.json()),

  resendOtp: (userId) =>
    fetch(`${API_URL}/auth/resend-otp`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ userId }) }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${API_URL}/auth/login`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email, password }) }).then(r => r.json()),

  getMe: () =>
    fetch(`${API_URL}/auth/me`, { headers: getHeaders() }).then(r => { if (!r.ok) throw new Error("Not authenticated"); return r.json(); }),

  // Posts
  getPosts: (params) =>
    fetch(`${API_URL}/posts${buildQuery(params)}`, { headers: getHeaders() }).then(r => r.json()),

  getPost: (id) =>
    fetch(`${API_URL}/posts/${id}`, { headers: getHeaders() }).then(r => r.json()),

  createPost: (data) =>
    fetch(`${API_URL}/posts`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  updatePost: (id, data) =>
    fetch(`${API_URL}/posts/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  deletePost: (id) =>
    fetch(`${API_URL}/posts/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.ok ? { success: true } : r.json()),

  // Comments
  getComments: (postId) =>
    fetch(`${API_URL}/comments/${postId}`, { headers: getHeaders() }).then(r => r.json()),

  addComment: (postId, text) =>
    fetch(`${API_URL}/comments/${postId}`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ text }) }).then(r => r.json()),

  deleteComment: (id) =>
    fetch(`${API_URL}/comments/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.ok ? { success: true } : r.json()),

  // Likes
  getLikes: (postId) =>
    fetch(`${API_URL}/likes/${postId}`, { headers: getHeaders() }).then(r => r.json()),

  toggleLike: (postId) =>
    fetch(`${API_URL}/likes/${postId}`, { method: "POST", headers: getHeaders() }).then(r => r.json()),

  // Subscriptions
  getSubscriptionCount: (authorName) =>
    fetch(`${API_URL}/subscriptions/${encodeURIComponent(authorName)}`, { headers: getHeaders() }).then(r => r.json()),

  getSubscriptionStatus: (authorName) =>
    fetch(`${API_URL}/subscriptions/${encodeURIComponent(authorName)}/status`, { headers: getHeaders() }).then(r => r.json()),

  toggleSubscription: (authorName) =>
    fetch(`${API_URL}/subscriptions/${encodeURIComponent(authorName)}`, { method: "POST", headers: getHeaders() }).then(r => r.json()),

  // Edit Requests
  getEditRequests: () =>
    fetch(`${API_URL}/edit-requests`, { headers: getHeaders() }).then(r => r.json()),

  createEditRequest: (data) =>
    fetch(`${API_URL}/edit-requests`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  updateEditRequest: (id, status) =>
    fetch(`${API_URL}/edit-requests/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify({ status }) }).then(r => r.json()),

  getEditRequestStatus: (postId) =>
    fetch(`${API_URL}/edit-requests/status/${postId}`, { headers: getHeaders() }).then(r => r.json()),

  // Saved Posts (keep in localStorage - user preference, not shared data)
  getSavedPostIds: (userId) => {
    const saved = JSON.parse(localStorage.getItem("inkflow-saved")) || {};
    return saved[userId] || [];
  },

  toggleSavePost: (userId, postId) => {
    const saved = JSON.parse(localStorage.getItem("inkflow-saved")) || {};
    const userSaved = saved[userId] || [];
    if (userSaved.find(sid => String(sid) === String(postId))) {
      saved[userId] = userSaved.filter(sid => String(sid) !== String(postId));
    } else {
      saved[userId] = [...userSaved, postId];
    }
    localStorage.setItem("inkflow-saved", JSON.stringify(saved));
    return saved[userId].find(sid => String(sid) === String(postId)) !== undefined;
  },

  isSaved: (userId, postId) => {
    const saved = JSON.parse(localStorage.getItem("inkflow-saved")) || {};
    return (saved[userId] || []).some(sid => String(sid) === String(postId));
  },
};

export default api;
