# Math Problem Generator - Developer Assessment Starter Kit

## Overview

This is a starter kit for building an AI-powered math problem generator application. The goal is to create a standalone prototype that uses AI to generate math word problems suitable for Primary 5 students, saves the problems and user submissions to a database, and provides personalized feedback.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI Integration**: OpenAI (ChatGPT Responses API)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd math-problem-generator
```

### 2. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API to find your:
   - Project URL (starts with `https://`)
   - Anon/Public Key

### 3. Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database.sql`
3. Click "Run" to create the tables and policies

### 4. Get OpenAI API Key

1. Create an OpenAI account and generate an API key
2. Save the key for step 5

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edit `.env.local` and add your actual keys:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://wcasvjylskhtsajhhggy.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXN2anlsc2todHNhamhoZ2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjQxMDEsImV4cCI6MjA3NTA0MDEwMX0.6m6aIq-5z3BmWAI87ajxSHDJ11Wamk8S2WzB10rs6VU
  OPENAI_API_KEY=your_actual_openai_api_key
  OPENAI_MODEL_FAST=gpt-4.1-mini
  OPENAI_MODEL_QUALITY=gpt-4o
  ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Your Task

### 1. Implement Frontend Logic (`app/page.tsx`)

Complete the TODO sections in the main page component:

- **generateProblem**: Call your API route to generate a new math problem
- **submitAnswer**: Submit the user's answer and get feedback

### 2. Create Backend API Route (`app/api/math-problem/route.ts`)

Create a new API route that handles:

#### POST /api/math-problem (Generate Problem)
- Use OpenAI to generate a math word problem
- The AI should return JSON with:
  ```json
  {
    "problem_text": "A bakery sold 45 cupcakes...",
    "final_answer": 15
  }
  ```
- Save the problem to `math_problem_sessions` table
- Return the problem and session ID to the frontend

#### POST /api/submissions (Submit Answer)
- Receive the session ID and user's answer
- Check if the answer is correct
- Use AI to generate personalized feedback based on:
  - The original problem
  - The correct answer
  - The user's answer
  - Whether they got it right or wrong
- Save the submission to `math_problem_submissions` table
- Return the feedback and correctness to the frontend

### 3. Requirements Checklist

- [x] AI generates appropriate Primary 5 level math problems
- [x] Problems and answers are saved to Supabase
- [x] User submissions are saved with feedback
- [x] AI generates helpful, personalized feedback
- [x] UI is clean and mobile-responsive
- [x] Error handling for API failures
- [x] Loading states during API calls

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Assessment Submission

When submitting your assessment, provide:

1. **GitHub Repository URL**: Make sure it's public
2. **Live Demo URL**: Your Vercel deployment
3. **Supabase Credentials**: Add these to your README for testing:
   ```
   SUPABASE_URL: [Your Supabase Project URL]
   SUPABASE_ANON_KEY: [Your Supabase Anon Key]
   ```

## Implementation Notes

### My Implementation

- AI and Prompting
  - Switched to OpenAI Responses API (ChatGPT). Primary models via env: `OPENAI_MODEL_FAST=gpt-4.1-mini` (generation/feedback) and `OPENAI_MODEL_QUALITY=gpt-4o` (explanations).
  - Grade-aware constraints in the prompt (P1–P2 one-step whole numbers; P3–P4 introduce ×/÷ and small decimals; P5–P6 allow fractions/decimals/percentages with 2–3 steps).
  - Topic-aware nudges (fractions, percentage, area/perimeter, ratio, speed) to keep numbers tidy and include units when relevant.

- Database (uses provided schema unchanged)
  - `math_problem_sessions(id, created_at, problem_text, correct_answer NUMERIC)` stores each generated problem and numeric answer.
  - `math_problem_submissions(id, session_id, user_answer NUMERIC, is_correct, feedback_text, created_at)` stores student submissions.
  - Numeric parser accepts `75%`, `3/4`, `1 1/2`, and comma-formatted numbers; correctness uses absolute+relative tolerance.

- API Routes
  - `POST /api/math-problem` — generates a single curriculum-aligned problem for a chosen grade/outcome; persists to `math_problem_sessions` and returns the new row.
  - `POST /api/submissions` — validates answer against `correct_answer`, stores a submission row, and returns a short AI-generated feedback string.
  - `POST /api/explain` — ephemeral helper that returns a Hint (2–3 bullets) or a step-by-step Solution; not persisted (keeps within current schema).
  - `POST /api/math-problem/improve` — creates a clearer, slightly varied version of an existing problem and saves as a new session.

- UI/UX
  - New HSL design tokens in `app/globals.css` (light + dark) with Montserrat/Merriweather/Source Code Pro fonts, 0.5rem radius, and subtle elevation shadows.
  - Desktop: pill-shaped top navbar with links to Home, History, Settings and a theme toggle; “New Session” button for quick resets.
  - Mobile: bottom navigation (Home, History, Settings) only on small screens.
  - Home flow: select Grade/Difficulty/Outcome → Generate → Problem card shows with Read Aloud (SpeechSynthesis), large Answer field, and a Numeric Keypad.
  - Feedback: confetti on correct; soft shake on incorrect; Reward bar shows stars (0–3) and a persistent streak counter.
  - History page: recent sessions list (localStorage stores last 10 IDs; details fetched from Supabase). Settings page is a placeholder for teacher/parent options.
  - Accessibility: 3px focus rings using `--ring`, large touch targets, readable typography; stepper removed to reduce clicks.

- Env/Config
  - `.env.local` requires: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY` (and optional `OPENAI_MODEL_FAST`, `OPENAI_MODEL_QUALITY`).

- Notable Decisions
  - Kept the provided Supabase schema intact; added functionality around it instead of changing tables.
  - Explanations (hints/solutions) are ephemeral to avoid expanding schema; can be stored later if required.
  - Local session history and streak are tracked with `localStorage` for a kid-friendly, low-friction prototype.

## Additional Features (Optional)

If you have time, consider adding:

- [x] Difficulty levels (Easy/Medium/Hard)
- [x] Problem history view
- [x] Score tracking
- [x] Different problem types (addition, subtraction, multiplication, division)
- [x] Hints system
- [x] Step-by-step solution explanations

---

Good luck with your assessment! 🎯
