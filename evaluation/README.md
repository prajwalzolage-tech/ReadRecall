# ReadRecall Evaluation Benchmark

This folder contains the offline evaluation benchmarking suite comparing three automated grading approaches against human expert ground truth:

1. **Jev-Only:** Direct structural question probabilities from Jev questions without post-processing guards.
2. **LLM-Only:** Direct 1–10 subjective scoring via prompt-based LLM generation.
3. **Hybrid (ReadRecall Full Pipeline):** Jev question decomposition combined with N-gram copy ratio detection, length guards, contradiction checks, and prompt-injection safety filters.

## Metrics Evaluated
- **Mean Absolute Error (MAE):** Average absolute deviation from human ratings (lower is better).
- **Spearman Rank Correlation ($\rho$):** Monotonic ordering agreement with human rankings (higher is better).
- **Quadratic Weighted Kappa (QWK):** Standard inter-annotator agreement penalizing large discrepancies quadratically (higher is better).
- **Latency (p50 / p95):** Response time percentiles in milliseconds.

## Running the Benchmark
```bash
npx tsx evaluation/evaluate.ts
```

The script parses `evaluation/sample-data.csv`, evaluates each summary across all three systems, outputs a performance table, and writes the structured metrics to `evaluation/benchmark_results.json`.
