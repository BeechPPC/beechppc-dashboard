# Search Term Classifier

Classifies Google Ads search terms by intent using a hybrid rule-based + ML approach. Designed to handle 100k+ terms efficiently with minimal LLM cost.

## How It Works

The classifier uses a **10-step pipeline** that prioritizes fast, free methods before expensive LLM calls:

1. **Language detection** flags non-Latin terms in Latin-dominant accounts
2. **Brand matching** identifies your brand terms from configured strings
3. **Cache lookup** reuses previous classifications (60-80% hit rate after first run)
4. **Signal detection** classifies by intent keywords (buy, price, how to, jobs, etc.)
5. **Low volume** marks bottom 5% of terms by impressions as low_volume
6. **Similarity matching** catches brand typos using Levenshtein distance
7. **Cache prediction** propagates categories based on word patterns in cache

After these free steps, remaining terms can be classified with LLM + ML propagation:

8. **LLM classification** sends top N terms (default 500-1000) to Gemini/GPT
9. **ML propagation** learns patterns from LLM results and classifies remaining terms using TF-IDF, n-grams, word patterns, and cosine similarity
10. **Default** assigns medium_intent to truly unmatched terms (typically <3%)

## The ML Propagation Magic

The key insight: you don't need to LLM-classify every term. By classifying 500-1000 high-impression terms with an LLM, the system learns patterns it can apply to the remaining 60,000+ terms:

- **N-gram patterns**: "office chair" → medium_intent, "buy desk" → high_intent
- **Word patterns**: Terms containing "cheap" are 85% high_intent
- **Cosine similarity**: "ergonomic gaming chair" is similar to "gaming chair" (already classified)

Typical results: 500 LLM calls → 97% coverage of remaining terms via propagation.

## Categories

| Category | Description |
|----------|-------------|
| brand | Your brand terms |
| navigational | Competitor brand searches |
| high_intent | Purchase signals (buy, price, near me, sale) |
| medium_intent | Product browsing, no clear signal |
| low_intent | Research (how to, what is, guide) |
| negative | Won't convert (jobs, reddit, DIY, free pdf) |
| low_volume | Bottom 5% by impressions |
| non_latin | Non-Latin characters in Latin account |

## Usage

```bash
# Rule-based only (free, instant)
node scripts/classify.js --input=terms.csv --account-id=123456789

# With LLM + ML propagation
node scripts/classify.js --input=terms.csv --account-id=123456789 --run-llm --llm-limit=500
```

See SKILL.md for full documentation.
