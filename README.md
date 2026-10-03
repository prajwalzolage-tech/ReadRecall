# ReadRecall — Active Recall Reading & Comprehension Platform

> **Project Code:** PRAYAS-INFO-26-S-007  
> **Core Concept:** Timed technical article reading → article is strictly hidden → student writes a summary from memory → instant 1–10 rating + streamed AI coaching feedback.

---

## 🏛️ System Architecture

```mermaid
graph TB
    subgraph Client ["Client Browser (PWA)"]
        UI[Next.js App Router UI]
        AuthClient[Firebase Auth Client SDK]
        Timer[Reading Timer & Anti-Copy Guard]
        Editor[Summary Editor]
        Charts[Recharts Radar & Trend Profiles]
    end

    subgraph Server ["Next.js Server API Handlers"]
        AuthVerify["/api/auth/verify (Firebase Admin)"]
        EvalRoute["/api/evaluate (Rating Engine)"]
        FeedbackRoute["/api/feedback (Vercel AI SDK)"]
        UploadRoute["/api/upload/* (Cloudinary / Parsers)"]
        SearchRoute["/api/search/* (arXiv / OpenAlex)"]
        ProfileRoute["/api/user/profile (Privacy & Stats)"]
    end

    subgraph Evaluation ["Evaluation Pipeline"]
        JevWrapper["lib/jev.ts (@typesafe-ai/sdk)"]
        CopyGuard["lib/copy-detection.ts (4-Gram Analysis)"]
        RatingCalc["lib/rating.ts (Pure Scoring & Guards)"]
    end

    subgraph External ["External Services"]
        FirebaseDB[(Firebase Firestore DB)]
        Cloudinary[(Cloudinary Storage)]
        ArXiv[arXiv API & OpenAlex API]
        Unpaywall[Unpaywall API]
    end

    UI --> AuthClient
    UI --> Timer
    UI --> Editor
    UI --> Charts

    UI --> EvalRoute
    UI --> FeedbackRoute
    UI --> UploadRoute
    UI --> SearchRoute
    UI --> ProfileRoute

    EvalRoute --> AuthVerify
    EvalRoute --> JevWrapper
    EvalRoute --> CopyGuard
    EvalRoute --> RatingCalc
    EvalRoute --> FirebaseDB

    FeedbackRoute --> External
    UploadRoute --> Cloudinary
    SearchRoute --> ArXiv
    SearchRoute --> Unpaywall
```

---

## ✨ Key Features

1. **Timed Reading & Strict Hiding:**
   - Word count calibrated reading timer (200 WPM + 15s buffer).
   - Once expired or finished, the article text is unmounted and never stored in `localStorage` or `sessionStorage`.
   - Client anti-copy protection (`user-select: none`, disabled clipboard events).
2. **Jev Structural Evaluation:**
   - Multi-dimensional decomposition: Key Point Coverage (35%), Central Thesis (25%), Factual Faithfulness (25%), Clarity (10%), Applied Purpose (5%).
   - Safety & Quality Guards:
     - **Minimum Length Guard:** Less than 15 words forced to 1.
     - **Verbatim Copy Guard:** ≥ 60% 4-gram overlap capped at rating 4.
     - **Contradiction Guard:** ≥ 0.7 probability capped at rating 5.
     - **Off-Topic Guard:** ≥ 0.7 probability capped at rating 2.
     - **Prompt Injection Guard:** Overrides and "rate 10/10" injections dropped to 1.
3. **Streamed AI Tutor Coaching:**
   - Vercel AI SDK streaming tutor feedback immediately following rating calculation.
   - Highlights 1–2 strengths, points out 1–2 missed concepts, provides 1 actionable next step.
4. **Reveal & Revision Loops:**
   - "Reveal Article" view highlighting missed key points in yellow.
   - "Revise & Resubmit" tracking delta improvement (+Rating, +Coverage%).
5. **Learning Profile & Analytics:**
   - Recharts Radar Chart: 5-axis comprehension strengths.
   - Recharts Trend Chart: Historical score trajectory over time.
   - Strict Privacy Mode: User toggle to store scores only without persisting raw student summary texts.
6. **Custom Document Upload & Ingestion:**
   - PDF (`pdf-parse`), DOCX (`mammoth`), and TXT with magic-byte verification.
   - Scanned PDF detection (< 20 chars/page).
   - Heading-based section splitter for documents > 800 words.
7. **Academic Paper Search:**
   - arXiv (Atom XML parser) and OpenAlex parallel searches.
   - Unpaywall legal open-access DOI resolution.
   - SSRF-guarded automatic PDF retrieval and extraction.
8. **PWA & Offline Capability:**
   - Web App Manifest (`/manifest.json`), service worker (`/sw.js`), mobile installable.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 22 / 25)
- npm or pnpm

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary (Direct Uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Jev Evaluation SDK
TYPESAFE_API_KEY=your_typesafe_api_key
JEV_PROVIDER=typesafe # or 'heuristic' for offline local dev

# LLM Tutor Feedback (Vercel AI SDK)
OPENAI_API_KEY=your_openai_api_key
LLM_MODEL=gpt-4o-mini
```

### 3. Development Commands

```bash
# Install dependencies
npm install

# Seed curated technical articles to Firestore
npm run seed

# Run local development server
npm run dev

# Run Vitest unit tests
npm test

# Run TypeScript type check
npm run typecheck

# Run offline benchmark evaluation script
npx tsx evaluation/evaluate.ts
```

---

## 📊 Offline Evaluation Benchmark

ReadRecall provides a reproducible benchmark script comparing:
1. **Jev-Only**
2. **LLM-Only**
3. **Hybrid (ReadRecall Full Pipeline)**

Run with:
```bash
npx tsx evaluation/evaluate.ts
```

Results are computed across **MAE**, **Spearman Rank Correlation ($\rho$)**, **Quadratic Weighted Kappa (QWK)**, and latency percentiles (p50 / p95).

---

## ⚠️ Known Limitations & Mitigations

1. **Article Hiding:**
   - *Limitation:* Client-side article hiding cannot prevent a determined user with browser DevTools / inspect element from viewing memory or DOM history.
   - *Mitigation:* Explicitly communicated as an active recall self-study tool rather than a high-stakes proctored exam.
2. **AI Key Points on Uploaded Documents:**
   - *Limitation:* User-uploaded and arXiv papers rely on LLM-extracted key points rather than human-curated points.
   - *Mitigation:* Each candidate key point is independently cross-checked and verified via Jev Noul questions before persistence.
3. **Copy Detection:**
   - *Limitation:* N-gram matching detects verbatim token overlap but does not capture synonymous rewording.
   - *Mitigation:* Semantic comprehension and faithfulness dimensions in Jev penalize superficial paraphrase without substance.
