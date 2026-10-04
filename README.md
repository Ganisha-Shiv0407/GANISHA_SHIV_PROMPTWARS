# THE BLIND SPOT

> **“See What You’re Missing Before You Decide.”**

**THE BLIND SPOT** is an intelligent decision-reflection and reasoning platform built with **React + Vite**, **Node.js + Express**, and the official **`@google/genai`** SDK (`gemini-3.8-flash`).

---

## Core Philosophy

THE BLIND SPOT is a decision-reflection system, not a decision-making replacement:

```text
UNDERSTAND → QUESTION → CHALLENGE ASSUMPTIONS → FIND BLIND SPOTS → IDENTIFY MISSING INFORMATION → EXPLORE RISKS → ASK BETTER QUESTIONS → HELP USER THINK → LET USER DECIDE
```

---

## Architecture (Single Source of Truth)

```text
the-blind-spot/
├── src/
│   ├── App.tsx                             # Main Decision Intelligence UI
│   ├── types.ts                            # TypeScript interfaces
│   ├── index.css                           # Soft lavender/violet design system
│   ├── components/
│   │   ├── ChartsPanel.tsx                 # Chart.js visual analysis
│   │   └── WorkspaceAndAdminModal.tsx      # User Workspace & Admin Console
│   └── data/
│       └── demoPresets.ts                  # Scenario presets & translations
├── server.ts                               # Single Express + Vite + @google/genai backend
├── package.json                            # Scripts & dependencies
├── .env.example                            # Environment variable template
└── README.md
```

---

## Environment Variables

Create a `.env` file in the project root (or configure `GEMINI_API_KEY` in your hosting / AI Studio **Settings > Secrets** panel):

```env
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_PASSCODE=blindspot-admin-2026
PORT=3000
```

`GEMINI_API_KEY` is read strictly on the server inside `server.ts` and is never exposed to the browser or client bundle.

---

## Running the Project

### Local Development
```bash
npm install
npm run dev
```
Starts the unified Express + Vite server on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## API Endpoints & Diagnostics

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Verifies server status and whether `GEMINI_API_KEY` is configured (`aiConfigured: true/false`). |
| `/api/ai-test` | `GET` | Executes a live connectivity test against `gemini-3.8-flash` (`"Reply with the single word OK."`). |
| `/api/analyze` | `POST` | Runs the 7-stage structured Blind Spot analysis on the user's situation. |
| `/api/qna/next` | `POST` | Generates non-repetitive adaptive diagnostic Q&A rounds and updates clarity & blind spots. |
| `/api/decisions` | `GET` | Retrieves saved decision versions for the user's workspace. |
| `/api/auth/signup` | `POST` | Creates an account with `scrypt` password hashing. |
| `/api/auth/login` | `POST` | Authenticates a user and returns a session token. |
| `/api/auth/me` | `GET` | Validates the active user session token. |
| `/api/auth/logout` | `POST` | Invalidates the current session token. |
| `/api/feedback` | `POST` | Stores post-decision reflection ratings. |
| `/api/admin/stats` | `GET` | Returns privacy-safe aggregated platform analytics. |
