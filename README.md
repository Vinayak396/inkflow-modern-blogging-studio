#  InkFlow — Modern Blogging Studio

A full-stack blogging platform built with **React + Vite** on the frontend and **Node.js + Express + MongoDB** on the backend. InkFlow lets writers create, publish, and manage blog posts with a clean, modern interface — complete with AI-powered writing assistance, email verification, comments, likes, saved posts, and author profiles.

---

##  Features

- **Rich Post Editor** — Create and edit blog posts with formatting support and image uploads
- **AI Writing Assistant** — Polish and improve your writing with Google Gemini AI integration
- **Authentication** — Secure JWT-based auth with OTP email verification via Resend
- **Author Profiles** — Public profile pages with post history and follower counts
- **Comments & Likes** — Engage with posts through threaded comments and reactions
- **Saved Posts** — Bookmark posts to read later
- **Edit Requests** — Collaborative editing workflow for posts
- **Rate Limiting** — Built-in protection against brute-force and OTP abuse
- **Health Check Endpoint** — `/api/health` for uptime monitoring

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| Styling | Vanilla CSS |
| AI | Google Gemini API (`@google/generative-ai`) |
| Markdown | `react-markdown`, `rehype-raw` |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (via Mongoose) |
| Auth | JWT + bcryptjs |
| Email | Resend API |
| Rate Limiting | `express-rate-limit` |

---

##  Project Structure

```
inkflow/
├── src/
│   ├── components/       # Navbar, Layout, HelpSupport, PolishModal
│   ├── pages/            # Home, Login, Signup, Profile, CreatePost, BlogDetails, etc.
│   ├── context/          # AuthContext (global auth state)
│   └── utils/            # Helper utilities
├── server/
│   ├── routes/           # auth, posts, comments, likes, subscriptions, editRequests
│   ├── models/           # Mongoose schemas
│   ├── middleware/        # Auth middleware
│   ├── index.js          # Express app entry point
│   └── .env.example      # Environment variable template
├── public/
├── index.html
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A [Resend](https://resend.com) account for email delivery
- A [Google AI Studio](https://aistudio.google.com) API key (for AI features)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/inkflow.git
cd inkflow
```

---

### 2. Set up the Backend

```bash
cd server
cp .env.example .env
```

Fill in your values in `server/.env`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/inkflow
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-secret-key-min-32-chars
PORT=5000
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=InkFlow <noreply@yourdomain.com>
```

> **Generate a secure JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

Install dependencies and start the server:

```bash
npm install
npm run dev      # development (auto-restart on file changes)
# or
npm start        # production
```

The API will be available at `http://localhost:5000`.

---

### 3. Set up the Frontend

In the root `inkflow/` directory:

```bash
# create .env for local development
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables Reference

### `server/.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) |
| `PORT` | Port for the Express server (default: 5000) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `EMAIL_FROM` | Sender name and address for outgoing emails |

### `inkflow/.env` (frontend)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## 🏗️ Building for Production

```bash
# In the inkflow/ root directory
npm run build
```

The built static files will be output to `dist/`. Deploy this folder to any static host (Vercel, Netlify, etc.) and deploy `server/` to a Node.js host (Render, Railway, etc.).

---

## 🌐 API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/resend-otp` | Resend OTP email |
| GET/POST | `/api/posts` | List / create posts |
| GET/PUT/DELETE | `/api/posts/:id` | Get / update / delete a post |
| GET/POST | `/api/comments` | List / add comments |
| POST | `/api/likes` | Like / unlike a post |
| GET/POST | `/api/subscriptions` | Manage subscriptions |
| GET/POST | `/api/edit-requests` | Collaborative edit requests |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with ❤️ by [Vinayak R Vibhuti](https://github.com/Vinayak396)
