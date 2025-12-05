---
name: research-search
description: Search through Mike's research library (newsletters and YouTube transcripts) to find relevant insights for a task or question. Use when asked to find research, search for insights, look up what experts say about a topic, or when preparing content that should reference research sources. Triggers include "search research", "find insights on", "what does [author] say about", "research on [topic]", or when creating weekly videos/content that needs research backing.
---

# Research Search

Search Mike's curated research library to find relevant insights for any task or question.

## Research Structure

**Index files** (condensed summaries) in `context/ideas/`:
- Newsletter: ethan.md, avinash.md, batch.md, ben.md, every.md, exponential.md, sam.md, simon.md
- YouTube: lenny.md, anthropic.md, bg2.md, every.md, indy.md, nopriors.md, thisday.md, other.md
- Synthesized: ai-agents.md, ai-powered-google-ads-workflows.md

**Raw research** (full content) in `research/`:
- `research/newsletters/{source}/` - Full newsletter content
- `research/youtube/{channel}/` - Full transcripts

## Search Process

1. **Understand the query** - What topic, question, or task needs research backing?

2. **Search index files first** - Grep across `context/ideas/*.md` for keywords
   ```bash
   grep -l -i "keyword" /Users/mikerhodes/Projects/brain/context/ideas/*.md
   ```

3. **Read relevant indexes** - Load matching index files to find specific entries

4. **Go deeper if needed** - Search raw research for full context:
   ```bash
   grep -r -l -i "keyword" /Users/mikerhodes/Projects/brain/research/newsletters/
   grep -r -l -i "keyword" /Users/mikerhodes/Projects/brain/research/youtube/
   ```

5. **Synthesize findings** - Return:
   - Which sources had relevant content
   - Key insights found (with source attribution)
   - Recommendations for which full articles/transcripts to read

## Source Expertise

Match topics to expert sources:

- **AI practical applications, work transformation**: ethan (Ethan Mollick)
- **Marketing, analytics, measurement**: avinash (Avinash Kaushik)
- **AI research, technical depth**: batch (Andrew Ng)
- **AI tools, product launches**: ben (Ben's Bites)
- **AI business applications, productivity**: every (Dan Shipper)
- **AI trends, policy, society**: exponential (Azeem Azhar)
- **Google Ads, PPC, digital marketing**: sam (Sam Tomlinson)
- **LLMs, APIs, technical AI**: simon (Simon Willison)
- **Product management, growth**: lenny (Lenny's Podcast)
- **Claude, AI safety**: anthropic
- **Business, markets, investing**: bg2 (Brad Gerstner)
- **Agentic engineering**: indy (Indy Dev Dan)
- **AI technology news**: nopriors, thisday

## Output Format

Return findings as:

```
## Research Findings: [Topic]

### Relevant Sources
- **[Author]** - [Brief description of what they cover]

### Key Insights
1. [Insight with attribution] - Source: [author], [date if available]
2. [Insight with attribution] - Source: [author], [date if available]

### Recommended Reading
- [Full article/transcript path] - Why it's relevant
```

## Example Usage

**Query**: "Find research on AI agents for business automation"

**Process**:
1. Search indexes for "agent", "automation", "workflow"
2. Prioritize: ethan, every, indy, simon, anthropic
3. Check synthesized file: ai-agents.md
4. Return insights with source attribution
