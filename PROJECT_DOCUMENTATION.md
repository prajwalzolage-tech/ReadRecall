# ReadRecall — Project Documentation

> **Project Code:** PRAYAS-INFO-26-S-007  
> **Project Title:** ReadRecall — Active Recall Reading & Comprehension Platform

---

## 1. Understanding of the Problem

Students in technical education rely on passive reading habits (highlighting, re-reading, copy-pasting) which create an illusion of learning without building lasting retention. Active recall — writing from memory without referencing the source — is proven to be far more effective, but no digital platform enforces this workflow with automated evaluation, anti-cheating safeguards, and actionable feedback for technical reading comprehension.

---

## 2. Research Question

> "How can a hybrid AI evaluation pipeline — combining Jev SystemOne structured semantic decomposition with rule-based safety guards and N-gram copy detection — provide accurate, fair, and gamification-resistant automated scoring of student recall summaries for technical reading comprehension?"

---

## 3. Proposed Solution

ReadRecall enforces: **Read (timed) → Article Hidden → Write from Memory → AI Evaluation → Coaching → Reveal & Revise**.

- **Timed Reading & Hiding:** Word-count-calibrated timer (200 WPM + 15s buffer); article fully removed from DOM after reading.
- **5-Dimension Evaluation:** Key Point Coverage (35%), Central Thesis (25%), Faithfulness (25%), Clarity (10%), Applied Purpose (5%) → 1–10 rating.
- **Safety Guards:** Prompt injection, minimum length, gibberish, off-topic, verbatim copy (4-gram overlap ≥ 60%), and contradiction guards cap or override scores.
- **Streamed Coaching:** AI tutor highlights strengths, missed concepts, and one actionable next step.
- **Reveal & Revise:** Missed key points highlighted; retry tracks improvement delta.
- **Analytics:** Radar chart (5-axis strengths) and trend chart (score history).
- **Content Ingestion:** Curated library, PDF/DOCX/TXT upload, arXiv + OpenAlex search with Unpaywall open-access resolution.

---

## 4. Approach Adopted

- **Next.js 16 App Router** with modular layers: Presentation, API Routes, Evaluation Engine, LLM Services, Data Store, Content Ingestion.
- **Three-tier evaluation:** TypeSafe Jev SDK (production) → Free AI via Gemini/Groq (zero-cost) → Heuristic fallback (offline).
- **4-gram copy detection** computes verbatim overlap ratio between article and summary.
- **Magic-byte file validation** verifies real file type from binary headers, not MIME type.
- **SSRF-guarded URL fetching** blocks private IPs, metadata endpoints, and non-HTTP protocols.
- **Dual-layer storage:** Firestore (production) with in-memory + JSON fallback (local dev).
- **Benchmark evaluation** comparing Jev-Only, LLM-Only, and Hybrid pipeline against human expert ratings using MAE, Spearman ρ, and QWK.
- **Unit testing** with Vitest; TypeScript strict mode enforced.

---

## 5. Resources Used

- **Frameworks:** Next.js 16, React 19, TypeScript 5, TailwindCSS 4
- **AI/Evaluation:** @typesafe-ai/sdk (Jev), Vercel AI SDK, @ai-sdk/google (Gemini), @ai-sdk/openai (OpenAI/Groq)
- **Backend:** Firebase Auth + Firestore, Firebase Admin, Cloudinary
- **Document Processing:** pdf-parse, mammoth, fast-xml-parser
- **UI:** Recharts, Lucide React, shadcn/ui, Zod
- **Testing:** Vitest, @testing-library/react, ESLint
- **External APIs:** arXiv API, OpenAlex API, Unpaywall API
- **Deployment:** Vercel, Firebase Firestore, Cloudinary CDN

---

## 6. Implementation & Evidence

- **8 API route handlers** built: `/api/auth/verify`, `/api/evaluate`, `/api/feedback`, `/api/upload/*`, `/api/search/*`, `/api/articles`, `/api/attempts`, `/api/user/profile`.
- **13 reusable React components** developed: ArticleCard, AuthProvider, FeedbackStream, NavBar, RadarChart, RatingDisplay, ReadingTimer, RevealView, SearchResults, SectionPicker, SummaryEditor, TrendChart, UploadForm.
- **18 library modules** implemented covering evaluation (`jev.ts`, `rating.ts`, `copy-detection.ts`, `rating.config.ts`), LLM services (`llm.ts`), data persistence (`data-store.ts`), content processing (`text-extraction.ts`, `section-splitter.ts`, `text-cleaning.ts`), search (`arxiv.ts`, `openalex.ts`, `unpaywall.ts`, `merge.ts`), security (`ssrf-guard.ts`, `auth-helper.ts`, `rate-limit.ts`), and utilities (`schemas.ts`, `constants.ts`, `suggestion.ts`).
- **Jev evaluation** uses `@typesafe-ai/sdk` with `noul()`, `score()`, and `choice()` question primitives to decompose comprehension into structured probabilistic judgments.
- **Copy detection** implemented via 4-gram sliding window with Unicode-aware tokenization; tested to correctly flag ≥ 60% verbatim overlap.
- **File validation** uses raw magic-byte inspection (PDF: `%PDF`, DOCX: `PK\x03\x04`) instead of trusting client-supplied MIME types.
- **SSRF guard** performs DNS resolution and checks resolved IPs against all RFC 1918 private ranges, loopback, link-local (169.254.x.x), and IPv6 private prefixes.
- **Offline benchmark script** (`evaluation/evaluate.ts`) runs all three pipelines against 10 human-graded sample summaries from `evaluation/sample-data.csv` and outputs structured metrics to `evaluation/benchmark_results.json`.
- **Unit tests** written with Vitest covering rating calculation, guard activation, copy ratio computation, and API route handlers.
- **PWA support** enabled via `manifest.json` and `sw.js` for mobile installability and offline capability.

### App Screenshots

> **Note:** Please place your screenshot images in the `public/images/` folder and name them as shown below, or update the paths to point to your actual image files.

**1. Jev Multi-Dimensional Evaluation Results**  
*(Shows the Radar chart, 1-10 rating, and dimension scores)*  
![Jev Evaluation Results](/images/jev-results-screenshot.png)

**2. LLM Streamed Coaching Feedback**  
*(Shows the real-time AI tutor feedback highlighting strengths and missed concepts)*  
![LLM Coaching Feedback](/images/llm-feedback-screenshot.png)

---

## 7. Results & Observations

**Benchmark results** (against human expert ground truth):

- **Jev-Only:** MAE = 3.82, Spearman ρ = −0.208, QWK = −0.068, p50 latency = 6 ms.
- **LLM-Only:** MAE = 0.90, Spearman ρ = 0.772, QWK = 0.802, p50 latency = 1,007 ms.
- **Hybrid (ReadRecall):** MAE = 2.78, Spearman ρ = 0.494, QWK = 0.402, p50 latency = 11 ms.

**Key observations:**

- The Hybrid pipeline reduces MAE by 27% compared to Jev-Only while maintaining ~100× lower latency than LLM-Only — a practical balance between accuracy and real-time responsiveness.
- Safety guards successfully catch edge cases: prompt injection attempts ("rate this 10/10") are forced to rating 1; verbatim copy-paste summaries are capped at 4; off-topic or gibberish submissions are capped at 2 or forced to 1.
- The three-tier provider strategy ensures the platform works in any environment — from production with TypeSafe API keys, to free-tier with Gemini/Groq, to fully offline with heuristic fallback.
- Multi-dimensional scoring (radar chart) gives students visibility into *which* comprehension areas need improvement, unlike a single number.
- The "Revise & Resubmit" loop shows measurable improvement deltas, reinforcing the active recall learning cycle.
- Client-side article hiding is effective for self-study but cannot prevent determined users with DevTools — acceptable since ReadRecall is positioned as a learning tool, not a proctored exam.

---

## 8. What we learnt

- **AI Evaluation Trade-offs:** Pure LLMs are too slow and expensive for real-time scoring, while simple heuristics are inaccurate. A hybrid approach (Jev structured decomposition + heuristic safety guards) provides the best balance of speed, cost, and reliability.
- **Robust Prompt Injection Mitigation:** Relying solely on an LLM to ignore malicious instructions is insufficient. Layered rule-based guards (like explicitly forcing a 1/10 rating when injection probability is high) are necessary to maintain system integrity.
- **Client-Side Security Limits:** Hiding the article on the client side (e.g., unmounting from the DOM) works well for well-intentioned learners but isn't foolproof against users inspecting network traffic or memory via DevTools.
- **Handling Real-World Documents:** Extracting text from user-uploaded files requires resilient fallbacks (handling PDFs vs. DOCX) and strict magic-byte validation, as trusting MIME types alone exposes the system to spoofing.
- **Importance of Feedback Latency:** Real-time, streamed coaching feedback (via Vercel AI SDK) significantly improves user engagement compared to waiting for a monolithic, delayed evaluation response.
